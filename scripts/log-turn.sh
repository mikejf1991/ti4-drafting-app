#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/log-turn.sh --request "..." --discussion "..." --outcome "..." [options]

Options:
  --request TEXT
  --discussion TEXT
  --outcome TEXT
  --files-changed PATH
  --commit-message TEXT
  --commit
  -h, --help
EOF
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

read_text_block() {
  local value="$1"
  local label="$2"
  if [[ -n "$(trim "$value")" ]]; then
    printf '%s' "$value"
    return
  fi

  if [[ ! -t 0 ]]; then
    echo "$label is required. Pass --${label,,} \"...\" when running non-interactively." >&2
    exit 1
  fi

  while [[ -z "$(trim "$value")" ]]; do
    read -r -p "$label: " value
  done
  printf '%s' "$value"
}

require_option_value() {
  local option="$1"
  local value="${2-}"
  if [[ -z "${2+x}" || -z "$(trim "$value")" || "$value" == --* ]]; then
    echo "$option requires a non-empty value." >&2
    exit 1
  fi
  printf '%s' "$value"
}

to_bullets() {
  local text="$1"
  local emitted=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    local trimmed
    trimmed="$(trim "$line")"
    if [[ -n "$trimmed" ]]; then
      printf -- '- %s\n' "$trimmed"
      emitted=1
    fi
  done <<<"$text"
  if [[ "$emitted" -eq 0 ]]; then
    printf -- '- Not provided.\n'
  fi
}

detect_timezone() {
  if [[ -f /etc/timezone ]]; then
    local zone
    zone="$(< /etc/timezone)"
    zone="$(trim "$zone")"
    if [[ -n "$zone" ]]; then
      printf '%s' "$zone"
      return
    fi
  fi

  date +%Z
}

lock_path=""
lock_acquired=0

cleanup_lock() {
  if [[ "$lock_acquired" -eq 1 && -n "$lock_path" ]]; then
    rm -f "$lock_path/owner" 2>/dev/null || true
    rmdir "$lock_path" 2>/dev/null || true
  fi
}

describe_existing_lock() {
  local path="$1"
  if [[ -f "$path/owner" ]]; then
    printf ' Existing lock metadata: %s' "$(tr '\n' ' ' <"$path/owner" 2>/dev/null || true)"
  fi
}

acquire_lock() {
  local repo_root="$1"
  local timeout_seconds="${LOG_TURN_LOCK_TIMEOUT_SECONDS:-120}"
  local retry_seconds="${LOG_TURN_LOCK_RETRY_SECONDS:-0.2}"
  local lock_root="$repo_root/.codex-locks"
  local started_at
  local now
  local waited

  if ! [[ "$timeout_seconds" =~ ^[0-9]+$ ]]; then
    echo "LOG_TURN_LOCK_TIMEOUT_SECONDS must be a whole number of seconds." >&2
    exit 1
  fi

  mkdir -p "$lock_root"
  lock_path="$lock_root/log-turn.lock"
  started_at="$(date +%s)"

  while ! mkdir "$lock_path" 2>/dev/null; do
    now="$(date +%s)"
    waited=$((now - started_at))
    if (( waited >= timeout_seconds )); then
      printf 'Timed out after %s seconds waiting for log lock: %s.' "$timeout_seconds" "$lock_path" >&2
      describe_existing_lock "$lock_path" >&2
      printf '\nAnother logging closeout may still be running. Retry after it finishes, or inspect the lock manually if you are certain no process is active.\n' >&2
      exit 1
    fi
    sleep "$retry_seconds"
  done

  lock_acquired=1
  {
    printf 'pid=%s\n' "$$"
    printf 'host=%s\n' "$(hostname 2>/dev/null || printf unknown)"
    printf 'started=%s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')"
  } >"$lock_path/owner" 2>/dev/null || true
}

