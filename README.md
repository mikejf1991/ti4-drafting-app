# TI4 Drafting App

An eight-player, asynchronous faction and galaxy drafting tool for preparing an in-person Twilight Imperium Fourth Edition game.

This repository is in discovery. No application has been implemented or deployed.

## Working directory

`C:\Users\polymergroup\Desktop\TI4 Drafting App`

Private repository: https://github.com/mikejf1991/ti4-drafting-app

## Agreed direction

- Eight players initially, using the full board without hyperlanes.
- Real hexagonal system artwork, a shared galaxy, and private player hands.
- Five ranked faction preferences per player from all 24 base-game and PoK factions, with randomized allocation priority and hidden faction choices during selection.
- Allocation pauses for an exhausted player's free pick before lower priorities continue; the exact private fallback interface is under discussion.
- Clockwise seating follows faction priority.
- Speaker is randomized independently; map placement follows the standard speaker-first snake.
- One private link per seat; desktop usability takes priority.
- Private tile/location preview followed by explicit confirmation.
- Persistent async play with updates for players who are online together.
- Supabase selected; no additional paid services planned.

See [draft rules and open decisions](docs/DRAFT_RULES.md), [project state](PROJECT_STATE.md), and [agent workflow](AGENT.MD).

Original reference images and the screen recording remain unchanged in the local project root and are not included in the initial commit.
