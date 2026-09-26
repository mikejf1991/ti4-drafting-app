# Draft rules and discovery notes

Status: discussion only, 2026-09-26. Confirmed user decisions and photographed rules are distinguished from proposals below. Do not treat open proposals as approved implementation requirements.

## Confirmed scope and interaction

- Prepare the map and factions before an in-person TI4 game; no in-game simulation.
- Eight players only initially. Use the full four-ring board shown in IMG_4675.heic, without hyperlanes.
- Visually resemble a TI4 board with actual hex tile images. Avoid a generic card dashboard.
- Each seat has a private link and can see only its own unplaced tiles.
- A player clicks a tile, clicks a location, reviews a private preview, then confirms. Before confirmation, they can correct a misclick. Confirmed placement becomes public.
- Async by default; simultaneous online attendance should work with the same rules.
- Desktop usability first; mobile support is secondary.
- Supabase selected. Avoid additional paid services. Final frontend hosting is undecided.
- Multiple-seat testing is required, including independent sessions that verify privacy and synchronization.

## Faction allocation: confirmed

1. Every player submits five factions ranked by preference. Submissions are asynchronous and need not arrive in priority order.
2. The system randomly assigns a priority order.
3. In priority order, each player receives their highest-ranked unclaimed faction.
4. A player whose entire list is unavailable may freely choose from remaining factions. With five distinct choices, only priorities 6-8 can encounter this.
5. Clockwise seating follows this priority order.
6. Factions must be known before map placement so players can build with their faction in mind.

Proposed details, not yet approved:

- Require five distinct eligible factions, keep rankings private, and allow editing until all eight players finalize.
- Lock all lists before drawing priority; persist that draw and do not reroll on refresh.
- If a player's list is exhausted, pause allocation at that priority for their free pick before assigning lower priorities. Alternative: finish automatic assignments first, then offer the remaining factions to unmatched players. The user must choose this policy.
- Default faction pool: the 24 base-game plus Prophecy of Kings factions implied by the supplied home tiles. Confirm bans or additional factions before implementation.

## Galaxy build: transcribed from user photographs

Sources: IMG_4675.heic (board), IMG_4676.heic (separate/deal), IMG_4677.heic (placement), IMG_4678.heic (eight-player additions).

- Mecatol Rex is fixed at the center; eight home systems use the positions in the photographed eight-player diagram.
- Separate blue- and red-backed system tiles and shuffle each pile facedown.
- Deal each player four blue and two red tiles: 48 dealt tiles total.
- Before normal placement, the speaker draws two extra blue and two extra red tiles from the unused tiles and places these four adjacent to Mecatol, one at a time in their chosen order, following normal placement rules.
- Starting with the speaker, placement proceeds clockwise. The final player places twice, then direction reverses. At the other end, the speaker places twice and direction reverses again. Continue this snake until all dealt tiles are placed.
- Complete each ring before starting the next ring.
- Anomaly systems cannot be adjacent unless there is no other option.
- Systems with matching wormhole types cannot be adjacent unless there is no other option.
- Home systems occupy the prescribed positions; the photographed base instructions describe attaching them after the dealt tiles are placed.
- Tile accounting: 48 dealt + 4 speaker placements + 8 home systems + Mecatol = 61 board positions. From the supplied pools, two blue tiles remain unused and all 18 red tiles are used.

The generator screenshots (IMG_4680.jpeg, IMG_4681.heic, IMG_4682.jpeg, IMG_4684.jpeg) show access to options, PoK tiles, and the extra-tile panel. They are asset-access references, not a request to reproduce every generator setting. The MP4 is present but has not been reviewed; the screenshots provide the requested rules.

## Speaker: verified standard and proposal

The official Complete Setup randomly selects the initial speaker. Standard map placement starts at the speaker and moves clockwise before reversing.

Recommendation awaiting approval: choose speaker independently at random after faction allocation. Keep clockwise seating in faction-priority order. This means faction priority number 1 does not automatically receive speaker or necessarily place the first system.

Official reference: https://images-cdn.fantasyflightgames.com/filer_public/51/55/51552c7f-c05c-445b-84bf-4b073456d008/ti10_pok_living_rules_reference_20_web.pdf

## Tile assets

- Home systems: 1-17 and 52-58.
- Ghosts of Creuss: tile 51 is required only when Ghosts are selected; do not deal it as a normal system tile.
- Mecatol Rex: 18.
- Blue: 19-38, 59-66, 69-76 (36 tiles).
- Red: 39-50, 67-68, 77-80 (18 tiles).
- Ignore 81-91 for this app's requested scope.
- All requested image endpoints are accessible. Tile 51 was checked separately after the user's clarification.
- Live asset pattern: https://keeganw.github.io/ti4/tiles/ST_18.webp (replace 18 with tile ID).
- Source repository: https://github.com/KeeganW/ti4
- Artwork access does not establish reuse licensing. Assets have not been downloaded or added to this repository.

## Questions to resolve next

1. Accept independently random speaker and the standard speaker-first map snake?
2. On exhausted faction rankings, pause before lower priorities or complete automatic assignments before free picks?
3. Use all 24 base-game plus PoK factions, or are there exclusions/additions?

Host recovery controls, finalized map export, the exact treatment of placement exceptions, and hosting details can be settled during design. No app implementation has begun.
