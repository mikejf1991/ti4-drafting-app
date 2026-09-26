# Project State

## Project Identity

- Repository Name: ti4-drafting-app
- Repository Root: C:\Users\polymergroup\Desktop\TI4 Drafting App
- Primary Remote: origin
- Remote URL: https://github.com/mikejf1991/ti4-drafting-app.git
- Default Branch: main
- Bootstrap Status: initialized 2026-09-26 10:10 Central Daylight Time

## Current State

- Active Objective: Build, verify, and publish the complete TI4 drafting app with minimal user involvement.
- Open Issues: Vercel import awaits the user's manual GitHub repository-access save. Supabase and the revised desktop UI are verified.
- Next Recommended Step: Import the latest main branch in Vercel, configure server-only Supabase variables, deploy, and verify the hosted app.

## Active Session Handoff

- Current Branch: main
- Active Task: Resumed by user after sign-in. Finish online deployment and fit the desktop board without mouse-wheel zoom or a separate Creuss inspection area.
- Last Meaningful Action: Removed wheel zoom and the Creuss inspection panel; fitted all 61 cells within tested desktop viewports. Applied the TI4-only Supabase migration and passed all eight HTTP verification scenarios against real Supabase.
- Files In Flight: Completed UI, documentation, verification skill, and LOG-0006 checkpoint. Baseline e22d755 tracked clean; the original nine reference media remain unchanged and untracked. Root owns deployment/logs.
- Verification Status: Passed: 21 unit tests, TypeScript, production build, desktop fit at 1366x720 and 1440x852, wheel stability, and real Supabase-backed full draft/privacy/concurrency checks. SQL permissions: RLS true, anon/authenticated false, server true. Direct REST public key denied 401/42501; server key 200. Hosted checks remain pending.
- Resume From: Vercel new-project tab and GitHub installation 138968674 are retained. User chose to save the repository permission change themselves; do not click Save. Local preview is http://127.0.0.1:3005; Supabase-backed production check server is http://127.0.0.1:3184. Do not treat local functionality as completion of the online app goal.

## Open Loops

- Use C:\Users\polymergroup\Desktop\TI4 Drafting App for every project command. The chat initially opened a different, empty Documents\ChatGPT folder; no project work belongs there.
- Default selected under user's autonomy instruction: all assignments reveal together after all rankings lock, before map building; rankings stay private.
- Reuse existing Supabase project with a separate ti4_draft_rooms_v1 table, RLS deny-by-default, server-only key, and no changes to SWPA tables. Secret source remains ignored; never print or commit values.
- Vercel is signed in under mikejf1991s-projects on Hobby. Import only mikejf1991/ti4-drafting-app; existing SWPA access remains unchanged. No TI4 deployment exists yet.
- Persisted secrets are only in ignored .env.local. Browser verification fixtures/screenshots are in ignored .scratch; test exports are in Downloads/eight-seat-practice-*.
- Supabase project nvbxtjmioxidblitnsck now has public.ti4_draft_rooms_v1 with RLS and no client privileges. SWPA tables were not changed. The resumed blocked audit starts fresh if a new impasse occurs.
- Known initial-release limits: no public room-creation rate limit or host-link rotation/recovery; retain the host return link. Seat invitations can be replaced by the host.
- Startup baseline for this implementation: tracked files clean at 4141b2c; pre-existing untracked files IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, ScreenRecording_08-18-2026 10-30-08_1.mp4. Change scope: complete app implementation, testing, and deployment.
