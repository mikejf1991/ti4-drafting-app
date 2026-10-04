# Draft rules and implementation decisions

Status: implemented and deployed. Routine design defaults were selected under the user's instruction to minimize involvement.

## Confirmed scope and interaction

- Prepare the map and factions before an in-person TI4 game; no in-game simulation.
- Eight players only initially. Use the full four-ring board shown in IMG_4675.heic, without hyperlanes.
- Visually resemble a TI4 board with actual hex tile images. Avoid a generic card dashboard.
- Each seat has a private link and can see only its own unplaced tiles.
- A player clicks a tile, clicks a location, then confirms. Matt's shared-preview update shows the selected tile and location to the table before confirmation with a PENDING marker; it reveals only that tile, not the rest of the hand. Before confirmation, the player can move or cancel it. Confirmation locks the tile onto the board.
- Async by default; simultaneous online attendance should work with the same rules.
- Desktop usability first; mobile support is secondary.
- Supabase provides room persistence and Vercel hosts the app on the free Hobby plan.
- Multiple-seat testing is required, including independent sessions that verify privacy and synchronization.

## Faction allocation: confirmed

1. Every player submits eight distinct eligible factions ranked by preference. Submissions are asynchronous and need not arrive in priority order.
2. The system randomly assigns a priority order.
3. In priority order, each player receives their highest-ranked unclaimed faction.
4. Assignments are fully automatic. With eight players and eight distinct choices each, at most seven choices can have been taken before a player's allocation. At least one ranked choice must remain. No free-pick fallback, additional ranking, or mid-allocation pause is needed; these replace the earlier five-choice rules.
5. Clockwise seating follows this priority order.
6. Each player's own faction must be known before map placement so they can build with their faction in mind.
7. Use all 24 base-game plus Prophecy of Kings factions.
8. Do not reveal other players' faction choices during faction selection. Rankings remain private permanently. Final assignments reveal together after all eight rankings lock, before map placement (selected default under the user's autonomy instruction).
9. Validate exactly eight unique choices from the 24-faction pool and assign only one player per faction. Keep the eligible pool fixed for the room so the guarantee remains valid.

Implementation defaults:

- Allow local editing before that player presses Lock ranking. Submitted rankings are final and remain private. Eight distinct eligible choices are required.
- Lock all lists before drawing priority; persist that draw and do not reroll on refresh.
- Keep rankings and provisional assignments hidden in the host's ordinary app interface as well. Private seat links and server-side checks should enforce this; a backend administrator is outside the app-level secrecy model.

## Galaxy build: transcribed from user photographs

Sources: IMG_4675.heic (board), IMG_4676.heic (separate/deal), IMG_4677.heic (placement), IMG_4678.heic (eight-player additions).

- Mecatol Rex is fixed at the center; eight home systems use the positions in the photographed eight-player diagram.
- Separate blue- and red-backed system tiles and shuffle each pile facedown.
- User correction: deal only the speaker a separate opening hand of two blue and two red tiles. No player, including the speaker, receives their regular hand yet.
- The speaker places all four opening tiles adjacent to Mecatol, one at a time in their chosen order, following normal placement rules. Only this opening hand is available when checking legal alternatives.
- After the fourth opening placement is confirmed, deal each player four blue and two red tiles: 48 dealt tiles total. The speaker immediately starts normal placement with one tile from this new six-tile hand.
- Starting with the speaker, placement proceeds clockwise. The final player places twice, then direction reverses. At the other end, the speaker places twice and direction reverses again. Continue this snake until all dealt tiles are placed.
- Numbering normal draft turns 1–48, the speaker acts on turns 1, 16, 17, 32, 33, and 48. The last clockwise player acts on turns 8, 9, 24, 25, 40, and 41. Every player places six regular tiles; the speaker also placed the four opening tiles.
- Complete each ring before starting the next ring.
- Anomaly systems cannot be adjacent unless there is no other option.
- Systems with matching wormhole types cannot be adjacent unless there is no other option.
- Home systems attach after all dealt tiles are placed, following the group's agreed interpretation. The app displays assigned homes for orientation and reserves those eight positions throughout the draft, but ignores home positions when checking anomaly and matching-wormhole adjacency. An anomaly may therefore be placed beside the Empyrean home system. Ordinary planet systems containing anomalies still count as anomalies.
- Tile accounting: 48 dealt + 4 speaker placements + 8 home systems + Mecatol = 61 board positions. From the supplied pools, two blue tiles remain unused and all 18 red tiles are used.

