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
- Open Issues: Supabase and Vercel dashboard sign-in is needed for online provisioning; user has been asked asynchronously. Local development uses explicit file-backed storage.
- Next Recommended Step: After dashboard sign-in, run database/001_rooms.sql in Supabase, configure server-only Vercel environment variables, deploy, and verify the online app.

## Active Session Handoff

- Current Branch: main
- Active Task: Goal marked blocked after the same dashboard sign-in barrier persisted across three goal turns. Local implementation and verification are complete; online deployment is not complete.
- Last Meaningful Action: Rechecked both live browser tabs; Supabase and Vercel still require sign-in. Local implementation is pushed in 17d06ba, with verification recorded in LOG-0004.
- Files In Flight: None in implementation; verified local checkpoint recorded as LOG-0004. Nine original reference media files remain unchanged and untracked. No database migration or deployment has run remotely.
- Verification Status: Passed locally. Production build is warning-free; npm audit reports zero vulnerabilities. Both development and production servers passed actual HTTP checks. Supabase-backed and hosted checks remain unverified.
- Resume From: Dashboard sign-in tabs are retained. Local preview is http://127.0.0.1:3005; production smoke checks ran on port 3184. Do not treat local functionality as completion of the online app goal.

## Open Loops

- Use C:\Users\polymergroup\Desktop\TI4 Drafting App for every project command. The chat initially opened a different, empty Documents\ChatGPT folder; no project work belongs there.
- Default selected under user's autonomy instruction: all assignments reveal together after all rankings lock, before map building; rankings stay private.
- Reuse existing Supabase project with a separate ti4_draft_rooms_v1 table, RLS deny-by-default, server-only key, and no changes to SWPA tables. Secret source remains ignored; never print or commit values.
- Vercel is the chosen hosting target to follow SWPA's deployment pattern. Browser sign-in pending; no deployment exists yet.
- Persisted secrets are only in ignored .env.local. Browser verification fixtures/screenshots are in ignored .scratch; test exports are in Downloads/eight-seat-practice-*.
- Supabase migration requires management/dashboard access, which the existing runtime sb_secret key does not grant. Do not change SWPA tables. Resume after user signs into Supabase and Vercel; sign-in tabs have been retained. Repeated checks found no newly available access, and no additional safe provisioning step remains without it.
- Known initial-release limits: no public room-creation rate limit or host-link rotation/recovery; retain the host return link. Seat invitations can be replaced by the host.
- Startup baseline for this implementation: tracked files clean at 4141b2c; pre-existing untracked files IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, ScreenRecording_08-18-2026 10-30-08_1.mp4. Change scope: complete app implementation, testing, and deployment.
