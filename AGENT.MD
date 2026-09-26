# Agent Defaults

This file defines the default behavior for Codex instances working in this project.

## Goals

1. Keep Git connected so work can be pushed, shared, and restored.
2. Keep a short summary log and a compact restoration log.
3. Keep mutable state separate from stable policy.
4. Preserve enough continuity to resume work without rereading large history.
5. Minimize standing instruction and logging overhead.

## Startup Checks

At the start of a session or before the first meaningful code change:

1. Check whether the current workspace is inside a Git repository.
2. If the workspace is inside Git:
   - Inspect whether a remote already exists.
   - If a usable remote exists, use it and do not ask again.
   - If no remote exists, prompt the user once for the repository name or ask whether they want to skip remote setup for now.
   - Unless the user says otherwise, default to creating a GitHub repo under `mikejf1991/<repo-name>` and connect it as `origin`.
3. If the workspace is not inside Git:
   - Prompt the user once for the desired repository name or explicit opt out.
   - Unless the user says otherwise, initialize Git locally and create a private GitHub repo under `mikejf1991/<repo-name>`.
   - If they opt out of the remote, continue locally and do not ask again in the same session unless they bring Git back up.
4. Encourage remote setup, but allow the user to decline without blocking the task.

## Project Bootstrap

The default agent should become project-specific on first activation once the project has a Git repository or a confirmed remote.

Bootstrap behavior:

1. After Git is initialized or a remote is configured, inspect the repo state and collect the project-specific Git details that matter for continuity.
2. If `PROJECT_STATE.md` does not yet contain a project identity section, create or update it with the discovered repository details.
3. If `PROJECT_STATE.md` already contains a project identity section, refresh it when the repo name, default branch, or primary remote changes.
4. The bootstrap update should happen once the project has enough Git identity to be meaningful. Do not block normal work if the user wants to defer it.

The goal is for the agent to stop behaving like a generic default agent and start behaving like a project-bound agent with stable repo context.

## Project State File

Maintain mutable project facts in `PROJECT_STATE.md`, not in `AGENT.MD`.

Use this format:

```md
# Project State

## Project Identity

- Repository Name: <repo-name>
- Repository Root: <repo-root>
- Primary Remote: <remote-name>
- Remote URL: <remote-url>
- Default Branch: <default-branch>
- Bootstrap Status: initialized YYYY-MM-DD HH:MM Timezone

## Current State

- Active Objective: Keep the agent, logging, and Git workflow aligned.
- Open Issues: None.
- Next Recommended Step: Continue refining project automation only when needed.

## Active Session Handoff

- Current Branch: main
- Active Task: None.
- Last Meaningful Action: Bootstrap completed and logs aligned.
- Files In Flight: None.
- Verification Status: No pending verification.
- Resume From: Continue with the next user request.

## Open Loops

- None.
```

Rules:

- Keep `PROJECT_STATE.md` short, factual, and current.
- Update the project identity section when the repo connection changes.
- Update the current state section when the active objective, blockers, or next step materially change.
- Update `Active Session Handoff` when branch, active task, files in flight, verification status, or resume point materially change.
- Keep `Open Loops` to unresolved items that matter for the next session. Remove closed loops instead of preserving stale history there.
- If the project is only local, record that no remote is configured yet.
- If the user opts out of Git, do not invent project identity values.
- Prompt once when `PROJECT_STATE.md` is missing and Git exists but the remote is still unset.

## Git Prompt Rules

Use a short prompt. Do not repeatedly ask.

Preferred wording:

"This project does not have a connected GitHub remote. If you want the default setup, send the repo name and I will create `mikejf1991/<repo-name>` and wire it up. If you want a different owner or an existing URL, say so. If not, say skip and I will continue locally."

If Git exists but this project has not yet been initialized, also allow this wording:

"This project can be initialized with its repo details so future sessions treat it as project-specific. If you want that, I will record the current Git identity in `PROJECT_STATE.md` after setup."

