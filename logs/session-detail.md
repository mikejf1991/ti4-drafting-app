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
## 2026-09-26 11:49 America/Chicago
Entry ID: LOG-0006

Request
- Fit the desktop board, remove mouse-wheel zoom and Creuss inspection, and finish online deployment.

Context
- Baseline: tracked files clean at e22d755; the original nine reference media files remained untracked and unchanged. User resumed the goal after signing into Supabase and Vercel.

Actions
- Removed wheel zoom and the off-board Creuss inspector. Made the desktop board fit the viewport, with separately scrolling controls and a collapsible roster; retained zoom buttons and Creuss export data.
- Applied database/001_rooms.sql only to the isolated TI4 table in the existing authorized Supabase project. No SWPA tables were changed.
- User chose to save Vercel's GitHub access change manually. Confirmed Vercel now lists TI4 alongside SWPA, and opened the TI4 import form on Hobby. Configured the three server-only variables as sensitive values.
- Updated usage/deployment documentation and the project verification skill with the proven real-backend checks. Credentials and screenshots remain ignored.

Files Changed
- app/globals.css, components/galaxy-board.tsx, components/room-client.tsx, README.md, PROJECT_STATE.md, .codex/skills/ti4-local-verification/SKILL.md

Change Scope
- Intent: fit the board and finish online deployment.
- Actual: desktop UI and real Supabase backend verified; Vercel release configured for the next step.

Verification
- Passed: 21 unit tests, TypeScript, and production build.
- Browser: all 61 cells fit at actual 1366x720 and 1440x852 viewports; wheel input left board transform and page scroll unchanged.
- Supabase-backed production server on port 3184 passed all eight API scenarios, including private projections, concurrent updates, invitation replacement, and 52 placements yielding 61 cells.
- Supabase SQL confirmed RLS enabled and no anon/authenticated privileges. Direct REST returned 401/42501 for the public key and 200 for the server key.

Open Items
- Push this verified UI release, deploy the configured Vercel import, and verify the hosted app before completing the goal.
## 2026-09-26 11:55 America/Chicago
Entry ID: LOG-0007

Request
- Finish deploying and verifying the TI4 app after the user-enabled Vercel repository access.

Context
- Baseline: tracked files clean at 8a4a4fa; nine original reference media files remain untracked and untouched. Scope: publish the verified release and record the hosted checks.

Actions
- Imported the private TI4 repository into Vercel Hobby after the user's manual access change. Preserved the existing SWPA repository grant.
- Set TI4_STORAGE=supabase plus the existing authorized Supabase URL and secret key as sensitive server variables. Deployed commit 8a4a4fa to https://ti4-drafting-app.vercel.app.
- Ran the API verifier once on the public deployment and created a separate marked practice room for browser checks. Saved screenshots under ignored .scratch, including hosted-galaxy.png.
- Updated live deployment documentation and verification skill, reset the temporary browser viewport override, stopped the temporary production test server on 3184, and preserved the user's local dev preview on 3005.

Files Changed
- README.md, PROJECT_STATE.md, .codex/skills/ti4-local-verification/SKILL.md

Change Scope
- Intent and actual: publish the completed app, verify the hosted backend and UI, and record an accurate maintenance handoff.

Verification
- Passed: all eight hosted API scenarios, including private access, CAS, invitation revocation, full 52-placement/61-tile map, and cross-room isolation. Homepage, health, JS and CSS returned HTTP 200.
- Passed in independent online seats: preview was visible only to the active player; cancel/reposition preserved the original empty space; confirmation synchronized to another seat; reload retained the confirmed tile.
- Hosted desktop: all 61 cells fit at 1280x720 with no document overflow. Wheel input left scrollY at zero and the board transform unchanged. Earlier local viewport checks passed at 1366x720 and 1440x852.
- Build/unit/type checks passed for the deployed application in LOG-0006; subsequent changes are documentation only. No real-player or SWPA data was modified.

Open Items
- None for the requested implementation and deployment. The host must save its return link; host-link recovery and room-creation rate limiting remain initial-release limitations.
## 2026-09-26 12:08 America/Chicago
Entry ID: LOG-0008

Request
- Restore wheel zoom over the board while preventing wheel input from scrolling the page there; allow normal scrolling outside the board.

Context
- Baseline: tracked files clean at 7643fdb; nine original reference media files unchanged and untracked. User clarified that wheel zoom should remain, with page scrolling suppressed only while the pointer is over the board.

