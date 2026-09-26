# Project State

## Project Identity

- Repository Name: ti4-drafting-app
- Repository Root: C:\Users\polymergroup\Desktop\TI4 Drafting App
- Primary Remote: origin
- Remote URL: https://github.com/mikejf1991/ti4-drafting-app.git
- Default Branch: main
- Bootstrap Status: initialized 2026-09-26 10:10 Central Daylight Time

## Current State

- Active Objective: Publish inline resources/influence and technology skips in the tile hand.
- Live App: https://ti4-drafting-app.vercel.app
- Hosting: Vercel Hobby, team mikejf1991s-projects, project ti4-drafting-app. GitHub main deploys automatically.
- Storage: Existing authorized Supabase project nvbxtjmioxidblitnsck; isolated public.ti4_draft_rooms_v1 table with RLS and no anon/authenticated privileges. No SWPA tables changed.
- Open Issues: No deployment blocker. Known initial-release limits: no public room-creation rate limit or host-link recovery/rotation; retain the host return link. Hosts can replace seat invitations.
- Next Recommended Step: Create a real eight-player room on the live app and distribute each private seat link to its player.

## Active Session Handoff

- Current Branch: main
- Active Task: Show each planet's resources/influence and tech skips directly in the tile hand. Baseline e97bf13 tracked clean; nine original reference media files remain unchanged and untracked. Scope: tile-hand UI, verification and deployment only.
- Last Meaningful Action: Deployed c6a00a9, then verified ten hosted HTTP scenarios and independent hosted seats showing the correct separate opening hand. LOG-0009 records the correction.
- Files In Flight: None after verification closeout; original nine reference media files remain unchanged and untracked.
- Verification Status: Passed: 29 unit tests, production build including TypeScript, ten local and ten hosted HTTP scenarios including all 48 normal turns, delayed deal, undo/replay, and full 61-cell map. Browser verified the four-to-six-tile hand transition locally, fresh hosted opening hand colors/privacy, and existing hosted room preservation. Earlier wheel, placement-preview, persistence and storage-privacy checks remain applicable.
- Resume From: Live app above. Local development preview remains http://127.0.0.1:3005. Temporary production verification server on 3184 is no longer needed.

## Open Loops

- Always use C:\Users\polymergroup\Desktop\TI4 Drafting App for project commands. The chat opened a different Documents\ChatGPT folder; no project work belongs there.
- Supabase credentials remain only in ignored .env.local and sensitive Vercel server environment variables. Never print or commit them. Screenshots/test fixtures remain in ignored .scratch.
- Production browser verification practice room bf568a5c-5285-4f58-9c30-e8707fc97786 contains one confirmed opening placement. API checks also created marked practice rooms only. Do not reuse test seats for a real draft.
- User manually enabled only TI4 in the existing Vercel GitHub installation, preserving SWPA access. Dashboard sign-in and repo access are resolved.
- Speaker opening is a separate 2-blue/2-red hand; regular hands remain undealt until the fourth legal opening placement. Then everyone receives 4-blue/2-red, with speaker-first snake turns and speaker last. Undoing the transition withdraws hands and replay preserves the same deal; legacy rooms migrate without a reset.
- Desktop board fits the viewport; sidebar scrolls independently and roster starts collapsed. Wheel input over the interactive board zooms and cancels page scrolling, including at zoom limits; wheel input outside the board scrolls normally. Creuss has no separate inspection dock but tile 51 remains in exports when selected.
