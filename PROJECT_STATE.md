# Project State

## Project Identity

- Repository Name: ti4-drafting-app
- Repository Root: C:\Users\polymergroup\Desktop\TI4 Drafting App
- Primary Remote: origin
- Remote URL: https://github.com/mikejf1991/ti4-drafting-app.git
- Default Branch: main
- Bootstrap Status: initialized 2026-09-26 10:10 Central Daylight Time

## Current State

- Active Objective: Complete for Matt's PR #1: merged, deployed and verified. Exploratory issues #2–5 remain open pending scope/design decisions.
- Live App: https://ti4-drafting-app.vercel.app
- Hosting: Vercel Hobby, team mikejf1991s-projects, project ti4-drafting-app. GitHub main deploys automatically.
- Storage: Existing authorized Supabase project nvbxtjmioxidblitnsck; isolated public.ti4_draft_rooms_v1 table with RLS and no anon/authenticated privileges. No SWPA tables changed.
- Open Issues: No deployment blocker. Known initial-release limits: no public room-creation rate limit or host-link recovery/rotation; retain the host return link. Hosts can replace seat invitations.
- Next Recommended Step: Create a real eight-player room on the live app and distribute each private seat link to its player.

## Active Session Handoff

- Current Branch: main
- Active Task: None; finished PR #1 implementation pass.
- Change Scope: Integrate shared pending placement and hex keyboard focus updates, repair concrete review findings, and verify local/live behavior.
- Worktree Baseline: Tracked files clean at afee320; dirty only from nine pre-existing untracked reference media files.
- Pre-existing Dirty Files: IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, ScreenRecording_08-18-2026 10-30-08_1.mp4.
- Last Meaningful Action: Merged PR #1 as a1a3863, verified Vercel deployment, all thirteen hosted HTTP checks and live pending/cancel UI. LOG-0012 records scope and validation.
- Files In Flight: None after verification closeout. Original reference media untouched.
- Verification Status: Passed 99 tests, final build/TypeScript, thirteen checks each against local storage, real Supabase and the hosted app, plus multi-seat browser checks. Actual scope matches PR #1 and synchronization fixes; verification passed.
- Resume From: Live app above; refresh existing tabs. Local preview remains http://127.0.0.1:3005. Temporary Supabase-backed server3184 stopped.

## Open Loops

- GitHub proposals #2 TTS export, #3 selectable formats/content, #4 Google accounts and #5 deletion/expiry were found alongside finished PR #1. Scope question got no answer; they remain open, with no destructive retention or new account policy assumed.
- Pending previews reveal only the chosen tile/hex to the table, and do not consume a hand tile or gameplay turn. Preview writes have a separate version for atomic conflict checks; legacy rooms default to zero. Passive duplicate seat tabs/reload follow the saved preview until a local edit; retries are bounded with a manual retry control.
- Shared-preview live test room78931c88-f753-425b-b3ea-2ea35859aa53 contains a pending Thibah for speaker Tristen and no confirmed placements. Screenshot/links remain ignored in .scratch; use only as a practice fixture.

- Always use C:\Users\polymergroup\Desktop\TI4 Drafting App for project commands. The chat opened a different Documents\ChatGPT folder; no project work belongs there.
- Supabase credentials remain only in ignored .env.local and sensitive Vercel server environment variables. Never print or commit them. Screenshots/test fixtures remain in ignored .scratch.
- Production browser verification practice room bf568a5c-5285-4f58-9c30-e8707fc97786 contains one confirmed opening placement. API checks also created marked practice rooms only. Do not reuse test seats for a real draft.
- User manually enabled only TI4 in the existing Vercel GitHub installation, preserving SWPA access. Dashboard sign-in and repo access are resolved.
- Speaker opening is a separate 2-blue/2-red hand; regular hands remain undealt until the fourth legal opening placement. Then everyone receives 4-blue/2-red, with speaker-first snake turns and speaker last. Undoing the transition withdraws hands and replay preserves the same deal; legacy rooms migrate without a reset.
- Tile hands show each planet separately with resource/influence values and labeled, color-coded tech skips. Legendary metadata is not a tech skip. Opening and regular hands use the same display, with full stats in accessible button labels.
- Homes remain visible for orientation but do not constrain adjacency during drafting. Ordinary planet/anomaly systems still do. Personal identity and public home names are displayed; gold marks latest placement and purple marks placements since last visit. Visit tracking is browser-local per room/actor; hidden polling does not mark tiles seen, and Mark seen clears only purple highlights.
- Latest hosted browser practice fixture: 3e80f64e-428f-4690-a589-b869e774d142, Return visit verification, seven placements. Private links and hosted-return-visit.png are ignored in .scratch; never use test seats for a real draft.
- Desktop board fits the viewport; sidebar scrolls independently and roster starts collapsed. Wheel input over the interactive board zooms and cancels page scrolling, including at zoom limits; wheel input outside the board scrolls normally. Creuss has no separate inspection dock but tile 51 remains in exports when selected.
