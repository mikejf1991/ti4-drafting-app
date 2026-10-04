## 2026-09-26 10:14 America/Chicago
Entry ID: LOG-0001

Request
- Use the Desktop TI4 project; bootstrap private ti4-drafting-app; inspect rules and discuss async faction allocation, seating, speaker, and placement.

Discussion
- Confirmed eight players, private seat links, Supabase, desktop first, five ranked factions with random allocation priority, clockwise priority seating, private placement preview, and conditional Ghosts tile 51. Photos specify 4 blue plus 2 red per player, four extra speaker placements, snake order, ring completion and adjacency constraints. Independent random speaker and priority-preserving fallback are proposals.

Outcome
- Created the private GitHub remote and startup files; documented confirmed rules and pending decisions. Reviewed all eight images, verified tile 51 and official speaker rule, and passed Bash syntax verification. No app implementation or deployment. Initial bootstrap commit and push follow.
## 2026-09-26 10:38 America/Chicago
Entry ID: LOG-0002

Request
- Confirm priority-preserving faction fallback, conceal choices to prevent counter-picking, independent random speaker, all 24 factions, and identify remaining decisions.

Discussion
- Accepted pause at any exhausted priority before lower assignments, independent random speaker, and all 24 base-game/PoK factions. Choices must remain hidden during selection. A remaining-faction list exposes the taken set; propose private expanded fallback rankings. Final reveal timing remains open: simultaneous reveal before map placement is proposed, not yet approved.

Outcome
- Updated discovery documents only. Two privacy choices remain: blind fallback versus visible availability, and faction reveal timing. No application implementation or service changes.
## 2026-09-26 10:42 America/Chicago
Entry ID: LOG-0003

Request
- Simplify faction selection to eight ranked factions per player so fallback edge cases disappear.

Discussion
- Each player ranks eight distinct eligible factions from the fixed 24-faction pool. At most seven factions can be assigned before the last player, guaranteeing at least one available ranked choice. Remove free picks, expanded fallback rankings, and mid-allocation pauses. Keep random priority and hidden choices; final reveal timing remains unconfirmed.

Outcome
- Updated README, draft rules, and project state. Documentation-only change; no app implementation. Checked the assignment guarantee and retained the separate reveal-timing question.
## 2026-09-26 11:13 America/Chicago
Entry ID: LOG-0004

Request
- Build the eight-player TI4 drafting app with minimal user involvement and eight private ranked factions per seat.

Discussion
- Implemented real hex-board drafting, private invitation access, automatic faction allocation, clockwise priority, independent speaker, opening placements and snake order; prepared an isolated Supabase table. Online setup needs dashboard sign-ins.

Outcome
- Local application, build, 21 tests, full API draft, independent-seat browser checks and exports pass. Supabase migration and Vercel deployment remain pending user sign-in; goal stays active.
## 2026-09-26 11:17 America/Chicago
Entry ID: LOG-0005

Request
- Continue the app implementation and online deployment goal.

Discussion
- Previous continuation made no progress because dashboard access was unchanged. Revalidated both live sign-in pages and the clean tracked worktree. The same access barrier persisted for three goal turns; runtime Supabase keys cannot provision the schema and no Vercel session is available.

Outcome
- Goal marked blocked pending user Supabase and Vercel sign-in. Local implementation remains verified and pushed at 17d06ba; online migration and deployment remain incomplete.
## 2026-09-26 11:49 America/Chicago
Entry ID: LOG-0006

Request
- Fit the desktop board, remove mouse-wheel zoom and Creuss inspection, and finish online deployment.

Discussion
- Applied the isolated Supabase migration and verified actual private-seat HTTP flows. User manually enabled TI4 access in the existing Vercel GitHub installation; Vercel now lists the repository.

Outcome
- Desktop changes and real Supabase backend passed verification. Push this verified release before importing and testing the hosted app.
## 2026-09-26 11:55 America/Chicago
Entry ID: LOG-0007

