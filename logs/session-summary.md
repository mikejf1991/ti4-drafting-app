## 2026-09-26 10:14 America/Chicago
Entry ID: LOG-0001

Request
- Use the Desktop TI4 project; bootstrap private ti4-drafting-app; inspect rules and discuss async faction allocation, seating, speaker, and placement.

Discussion
- Confirmed eight players, private seat links, Supabase, desktop first, five ranked factions with random allocation priority, clockwise priority seating, private placement preview, and conditional Ghosts tile 51. Photos specify 4 blue plus 2 red per player, four extra speaker placements, snake order, ring completion and adjacency constraints. Independent random speaker and priority-preserving fallback are proposals.

Outcome
- Created the private GitHub remote and startup files; documented confirmed rules and pending decisions. Reviewed all eight images, verified tile 51 and official speaker rule, and passed Bash syntax verification. No app implementation or deployment. Initial bootstrap commit and push follow.
## 2026-09-26 10:38 America/Chicago
Entry ID: LOG-0002

Request
- Confirm priority-preserving faction fallback, conceal choices to prevent counter-picking, independent random speaker, all 24 factions, and identify remaining decisions.

Discussion
- Accepted pause at any exhausted priority before lower assignments, independent random speaker, and all 24 base-game/PoK factions. Choices must remain hidden during selection. A remaining-faction list exposes the taken set; propose private expanded fallback rankings. Final reveal timing remains open: simultaneous reveal before map placement is proposed, not yet approved.

Outcome
- Updated discovery documents only. Two privacy choices remain: blind fallback versus visible availability, and faction reveal timing. No application implementation or service changes.
## 2026-09-26 10:42 America/Chicago
Entry ID: LOG-0003

Request
- Simplify faction selection to eight ranked factions per player so fallback edge cases disappear.

Discussion
- Each player ranks eight distinct eligible factions from the fixed 24-faction pool. At most seven factions can be assigned before the last player, guaranteeing at least one available ranked choice. Remove free picks, expanded fallback rankings, and mid-allocation pauses. Keep random priority and hidden choices; final reveal timing remains unconfirmed.

Outcome
- Updated README, draft rules, and project state. Documentation-only change; no app implementation. Checked the assignment guarantee and retained the separate reveal-timing question.
