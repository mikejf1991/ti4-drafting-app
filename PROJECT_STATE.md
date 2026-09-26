# Project State

## Project Identity

- Repository Name: ti4-drafting-app
- Repository Root: C:\Users\polymergroup\Desktop\TI4 Drafting App
- Primary Remote: origin
- Remote URL: https://github.com/mikejf1991/ti4-drafting-app.git
- Default Branch: main
- Bootstrap Status: initialized 2026-09-26 10:10 Central Daylight Time

## Current State

- Active Objective: Deploy the corrected speaker opening hand and delayed regular deal; complete hosted verification.
- Live App: https://ti4-drafting-app.vercel.app
- Hosting: Vercel Hobby, team mikejf1991s-projects, project ti4-drafting-app. GitHub main deploys automatically.
- Storage: Existing authorized Supabase project nvbxtjmioxidblitnsck; isolated public.ti4_draft_rooms_v1 table with RLS and no anon/authenticated privileges. No SWPA tables changed.
- Open Issues: No deployment blocker. Known initial-release limits: no public room-creation rate limit or host-link recovery/rotation; retain the host return link. Hosts can replace seat invitations.
- Next Recommended Step: Create a real eight-player room on the live app and distribute each private seat link to its player.

## Active Session Handoff

- Current Branch: main
- Active Task: Correct the speaker opening hand and delayed regular deal, verify all 48 snake turns and undo/legacy-room behavior, then deploy. Baseline 87428bc tracked clean; original nine reference media files unchanged and untracked. Root owns UI/docs/logs; engine agent owns engine/tests; API agent owns HTTP verifier.
- Last Meaningful Action: Implemented delayed normal dealing, safe undo and legacy-room handling. Passed 29 unit tests, production build, ten local HTTP scenarios and independent two-seat browser transition checks. LOG-0009 records the correction.
- Files In Flight: Engine, tests, HTTP verifier, room UI and documentation ready to publish; original nine reference media files remain unchanged and untracked.
- Verification Status: Passed: 21 unit tests, TypeScript, production build; real Supabase and hosted API checks (eight scenarios including full 52-placement/61-cell draft); direct REST client access denied; independent hosted browser seats confirmed private preview, cancel/reposition, confirmed synchronization, reload persistence, desktop fit and wheel stability. Homepage, health, JS and CSS return 200.
- Resume From: Live app above. Local development preview remains http://127.0.0.1:3005. Temporary production verification server on 3184 is no longer needed.

## Open Loops

- Always use C:\Users\polymergroup\Desktop\TI4 Drafting App for project commands. The chat opened a different Documents\ChatGPT folder; no project work belongs there.
- Supabase credentials remain only in ignored .env.local and sensitive Vercel server environment variables. Never print or commit them. Screenshots/test fixtures remain in ignored .scratch.
- Production browser verification practice room bf568a5c-5285-4f58-9c30-e8707fc97786 contains one confirmed opening placement. API checks also created marked practice rooms only. Do not reuse test seats for a real draft.
- User manually enabled only TI4 in the existing Vercel GitHub installation, preserving SWPA access. Dashboard sign-in and repo access are resolved.
- Desktop board fits the viewport; sidebar scrolls independently and roster starts collapsed. Wheel input over the interactive board zooms and cancels page scrolling, including at zoom limits; wheel input outside the board scrolls normally. Creuss has no separate inspection dock but tile 51 remains in exports when selected.