If the user declines, continue normally and do not ask again in the same session unless they bring Git back up.

## Git Workflow Defaults

For substantive project changes, the default agent should finish by committing and pushing unless the user asks not to.

Substantive changes include:

- Source code changes
- Configuration changes
- Instruction-file changes
- Documentation changes that affect project workflow or behavior
- New files or deleted files that matter to the project

Non-substantive changes include:

- Exploratory typing that does not change project interpretation, workflow, or decisions.
- Temporary experiments the user has not approved to keep
- Incomplete work that still has known blockers
- Changes that should obviously be grouped with likely follow-up work in the same session

Meaningful Turn Definition
- A turn is meaningful when it requires any of the following, even when no files changed:
  - Material, fixture, or process recommendations or restrictions.
  - Method or parameter changes such as speed, time, temperature, loading, fluid or additives, or mixer setup.
  - Decision logic, acceptance criteria, risk interpretation, or pass or fail interpretation.
  - Alternate methods, troubleshooting paths, or budget, schedule, or scope tradeoffs tied to execution.
- Trivial wording or help questions are non-meaningful only when they do not alter a decision or workflow path.

Default behavior:

1. For substantive work, record a short change scope and a worktree baseline before the first edit.
2. If the repository is cleanly configured with a usable remote, stage the relevant project files after completing a substantive change.
3. Create or update the relevant log entries before commit so the work has a stable log reference.
4. Create a focused commit message that describes the completed change and include the latest relevant log entry ID in the commit footer.
5. Push the commit to the tracked remote branch.
6. Report the commit hash, push status, and referenced log entry ID.

Required task-start snapshot for substantive work:

- Change Scope: one-line statement of intended change.
- Worktree Baseline: `clean` or `dirty`.
- Pre-existing Dirty Files: explicit file list or `None`.

Required task-close snapshot for substantive work:

- Actual Change Scope: one-line statement of completed change.
- Verification Status: `passed`, `failed`, `partial`, or `not run`.

Reply Gate
- Before any final response, if the turn is meaningful, complete both log entries first.
- For meaningful turns:
  - write matching `session-summary.md` and `session-detail.md` entries with matching `Entry ID`s;
  - if any file changes are required by the turn, stage and commit before responding;
  - if no file changes are needed, respond only after the log pair is written.
- If a meaningful turn was missed, open a closure-correction entry in the next turn before any other non-log action.

Programmatic Log Workflow
- For materially repetitive logging steps, use `./scripts/log-turn.sh`.
- Run `./scripts/log-turn.sh --request "..." --discussion "..." --outcome "..."` to append both logs and auto-assign the next `LOG-####`.
- Add `--commit-message "..." --commit` to stage the two logs and commit in one step.
- Use `--files-changed <paths>` when the task also changes non-log files.
- Preferred call for log-only workflow tasks: `./scripts/log-turn.sh --request ... --discussion ... --outcome ...`.
- In parallel task scenarios, do not bypass the helper for programmatic logging because it is the lock owner and ID allocator.
- If the shell is PowerShell and WSL or another Bash environment is unavailable, append the logs manually instead of recreating a second logging helper.

Guardrails:

- Do not commit or push if the user explicitly says not to.
- Do not commit unrelated dirty files unless the user asked for that.
- Do not commit partial work just to satisfy the rule.
- At task start, distinguish pre-existing user changes from the agent's changes.
- If the worktree is already dirty, stage only the files relevant to the completed task unless the user explicitly asked for a broader commit.
- If the remote is missing or push fails, explain the blocker and leave the local commit if that is safe.
- Prefer one coherent commit per completed task rather than many tiny commits.
- Separate commits are allowed when they make history clearer.
- Prefer a commit footer in this format: `Log-Entry: LOG-0004`.

This default is meant to improve continuity, not create noisy history.

## Parallel Work Workflow

Git handles parallel substantive work best through separate branches or git worktree folders.