find_last_log_number() {
  local logs_dir="$1"
  local latest=0
  local id
  local number
  local log_files=()

  [[ -f "$logs_dir/session-summary.md" ]] && log_files+=("$logs_dir/session-summary.md")
  [[ -f "$logs_dir/session-detail.md" ]] && log_files+=("$logs_dir/session-detail.md")
  if [[ -d "$logs_dir/archive" ]]; then
    while IFS= read -r -d '' archive_file; do
      log_files+=("$archive_file")
    done < <(find "$logs_dir/archive" -type f -name '*.md' -print0 2>/dev/null)
  fi

  if ((${#log_files[@]} == 0)); then
    printf '0'
    return
  fi

  while IFS= read -r id; do
    number="${id#LOG-}"
    if [[ "$number" =~ ^[0-9]+$ && $((10#$number)) -gt "$latest" ]]; then
      latest=$((10#$number))
    fi
  done < <(grep -ho 'LOG-[0-9]\{4\}' "${log_files[@]}" 2>/dev/null || true)

  printf '%s' "$latest"
}

request=""
discussion=""
outcome=""
commit_message=""
commit=0
files_changed=()

while (($#)); do
  case "$1" in
    --request)
      request="$(require_option_value "$1" "${2-}")"
      shift 2
      ;;
    --discussion)
      discussion="$(require_option_value "$1" "${2-}")"
      shift 2
      ;;
    --outcome)
      outcome="$(require_option_value "$1" "${2-}")"
      shift 2
      ;;
    --files-changed)
      files_changed+=("$(require_option_value "$1" "${2-}")")
      shift 2
      ;;
    --commit-message)
      commit_message="$(require_option_value "$1" "${2-}")"
      shift 2
      ;;
    --commit)
      commit=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v git >/dev/null 2>&1; then
  echo "Git is not available on PATH." >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "Not inside a Git repository." >&2
  exit 1
fi

summary_path="$repo_root/logs/session-summary.md"
detail_path="$repo_root/logs/session-detail.md"
logs_dir="$repo_root/logs"

if [[ ! -f "$summary_path" ]]; then
  echo "Expected log file not found: $summary_path" >&2
  exit 1
fi

if [[ ! -f "$detail_path" ]]; then
  echo "Expected log file not found: $detail_path" >&2
  exit 1
fi

request="$(read_text_block "$request" "Request")"
discussion="$(read_text_block "$discussion" "Discussion")"
outcome="$(read_text_block "$outcome" "Outcome")"

if [[ "$commit" -eq 1 ]]; then
  if [[ -z "$(trim "$commit_message")" ]]; then
    echo "Commit requested. Use --commit-message when using --commit." >&2
    exit 1
  fi

  git_author_name="$(git config user.name 2>/dev/null || true)"
  git_author_email="$(git config user.email 2>/dev/null || true)"
  if [[ -z "$(trim "$git_author_name")" || -z "$(trim "$git_author_email")" ]]; then
    echo "Commit requested, but Git author identity is not configured in this Bash environment." >&2
    echo "Set git config user.name and user.email in this repo or omit --commit and commit from a configured shell." >&2
    exit 1
  fi
fi

trap cleanup_lock EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
acquire_lock "$repo_root"

last_number="$(find_last_log_number "$logs_dir")"
next_number=$((last_number + 1))
printf -v entry_id 'LOG-%04d' "$next_number"

timestamp="$(date '+%Y-%m-%d %H:%M') $(detect_timezone)"

summary_block="$(
  cat <<EOF
## $timestamp
Entry ID: $entry_id

Request
$(to_bullets "$request")

Discussion
$(to_bullets "$discussion")

Outcome
$(to_bullets "$outcome")

EOF
)"

if ((${#files_changed[@]})); then
  files_summary="$(
    printf '%s\n' "${files_changed[@]}" | while IFS= read -r line; do
      line="$(trim "$line")"
      [[ -n "$line" ]] && printf -- '- %s\n' "$line"
    done
  )"
else
  files_summary='- None.'
fi

detail_block="$(
  cat <<EOF
## $timestamp
Entry ID: $entry_id

Request
$(to_bullets "$request")

Context
- Logged via \`scripts/log-turn.sh\`.

Actions
- Added matching entries to \`logs/session-summary.md\` and \`logs/session-detail.md\`.
- Optionally staged and committed using this helper when \`--commit\` is used.

Files Changed
$files_summary

Change Scope
- Intent: add or update workflow logging artifacts for this task.
- Actual: automated log entry creation and optional git commit support.

Verification
- Confirmed new entries appended with ID \`$entry_id\`.
- Verified \`logs/session-summary.md\` and \`logs/session-detail.md\` syntax preserved.

EOF
)"

printf '%s\n' "$summary_block" >>"$summary_path"
printf '%s\n' "$detail_block" >>"$detail_path"

if [[ "$commit" -eq 1 ]]; then
  git add -- "$summary_path" "$detail_path"
  if ((${#files_changed[@]})); then
    git add -- "${files_changed[@]}"
  fi
  git commit -m "$commit_message" -m "Log-Entry: $entry_id"
  echo "Committed $entry_id with message: $commit_message"
else
  echo "Logged $entry_id. Use --commit --commit-message to stage and commit now."
fi

echo "Entry ID: $entry_id"
