# Project State

## Project Identity

- Repository Name: ti4-drafting-app
- Repository Root: C:\Users\polymergroup\Desktop\TI4 Drafting App
- Primary Remote: origin
- Remote URL: https://github.com/mikejf1991/ti4-drafting-app.git
- Default Branch: main
- Bootstrap Status: initialized 2026-09-26 10:10 Central Daylight Time

## Current State

- Active Objective: Complete. Planet resources/influence and technology skips are visible directly in tile hands and verified live.
- Live App: https://ti4-drafting-app.vercel.app
- Hosting: Vercel Hobby, team mikejf1991s-projects, project ti4-drafting-app. GitHub main deploys automatically.
- Storage: Existing authorized Supabase project nvbxtjmioxidblitnsck; isolated public.ti4_draft_rooms_v1 table with RLS and no anon/authenticated privileges. No SWPA tables changed.
- Open Issues: No deployment blocker. Known initial-release limits: no public room-creation rate limit or host-link recovery/rotation; retain the host return link. Hosts can replace seat invitations.
- Next Recommended Step: Create a real eight-player room on the live app and distribute each private seat link to its player.

## Active Session Handoff

- Current Branch: main
- Active Task: None.
- Last Meaningful Action: Deployed 983a7b4 and verified inline per-planet values and labeled tech skips without opening the inspector. LOG-0010 records this UI change; LOG-0009 records the previously verified deal/snake correction.
- Files In Flight: None after verification closeout; original nine reference media files remain unchanged and untracked.
- Verification Status: Latest UI build/TypeScript and local/hosted browser checks passed, including multi-planet stats, tech skips, no false legendary skip, no overflow, and retained inspector access. Earlier backend verification passed 29 tests and ten hosted HTTP scenarios including delayed deal, undo/replay and all 48 snake turns; backend code was unchanged by this UI update.
- Resume From: Live app above. Local development preview remains http://127.0.0.1:3005. Temporary production verification server on 3184 is no longer needed.

## Open Loops

- Always use C:\Users\polymergroup\Desktop\TI4 Drafting App for project commands. The chat opened a different Documents\ChatGPT folder; no project work belongs there.
- Supabase credentials remain only in ignored .env.local and sensitive Vercel server environment variables. Never print or commit them. Screenshots/test fixtures remain in ignored .scratch.
- Production browser verification practice room bf568a5c-5285-4f58-9c30-e8707fc97786 contains one confirmed opening placement. API checks also created marked practice rooms only. Do not reuse test seats for a real draft.
- User manually enabled only TI4 in the existing Vercel GitHub installation, preserving SWPA access. Dashboard sign-in and repo access are resolved.
- Speaker opening is a separate 2-blue/2-red hand; regular hands remain undealt until the fourth legal opening placement. Then everyone receives 4-blue/2-red, with speaker-first snake turns and speaker last. Undoing the transition withdraws hands and replay preserves the same deal; legacy rooms migrate without a reset.
- Tile hands show each planet separately with resource/influence values and labeled, color-coded tech skips. Legendary metadata is not a tech skip. Opening and regular hands use the same display, with full stats in accessible button labels.
- Desktop board fits the viewport; sidebar scrolls independently and roster starts collapsed. Wheel input over the interactive board zooms and cancels page scrolling, including at zoom limits; wheel input outside the board scrolls normally. Creuss has no separate inspection dock but tile 51 remains in exports when selected.