For independent tasks:

1. Prefer creating a task worktree from the repo root:

```bash
git worktree add ../<project-task-name> -b <branch-name>
```

2. Keep task-specific edits isolated to that worktree and branch.
3. Verify the task in its worktree before merging.
4. Merge back intentionally after verification.
5. Avoid two agents editing the same file unless they coordinate explicitly.

Multiple agents or scripts may work in the same repository, but only one logging closeout should run at a time. For parallel substantive tasks, each task should close with one coherent summary/detail log pair and, when committing, include only the files relevant to that task.

## Logging Rules

Create a `logs/` directory if it does not exist.

Maintain two logs:

1. `logs/session-summary.md`
   - Short, human-readable project log.
   - One entry per completed task, meaningful decision, blocker, or workflow-affecting question.
   - Keep each entry to 3 to 6 lines.
   - Every entry must include a full timestamp with date, time, and timezone.
   - Every entry must include a stable incremental log entry ID.

2. `logs/session-detail.md`
   - Higher-detail restoration log.
   - One entry per completed task that changed code, configuration, workflow, project decisions, or recorded a blocker that affected execution.
   - Summarize the request, important context, actions taken, files touched, outputs, and unresolved items.
   - Do not store full transcripts or large command outputs.
   - Every entry must include a full timestamp with date, time, and timezone.
   - Every entry must include the same stable incremental log entry ID used by the matching summary entry.

## Parallel Logging Behavior

- `scripts/log-turn.sh` owns log ID allocation and must be used for programmatic logging.
- The helper serializes closeout work with a repo-local lock at `.codex-locks/log-turn.lock`.
- The lock is acquired with atomic directory creation and is held while the helper reads the latest log ID, assigns the next `LOG-####`, appends both active logs, stages files, and commits when `--commit` is used.
- If another closeout is running, wait for the helper to finish rather than manually assigning a log ID.
- Manual log edits should be avoided while another task may be closing out.
- If the helper times out waiting for the lock, treat it as a blocker and inspect the repo state before retrying. Do not delete a lock unless you are certain no logging process is active.

## Session Completion

Treat a task as complete when one of the following is true:

- The requested substantive change was implemented and verified as far as practical.
- A meaningful project decision was reached and recorded.
- A blocker was identified clearly enough that the next step is explicit.

Only create new log entries at task completion or blocker discovery, not for every intermediate question.

Task-closure completeness rule:
- If a single task turn contains multiple substantive questions, process decisions, or controls or benchmarks, capture all materially relevant items in the same log pair.
- Use this structure in the summary entry: `Request` for all user asks, `Discussion` for all decision content, `Outcome` for result plus next step.
- If an entry was posted before the full scope was documented, add a follow-up entry immediately naming the missed material and mark it as a closure-correction.

Mandatory Decision Logging
- If a user question changes experimental method, expected outcomes, interpretation, risk logic, or execution path, it must be logged immediately in both logs.
- Even without code or config edits, log-only changes are still substantial if they materially affect project decisions.

## Log Entry IDs

Use one shared incremental ID sequence across both logs.

Format:

- `LOG-0001`
- `LOG-0002`
- `LOG-0003`

Rules:

- The summary and detail entry for the same task must share the same ID.
- Increment by one for each new logged task.
- Keep IDs stable once written.
- Keep one shared incremental `LOG-####` sequence across active logs and archived logs.
- When committing substantive work, reference the highest relevant completed log entry ID in the commit message footer.
- If one commit covers multiple logged tasks, use a footer in this format: `Log-Entries: LOG-0007, LOG-0008`.

## Summary Log Format

Use this format:

```md
## 2026-03-23 23:45 America/Chicago
Entry ID: LOG-0001
Request: User asked to connect the local repo to GitHub and test commit or push flow.
Discussion: Reviewed Git identity, remote setup, and button versus terminal push behavior.
Outcome: Remote was corrected and terminal push succeeded.
```

## Detail Log Format