Actions
- Added a non-passive native wheel listener on the interactive board wrapper with preventDefault, stopPropagation, functional bounded zoom updates, and effect cleanup. Compact preview does not install the listener.
- Updated the visible board hint and README to describe scroll-to-zoom and ordinary scrolling outside the board. Preserved the desktop fit and explicit zoom/reset buttons.
- Read-only peer review confirmed the event approach. Restored the local browser test view and viewport after checks.

Files Changed
- components/galaxy-board.tsx, README.md, PROJECT_STATE.md

Change Scope
- Intent and actual: restore wheel zoom without simultaneous page scrolling over the board.

Verification
- Passed: TypeScript, production build, and git diff whitespace checks.
- Browser: wheel up changed scale 1 to 1.1, wheel down restored 1, with scrollY remaining zero. At an 800px-wide scrollable layout, board input zoomed without document scroll; wheel outside the board scrolled the document. At desktop width, sidebar scrollTop advanced to 42 while board scale stayed 1 and scrollY stayed zero.
- Existing drafting rules/API behavior were unchanged, so no new unit tests or full draft reruns were needed.
- Vercel reported deployment completed for bef7004. On the refreshed hosted app, wheel up changed scale 1 to 1.1 while scrollY stayed zero. Saved proof at ignored .scratch/hosted-wheel-zoom.png and reset the board view. No passive-listener warnings appeared in local browser logs.

Open Items
- None for this correction.
## 2026-09-26 17:18 America/Chicago
Entry ID: LOG-0009

Request
- Give only the speaker a separate 2-blue/2-red opening hand, deal 4-blue/2-red regular hands only after all four opening tiles, and follow speaker-first snake turns with double turns at both ends.

Context
- Baseline: tracked files clean at 87428bc; original nine reference media files unchanged and untracked. User clarified a separate opening deal before any regular player hand exists.

Actions
- Changed faction resolution to deal only a two-blue/two-red speaker pool and retain the remaining deck server-side. The fourth confirmed opening placement deals all eight four-blue/two-red normal hands and starts the regular snake with the speaker.
- Hid premature regular hands in legacy opening-room projections immediately; the next successful game action reclaims them into the hidden deck while preserving the eventual per-player allocation. Existing normal-placement and complete rooms retain their progress.
- Undoing the fourth opening move withdraws all regular hands; replay restores the same deal without rerolling. Opening legal alternatives use only the speaker pool; all normal ring and adjacency rules remain active.
- Separated the UI opening hand, added color labels/waiting text, and displayed placement order clockwise from the speaker. Updated rules/README and added exhaustive snake, privacy, undo, transition and legacy regressions.

Files Changed
- lib/engine.ts, lib/types.ts, tests/engine.test.ts, scripts/verify-api.mjs, components/room-client.tsx, README.md, docs/DRAFT_RULES.md, PROJECT_STATE.md

Change Scope
- Intent and actual: correct opening deal timing and visibility, preserve recovery and existing rooms, and verify all 48 regular turns.

Verification
- Passed: all 29 unit tests, production build including TypeScript, and whitespace checks.
- Passed: strengthened real HTTP verifier on local port 3005, ten scenarios including initial opening colors, no premature hands, all four Mecatol neighbors, fourth-placement deal, identical undo/replay, all 48 snake turns, and full 61-cell map.
- Browser: speaker saw exactly four opening tiles and another seat saw zero; after the first and third openings the other seat still saw none; after the fourth both seats received six tiles, with the speaker still on turn.
- Independent review found no privacy, legacy migration, or undo blocker. No production room data was directly edited or reset.
- Vercel reported c6a00a9 deployed successfully. The hosted HTTP verifier passed all ten scenarios using an expected snake derived independently as clockwise plus reverse, repeated three times. It created marked practice rooms only.
- Hosted browser: a fresh speaker saw exactly four tiles labeled two blue/two red while another seat saw zero. The earlier practice room retained its confirmed Lisis/Xanhact placement and showed only the three remaining opening tiles. Saved proof at ignored .scratch/hosted-speaker-opening.png.

Open Items
- None for this correction. Refresh existing browser tabs to load the updated instructions and placement-order display.
## 2026-09-26 17:40 America/Chicago
Entry ID: LOG-0010

Request
- Show each planet resource, influence, and technology skip directly in Your tiles as illustrated in the attached screenshot.

Context
- Baseline: tracked files clean at e97bf13, nine original reference media unchanged and untracked. User requested the tile-hand stats shown in an attached UI mockup; no game-rule change was requested.