The generator screenshots (IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg) show access to options, PoK tiles, and the extra-tile panel. They are asset-access references, not a request to reproduce every generator setting. The MP4 is present but has not been reviewed; the screenshots provide the requested rules.

## Speaker: confirmed

The official Complete Setup randomly selects the initial speaker. Standard map placement starts at the speaker and moves clockwise before reversing.

User approved choosing speaker independently at random after faction allocation, with standard speaker-first map placement. Keep clockwise seating in faction-priority order. Faction priority number 1 does not automatically receive speaker or necessarily place the first system.

Official reference: https://images-cdn.fantasyflightgames.com/filer_public/51/55/51552c7f-c05c-445b-84bf-4b073456d008/ti10_pok_living_rules_reference_20_web.pdf

## Tile assets

- Home systems: 1-17 and 52-58.
- Ghosts of Creuss: gate tile 17 occupies the assigned home position; tile 51 is shown separately off-board when Ghosts are selected. Neither is dealt as a normal system tile, and tile 51 is outside the 61-cell board.
- Mecatol Rex: 18.
- Blue: 19-38, 59-66, 69-76 (36 tiles).
- Red: 39-50, 67-68, 77-80 (18 tiles).
- Ignore 81-91 for this app's requested scope.
- All 80 requested images are downloaded under `public/tiles`, with normalized metadata in `data/tiles.json`. `scripts/fetch-tiles.mjs` refreshes only tiles 1–80, including tile 51.
- Live asset pattern: https://keeganw.github.io/ti4/tiles/ST_18.webp (replace 18 with tile ID).
- Source repository: https://github.com/KeeganW/ti4
- Twilight Imperium artwork belongs to Fantasy Flight Games. Source artwork access does not establish additional reuse licensing; this is an unofficial fan tool.

## Operational defaults

- Host can replace a lost private invitation and undo the latest placement. Undoing the fourth opening placement withdraws all regular hands until it is confirmed again, then restores the same deal. Every confirmed placement and undo appears in the activity history.
- Practice rooms allow automatic sample rankings and opening all eight independent seats. Real rooms cannot use this shortcut.
- Completed maps export as board PNG, printable tile-number SVG, and public map JSON.
- Each seat page shows its player's name and assigned faction. Home hexes show their owners publicly in clockwise priority order.
- The latest confirmed tile is marked on the board. Additional highlights show placements since the last visit, with a Mark seen control. Visit tracking is local to this browser, separately for each room and seat (and host view); it does not synchronize across devices. The first visit starts from the current board. Leaving the page or switching away saves the last visibly viewed board, and background polling cannot consume unseen placements. Undo removes a highlight; replay creates a fresh placement identity.
- Placement exceptions apply only if no tile/space pair in the current player's active pool is legal on the current ring.
- Server-side validation and revision-based atomic updates protect turns and simultaneous actions. Each client receives only its own rankings and hand; speaker opening tiles are visible only to the speaker.
- The live app is https://ti4-drafting-app.vercel.app on Vercel Hobby. `database/001_rooms.sql` creates the isolated `public.ti4_draft_rooms_v1` table with RLS and no `anon` or `authenticated` table access. Only server routes use the Supabase secret key.
- Local file-backed storage is available only for explicit local development (`TI4_STORAGE=local`) and is disabled on Vercel. Environment secrets and local room data must remain outside Git.
