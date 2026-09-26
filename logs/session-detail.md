## 2026-09-26 10:14 America/Chicago
Entry ID: LOG-0001

Request
- Use the Desktop TI4 project; bootstrap private ti4-drafting-app; inspect rules and discuss async faction allocation, seating, speaker, and placement.

Context
- Logged via `scripts/log-turn.sh`.
- Correct project root is C:\Users\polymergroup\Desktop\TI4 Drafting App; the original chat working directory was an unrelated empty Documents\ChatGPT folder.
- Worktree Baseline: not yet a Git repository; pre-existing local reference files only.
- Pre-existing Dirty Files: IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, ScreenRecording_08-18-2026 10-30-08_1.mp4. All remain unchanged and untracked.

Actions
- Added matching entries to `logs/session-summary.md` and `logs/session-detail.md`.
- Ran the bootstrap skill helper and created private mikejf1991/ti4-drafting-app after the user selected that name.
- Inspected all eight reference images; verified standard speaker selection against the official PoK Living Rules Reference and checked tile 51 accessibility.
- Recorded agreed requirements, photographed map rules, asset ranges, and open decisions in docs/DRAFT_RULES.md. Application implementation remains on hold pending discussion.
- Committed and pushed bootstrap and discovery files to origin/main. Added a shell-script LF rule after Git warned that Windows checkout would otherwise convert the WSL helper to CRLF.

Files Changed
- .gitattributes
- .gitignore
- AGENT.MD
- PROJECT_STATE.md
- README.md
- docs/DRAFT_RULES.md
- scripts/log-turn.sh
- logs/archive/.gitkeep

Change Scope
- Intended: bootstrap Git/GitHub and project workflow; inspect reference images and discuss draft requirements.
- Actual: installed startup files and private remote, documented rules and accepted scope, and recorded pending choices. No app code, service configuration, or deployment.

Verification
- Confirmed new entries appended with ID `LOG-0001`.
- Verified `logs/session-summary.md` and `logs/session-detail.md` syntax preserved.
- Verification Status: passed for bootstrap and discovery; application tests are not applicable because there is no implementation.
- GitHub CLI confirmed the remote is private; local root, main branch, and origin are correct.
- WSL bash syntax check passed for scripts/log-turn.sh; copied agent and logger hashes match skill assets.
- Initial bootstrap commit 8f35769 pushed successfully. A follow-up in this same entry pins shell-script line endings and refreshes closeout state.
- Tile 51 endpoint returned HTTP 200 and image/webp. All other requested endpoints were checked in the earlier discovery turn.

Open Items
- Accept or alter the proposed independent random speaker and standard speaker-first placement order.
- Decide whether exhausted faction rankings pause allocation before lower priorities or resolve after automatic assignments.
- Confirm the proposed 24 base-game plus PoK factions and any exclusions/additions.
- Supabase is chosen but not provisioned. Frontend hosting is undecided. MP4 was not reviewed; photographed rules were sufficient for this discussion.
## 2026-09-26 10:38 America/Chicago
Entry ID: LOG-0002

Request
- Confirm priority-preserving faction fallback, conceal choices to prevent counter-picking, independent random speaker, all 24 factions, and identify remaining decisions.

Context
- Logged via `scripts/log-turn.sh`.
- Worktree Baseline: tracked files clean; nine pre-existing user media files remain untracked and untouched.
- Pre-existing Dirty Files: IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, ScreenRecording_08-18-2026 10-30-08_1.mp4.
- Confirmed: pause faction allocation for any exhausted priority before lower assignments; all 24 factions; independently random speaker; no revelation of others' choices during faction selection.
- Open: visible remaining-faction choices leak the taken set. Proposed private expanded ranking and simultaneous final reveal before map building both need user agreement.

Actions
- Added matching entries to `logs/session-summary.md` and `logs/session-detail.md`.
- Optionally staged and committed using this helper when `--commit` is used.

Files Changed
- README.md
- PROJECT_STATE.md
- docs/DRAFT_RULES.md

Change Scope
- Intent: add or update workflow logging artifacts for this task.
- Actual: automated log entry creation and optional git commit support.
- Task Change Scope: update requirements and handoff state for the user's decisions; no application work.
- Actual Task Scope: updated README.md, PROJECT_STATE.md, docs/DRAFT_RULES.md, and paired logs. Removed resolved speaker/pool/fallback timing questions and recorded two remaining privacy choices.

Verification
- Confirmed new entries appended with ID `LOG-0002`.
- Verified `logs/session-summary.md` and `logs/session-detail.md` syntax preserved.
- Verification Status: passed documentation consistency review; no executable code changed and application tests are not applicable. Check the staged diff for whitespace before committing and pushing this entry.
## 2026-09-26 10:42 America/Chicago
Entry ID: LOG-0003

Request
- Simplify faction selection to eight ranked factions per player so fallback edge cases disappear.

