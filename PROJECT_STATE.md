# Project State

## Project Identity

- Repository Name: ti4-drafting-app
- Repository Root: C:\Users\polymergroup\Desktop\TI4 Drafting App
- Primary Remote: origin
- Remote URL: https://github.com/mikejf1991/ti4-drafting-app.git
- Default Branch: main
- Bootstrap Status: initialized 2026-09-26 10:10 Central Daylight Time

## Current State

- Active Objective: Apply the agreed home-system adjacency interpretation, show seat identity and public home labels, and highlight latest/unseen placements.
- Live App: https://ti4-drafting-app.vercel.app
- Hosting: Vercel Hobby, team mikejf1991s-projects, project ti4-drafting-app. GitHub main deploys automatically.
- Storage: Existing authorized Supabase project nvbxtjmioxidblitnsck; isolated public.ti4_draft_rooms_v1 table with RLS and no anon/authenticated privileges. No SWPA tables changed.
- Open Issues: No deployment blocker. Known initial-release limits: no public room-creation rate limit or host-link recovery/rotation; retain the host return link. Hosts can replace seat invitations.
- Next Recommended Step: Create a real eight-player room on the live app and distribute each private seat link to its player.

## Active Session Handoff

- Current Branch: main
- Active Task: Home-system rules and returning-player UI improvements; local verification passed, production deployment verification pending (LOG-0011).
- Change Scope: Exclude home positions from drafting adjacency restrictions; add personal identity, public home names, and latest/since-last-visit placement highlights.
- Worktree Baseline: Tracked files clean at fd20e91; dirty only from nine pre-existing untracked reference media files.
- Pre-existing Dirty Files: IMG_4675.heic, IMG_4676.heic, IMG_4677.heic, IMG_4678.heic, IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg, ScreenRecording_08-18-2026 10-30-08_1.mp4.
- Last Meaningful Action: Implemented home-position adjacency exclusion, public/personal names, latest marker and browser-local visit highlights; local return/mark-seen/seat-switch checks passed.
- Files In Flight: Engine/types, visit helper/hook/tests, board/client/CSS, rules/README/state/logs; original nine media files remain unchanged and untracked.
- Verification Status: Passed 46 unit tests, production build/TypeScript, ten local HTTP scenarios and browser checks. Actual change scope matches intent. Awaiting hosted verification.
- Resume From: Push complete change, wait for Vercel success, verify hosted API and browser; local preview is http://127.0.0.1:3005.

## Open Loops

- Always use C:\Users\polymergroup\Desktop\TI4 Drafting App for project commands. The chat opened a different Documents\ChatGPT folder; no project work belongs there.
- Supabase credentials remain only in ignored .env.local and sensitive Vercel server environment variables. Never print or commit them. Screenshots/test fixtures remain in ignored .scratch.
- Production browser verification practice room bf568a5c-5285-4f58-9c30-e8707fc97786 contains one confirmed opening placement. API checks also created marked practice rooms only. Do not reuse test seats for a real draft.
- User manually enabled only TI4 in the existing Vercel GitHub installation, preserving SWPA access. Dashboard sign-in and repo access are resolved.
- Speaker opening is a separate 2-blue/2-red hand; regular hands remain undealt until the fourth legal opening placement. Then everyone receives 4-blue/2-red, with speaker-first snake turns and speaker last. Undoing the transition withdraws hands and replay preserves the same deal; legacy rooms migrate without a reset.
- Tile hands show each planet separately with resource/influence values and labeled, color-coded tech skips. Legendary metadata is not a tech skip. Opening and regular hands use the same display, with full stats in accessible button labels.
- Homes remain visible for orientation but do not constrain adjacency during drafting. Ordinary planet/anomaly systems still do. Personal identity and public home names are displayed; gold marks latest placement and purple marks placements since last visit. Visit tracking is browser-local per room/actor; hidden polling does not mark tiles seen, and Mark seen clears only purple highlights.
- Desktop board fits the viewport; sidebar scrolls independently and roster starts collapsed. Wheel input over the interactive board zooms and cancels page scrolling, including at zoom limits; wheel input outside the board scrolls normally. Creuss has no separate inspection dock but tile 51 remains in exports when selected.
