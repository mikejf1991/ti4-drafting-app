# TI4 Drafting App

An eight-player, asynchronous faction and galaxy draft for an in-person Twilight Imperium Fourth Edition game. Built with Next.js 16, React 19, and TypeScript.

**Live app:** [ti4-drafting-app.vercel.app](https://ti4-drafting-app.vercel.app). Hosted on Vercel Hobby with persistent Supabase storage. Updates to `main` deploy automatically.

## Run locally

Use Node.js 22 or newer. From the repository root:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). The checked-in `.npmrc` enables `legacy-peer-deps`, so `npm ci` uses the same dependency resolution as the lockfile.

The example environment explicitly sets `TI4_STORAGE=local`. Local room state is saved under `.local-data/rooms`; restarting the development server preserves it. Keep `.env.local`, private invitations, and room data out of Git. Only the placeholder `.env.example` is committed.

## Use a draft

1. Create a room with eight player names. Save the **host return link** and all eight **player invitations** before leaving the creation session. Keep the host link private and send each seat link only to its player. Links grant access; there is no separate account login.
2. Each player opens their own invitation and ranks eight distinct factions from the 24 base-game and Prophecy of Kings factions. Rankings lock on submission and remain private, including from the ordinary host view.
3. After all eight players lock, the app assigns factions in random priority order and reveals the assignments together. Clockwise seating follows priority; speaker is drawn independently.
4. The speaker places four opening systems from a separate pool. Then players place their six dealt tiles in a 48-turn snake. Pick a tile and highlighted hex, review the preview, and confirm. Rings fill from the center outward; adjacency exceptions are allowed only when no legal tile/position alternative exists on the active ring.
5. The completed galaxy has 61 cells. Download its board PNG, printable tile-number SVG, or public map JSON. Ghosts use gate tile 17 on the board and home tile 51 off-board.

Players can return asynchronously using their saved links. Online clients refresh automatically. The host can undo the latest placement or replace a lost seat invitation, which invalidates that seat's old link. Original invitation values are kept in the creation tab's session storage; the server stores only their hashes. A saved host link allows invitation replacement from another session. Save the host link because the app has no host-link recovery flow.

Practice rooms additionally offer sample ranking completion and shortcuts to open each seat. The host still uses a seat's private link to place its tiles.

On desktop, the complete board fits within the window and the controls scroll separately. Use the + / − buttons to zoom, drag to pan, and reset to fit the board again. The mouse wheel does not zoom the board. Expand the player roster when needed. Creuss remains in the map exports without a separate off-board inspection panel.

## Verify

```powershell
npm test
npm run typecheck
npm run build
```

Vitest covers the drafting engine, privacy projections, allocation, ring and adjacency rules, snake turns, and undo. With the app running, exercise the actual HTTP endpoints:

```powershell
node scripts/verify-api.mjs http://localhost:3000
```

The API check creates two test rooms and verifies private access, concurrent updates, invitation replacement, and a complete 52-placement draft. Run it against a local or staging instance you control. Use another app URL as the argument to check that instance.

## Deploy to Vercel with Supabase

The live installation uses the isolated Supabase table and server-only Vercel variables. Its hosted API and independent browser-seat flows were verified on 2026-09-26. For a new installation:

1. Run [database/001_rooms.sql](database/001_rooms.sql) in the intended Supabase project's SQL editor. It creates the isolated `public.ti4_draft_rooms_v1` table. Row-level security is enabled, `anon` and `authenticated` receive no table access, and only the server's service role can read or write room state. The migration does not alter unrelated app tables.
2. Set Vercel's server-only environment variables: `TI4_STORAGE=supabase`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY`. Use the Supabase project's secret/service-role key. Do not add a `NEXT_PUBLIC_` prefix or commit credentials.
3. Deploy, check `/api/health`, and verify invitation access and persistence on the deployed app. Run the API verification against staging before using real player rooms.

Never set `TI4_STORAGE=local` on Vercel. The app disables local storage there; Supabase configuration and the table are required. For a local production-build check, run `npm run build` followed by `npm start` with the appropriate `.env.local` settings.

## Rules and artwork

See [draft rules](docs/DRAFT_RULES.md) for the photographed setup rules and implementation defaults. The full four-ring board uses the official eight-player home positions, without hyperlanes.

Tile artwork and metadata for tiles 1–80 are stored locally and sourced from [KeeganW's TI4 map generator](https://github.com/KeeganW/ti4). Refresh them with `node scripts/fetch-tiles.mjs`. Twilight Imperium and its artwork belong to Fantasy Flight Games; this is an unofficial fan tool. Asset availability does not grant additional reuse rights.