Actions
- Added HandTileDetails to render one row per planet with resource/influence values and labeled, colored biotic/cybernetic/propulsion/warfare badges. Legendary metadata is not treated as a technology skip; planetless systems keep their existing name without invented stats.
- Used the display in opening and normal hands. Added full stats/skip text to accessible button labels and narrowed the previous broad span CSS rule so nested details render correctly.
- Preserved existing click-to-inspect behavior, tile selection, board layout, and all backend rules. Documented the hand notation.
- Prepared a marked local practice fixture through the normal HTTP API; private links remain in ignored .scratch/tile-stat-preview.json.

Files Changed
- components/hand-tile-details.tsx, components/room-client.tsx, app/globals.css, README.md, PROJECT_STATE.md

Change Scope
- Intent and actual: display planet stats and tech skips in the tile hand without requiring a click.

Verification
- Passed production build including TypeScript and git diff whitespace checks.
- Browser verified Tar'mann 1/1 Biotic, Vega Major 2/1 and Vega Minor 1/2 Propulsion in separate rows; Primor has no false tech-skip badge and planetless tiles show no invented values.
- No hand or page horizontal overflow at desktop size. Tar'mann still opens its inspector. No new tests were added for this display-only change and backend checks were not rerun.
- Vercel reported 983a7b4 deployed. Hosted browser verified Wellon 1/2 Cybernetic and separate Kraag 2/1 / Siig 0/2, with no hand overflow and no inspector open. Saved proof in ignored .scratch/hosted-tile-stats.png.

Open Items
- None. Refresh existing tabs to load the new hand display.
## 2026-09-27 21:06 America/Chicago
Entry ID: LOG-0011

Request
- Apply the agreed home-system adjacency interpretation and add personal identity, public home names, latest tile and since-last-visit highlights.

Context
- Baseline fd20e91: tracked files clean; original nine reference media files untracked and untouched. User agreed homes attach after ordinary tiles, specifically allowing anomalies beside Empyrean.

Actions
- Excluded home positions from drafting anomaly/wormhole checks while retaining restrictions for non-home systems containing planets and anomalies. Existing rooms require no reset or migration.
- Added name/faction above the board and public owner labels on home hexes, with complete accessible names and compact visible labels. Latest confirmed placement has a gold outline/tag; unseen placements have purple dashed outlines.
- Added browser-local visit snapshots per room and seat/host. First visit starts from the current board; visible updates accumulate until Mark seen or departure. Hidden polling cannot advance the seen snapshot. Optional revision-based placement IDs distinguish undo/replay without changing old records.
- Kept legal/selected/preview markers and wheel zoom intact; documented the rule and browser-local visit behavior. Created only marked practice fixtures, with links/screenshots in ignored .scratch.

Files Changed
- lib/engine.ts,lib/types.ts,lib/placement-updates.ts,tests/engine.test.ts,tests/placement-updates.test.ts,components/use-placement-updates.ts,components/galaxy-board.tsx,components/galaxy-board-highlights.css,components/room-client.tsx,app/globals.css,README.md,docs/DRAFT_RULES.md,PROJECT_STATE.md

Change Scope
- Intent and actual: implement the agreed home adjacency rule, personal identity, public home labels, and latest/since-last-visit highlights.

Verification
- Passed: 46 unit tests, production build including TypeScript, whitespace checks, and ten local HTTP scenarios covering privacy, delayed deal, undo, all snake turns and 61-cell completion.
- Regression tests cover Empyrean, home wormholes, ordinary planet/anomaly restrictions, legacy placement records, undo/replay IDs, visit transitions, hidden polling, separate actor keys and malformed storage.
- Browser: visible identity and all eight home names; navigated away, placed three tiles through normal APIs, and returned to exactly three NEW markers plus the correct LATEST. Mark seen cleared NEW only. Switching seat invitation displayed Henry/Winnu without carrying Tristen's highlights. Desktop had no page overflow; narrow layout retained identity without horizontal overflow.
- Independent engine and hook/integration reviews found no blocker.
- Vercel reported 7867fe3 deployed. Hosted HTTP verifier passed all ten scenarios, including deal timing, privacy, undo/replay, all 48 regular turns and 61 unique board cells.
- Hosted browser: all eight home labels and correct Tristen/Sardakk identity; after departure and three confirmed API moves, exactly Lodor, Tar'mann and Accoen/Jeol Ir were NEW with Accoen/Jeol Ir LATEST. No desktop page overflow. Saved proof at ignored .scratch/hosted-return-visit.png and retained the practice preview tab.

Open Items
- None. Refresh existing player tabs for the updated UI; unseen history begins from the first visit with this feature in that browser.