Use this format:

```md
## 2026-03-23 23:45 America/Chicago
Entry ID: LOG-0001
Request
- Connect local workspace to GitHub and diagnose push issues.

Context
- Repo existed locally.
- Commit initially failed because `user.name` and `user.email` were unset.
- Push later failed because the remote URL was malformed.

Actions
- Checked repo root, remotes, branch tracking, and local Git config.
- Corrected the remote URL and verified `main` tracked `origin/main`.
- Confirmed terminal push worked even though the UI push button still reported no configured remote.

Files Changed
- None.

Change Scope
- Intended change at task start.

Actual Change Scope
- What was completed.

Verification
- Command or check: result.
- Command or check: result.
- If not run, say why.

Open Items
- Codex Desktop push button may require a refresh or may be using stale cached state.
```

Timestamp rules for both logs:

- Use `YYYY-MM-DD HH:MM Timezone`, for example `2026-03-23 23:45 America/Chicago`.
- Use local project-session time when available.
- Start every log entry with the timestamp heading.
- Put the `Entry ID` line immediately below the timestamp heading.
- If multiple actions happen within the same user turn, keep them under one timestamped entry unless they are meaningfully separate tasks.

## Logging Boundaries

Keep logs concise:

- Do not quote the whole user prompt unless a precise phrase matters.
- Do not paste large diffs.
- Do not paste long command output.
- Do not duplicate stable policy text that already exists in `AGENT.MD`.
- Do not log secrets, tokens, passwords, cookies, or auth material.
- Do not create a detail entry for trivial chatter with no project impact.
- Do not create a new entry for routine back-and-forth unless it changed execution, decisions, or recovery needs.

## Token Discipline

To control token use:

1. Do not reread the full logs by default.
2. Only read the latest relevant entries when continuity is needed.
3. Append compact summaries instead of transcripts.
4. Prefer summarizing decisions, changed files, and unresolved issues over reproducing reasoning.
5. Keep the active logs as `logs/session-summary.md` and `logs/session-detail.md`.
6. When either active log becomes large, archive it to a dated file such as `logs/archive/session-detail-YYYY-MM.md` or `logs/archive/session-summary-YYYY-MM.md`.
7. After archiving, start fresh active logs with a short carry-forward entry summarizing current project state, latest active objective, open loops, and the last archived log ID.
8. Do not create per-task log files by default.
9. Keep one shared incremental `LOG-####` sequence across active and archived logs.

## Retrieval Policy

Use the cheapest source that can answer the current need:

1. Read `PROJECT_STATE.md`.
2. Read the newest relevant entry in `logs/session-summary.md`.
3. If more context is needed, read the newest relevant entry in `logs/session-detail.md`.
4. If the answer likely depends on older history, archived decisions, or prior implementation details that are no longer in the active logs, use semantic search over archived detailed logs or indexed project history.
5. Retrieve only the most relevant chunks first, then expand only if necessary.
6. Prefer retrieval of concise decision-oriented chunks over long narrative chunks.

## Semantic Search Guidance

Semantic search is intended for historical recovery, not routine startup.

- Use it when the active logs do not answer the question.
- Search for prior decisions, design rationale, changed file references, workflow conventions, and unresolved issues.
- Retrieve small, timestamped chunks that preserve enough context to understand what happened.
- When possible, include the timestamp and source log file in retrieved results.
- After retrieval, summarize the relevant findings into the current response or into a fresh detail-log entry instead of pasting large excerpts.
- Do not load the entire archive into context unless there is no narrower recovery path.

## Restore Priority

When restoring context from prior work, prefer this order:

1. `PROJECT_STATE.md`
2. Latest `logs/session-summary.md` entry
3. Latest `logs/session-detail.md` entry
4. Semantic search over archived detailed logs or indexed history
5. Current Git status and recent commits
6. Relevant files in the workspace

The agent should rely on the logs as a recovery aid, not as a full historical transcript.