Context
- Logged via `scripts/log-turn.sh`.
- Change Scope: update discovery requirements for eight distinct faction choices and remove fallback allocation.
- Worktree Baseline: tracked files clean; pre-existing untracked files were IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, and ScreenRecording_08-18-2026 10-30-08_1.mp4. All remain unchanged.
- Actual Change Scope: updated README, PROJECT_STATE, DRAFT_RULES, and paired logs only; no application implementation.
- Confirmed rule: eight unique eligible preferences guarantee an assignment because no more than seven factions have been claimed. Keep the 24-faction pool fixed and faction assignments unique. Removed free picks, fallback rankings, and allocation pauses.
- Still open: when opponents' final faction assignments become public. The user did not change that decision in this turn.
- Verification Status: passed logical review and consistency review of the three current requirements documents. No executable code changed; application tests are not applicable.

Actions
- Added matching entries to `logs/session-summary.md` and `logs/session-detail.md`.
- Optionally staged and committed using this helper when `--commit` is used.

Files Changed
- README.md
- PROJECT_STATE.md
- docs/DRAFT_RULES.md

Change Scope
- Intent: add or update workflow logging artifacts for this task.
- Actual: automated log entry creation and optional git commit support.

Verification
- Confirmed new entries appended with ID `LOG-0003`.
- Verified `logs/session-summary.md` and `logs/session-detail.md` syntax preserved.
## 2026-09-26 11:13 America/Chicago
Entry ID: LOG-0004

Request
- Build the eight-player TI4 drafting app with minimal user involvement and eight private ranked factions per seat.

Context
- User authorized implementation and SWPA setup investigation with minimal involvement. Logger allocated this entry.
- Baseline: tracked files clean at 4141b2c; nine original IMG_* reference images and the MP4 were already untracked and remain untouched.

Actions
- Built Next/React app, 80 local tile assets, 61-cell board, private seat links, and automatic allocation of eight ranked faction choices. Final assignments reveal together; rankings remain private.
- Implemented clockwise priority, independently random speaker, four opening placements, 48 snake placements, ring/adjacency rules, private previews, confirmation, host undo, invite replacement, and PNG/SVG/JSON exports.
- Added private server projections and atomic revision checks with explicit local file storage or an isolated Supabase table. Prepared migration; no remote schema changed.
- Inspected authorized SWPA credential sources without printing values. Runtime keys reside only in ignored .env.local. Dashboard management access and Vercel sign-in are still required.
- Corrected UI seat ordering, polling races, SVG clicks, confirmation position, and deployment bundle tracing. Saved a project verification skill.

Files Changed
- app, components, lib, data, database, public, tests, scripts, config, README.md, docs/DRAFT_RULES.md, PROJECT_STATE.md, .codex/skills/ti4-local-verification/SKILL.md

Change Scope
- Intent: implement, verify, and publish the complete app.
- Actual: local application and deployment materials completed and verified; publication awaits dashboard sign-in.

Verification
- Passed: 21 Vitest tests, TypeScript, warning-free production build, npm audit with zero vulnerabilities.
- Passed on development and production servers: actual HTTP private access, concurrent rankings/actions, unique assignments, hidden speaker pool, invitation revocation, wrong-turn rejection, undo, full 52 placements/61 cells, cross-room isolation, and practice restrictions.
- Passed in independent browser seats: eight-choice ranking lock, private preview, cancel/reposition, confirmed placement synchronization, and reload persistence.
- Passed exports: PNG visually inspected; SVG has 61 board polygons plus Creuss; JSON has eight players and 52 placements with no tokens, rankings, or private hands.
- Matching LOG-0004 entries created. Original media, credentials, local room data, and verification artifacts excluded from commit.

Open Items
- Pending user Supabase/Vercel sign-in: run database/001_rooms.sql, configure server-only environment variables, deploy, and verify real Supabase-backed actions before completing the goal.
- Local preview remains on port 3005. Completed browser test room d3c993f0-7e61-4e8e-a527-790ad0fdc723; screenshot .scratch/completed-galaxy.png. Production smoke tests used port 3184.
- Known limits: no public room-creation rate limit or host-link recovery/rotation; host must retain its private return link. No paid services or deployment created.
## 2026-09-26 11:17 America/Chicago
Entry ID: LOG-0005

Request
- Continue the app implementation and online deployment goal.

Context
- Tracked baseline clean at 17d06ba; original nine untracked reference media files unchanged. Scope: revalidate deployment access and record the blocked handoff.
- Prior continuation was no progress: sign-in screens were unchanged. The same genuine blocker now persisted across three consecutive goal turns.

Actions
- Checked current browser state: Supabase displayed Sign in to your account; Vercel's GitHub flow displayed Sign in. No newly authorized dashboard access was available.
- Preserved the sign-in tabs and local practice views. Called update_goal, which returned blocked.
- Updated PROJECT_STATE.md and created matching log entries; made no app or remote infrastructure changes.

Files Changed
- PROJECT_STATE.md

Change Scope
- Intended and actual: verify unchanged access barrier and save an accurate deployment handoff.

Verification
- Passed: live UI checks confirmed both sign-in barriers. Git verified tracked source unchanged at the previously tested implementation.
- Runtime Supabase key cannot create the isolated table; no Vercel authenticated session is available. Online completion remains unproven and incomplete.
- No tests rerun because only status/log documentation changed.

Open Items
- User signs into the retained Supabase and Vercel tabs, then resumes work. Next: run the isolated migration, configure production server environment, deploy, and verify the hosted app before marking complete.