Request
- Finish deploying and verifying the TI4 app after the user-enabled Vercel repository access.

Discussion
- Used Vercel Hobby with existing Supabase storage and sensitive server-only environment variables. Verified public deployment and independent private-seat browser behavior.

Outcome
- Live at https://ti4-drafting-app.vercel.app; all eight hosted API scenarios and browser preview, placement, persistence, board-fit and wheel checks passed. No paid upgrade or SWPA table changes.
## 2026-09-26 12:08 America/Chicago
Entry ID: LOG-0008

Request
- Restore wheel zoom over the board while preventing wheel input from scrolling the page there; allow normal scrolling outside the board.

Discussion
- Use a native non-passive wheel listener scoped to the interactive board, with preventDefault, bounded functional zoom updates, and effect cleanup. Compact landing preview remains unaffected.

Outcome
- TypeScript and production build passed. Local checks confirmed board zoom without page scrolling, independent sidebar scrolling, and page scrolling outside the board. Deployed bef7004; hosted wheel input changed scale 1 to 1.1 with scrollY remaining zero.
## 2026-09-26 17:18 America/Chicago
Entry ID: LOG-0009

Request
- Give only the speaker a separate 2-blue/2-red opening hand, deal 4-blue/2-red regular hands only after all four opening tiles, and follow speaker-first snake turns with double turns at both ends.

Discussion
- Corrected premature dealing and the combined ten-tile speaker display. Preserve existing rooms and undo by withdrawing regular hands into the hidden deck and restoring the same deal without rerolls. Placement order display now begins with the speaker.

Outcome
- Deployed c6a00a9. Passed 29 unit tests, production build, ten local and ten hosted HTTP scenarios, two-seat browser transition checks, and hosted fresh/legacy room checks. Verified all 48 normal picks and preserved existing rooms without reset.
## 2026-09-26 17:40 America/Chicago
Entry ID: LOG-0010

Request
- Show each planet resource, influence, and technology skip directly in Your tiles as illustrated in the attached screenshot.

Discussion
- Added compact per-planet R/I rows and labeled color-coded tech badges to both normal and opening hands. Keep multi-planet values separate and exclude legendary status from tech skips; include stats in accessible button labels.

Outcome
- Deployed 983a7b4. Build/TypeScript and local/hosted browser checks passed: separate planet values, color-labeled tech skips, no horizontal overflow, and retained click-to-inspect. The live hand displays stats before any inspector is opened.
## 2026-09-27 21:06 America/Chicago
Entry ID: LOG-0011

Request
- Apply the agreed home-system adjacency interpretation and add personal identity, public home names, latest tile and since-last-visit highlights.

Discussion
- Homes are orientation previews until drafting finishes and do not constrain anomaly or wormhole placement. Visit snapshots stay local per browser, room and seat; hidden polling cannot consume unseen tiles, and undo/replay uses stable placement IDs.

Outcome
- Deployed 7867fe3. Passed 46 unit tests, production build, ten local and ten hosted HTTP scenarios, and browser checks for returning visits, Mark seen, identity switching and layout. Live browser showed exactly the three tiles placed while away, all eight home names, and correct player/faction.
## 2026-10-04 17:11 America/Chicago
Entry ID: LOG-0012

Request
- Implement Matt binerbuddy GitHub update requests.

Discussion
- Found finished PR1 for shared placement previews and exploratory issues2-5. Scope question received no reply; proceeded with the finished PR only, leaving proposals open. Reviewed and fixed stale-preview races, transient failures and same-seat tab conflicts while preserving confirmed moves and private hands.

Outcome
- Merged PR1 as a1a3863 and verified Vercel deployment. Passed 99 tests, production build, thirteen checks each on local storage, real Supabase and the live app, plus multi-seat and live browser preview/cancel checks. Issues2-5 remain open as proposals; no scope reply was received.
