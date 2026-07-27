# 02 — Pick your Case and open Cases

**What to build:** The player picks one Case as their Player's Case and it is set aside on its own pedestal, leaving an empty socket in its grid slot.

> **Revised after playtesting.** This originally removed the Case from the grid entirely, which reflowed the other nineteen into new positions and destroyed the board the player had been reading. Every Case now keeps its slot for the whole game. They then open other Cases one at a time by tapping them. Each opened Case stays on the board showing its value, and the matching rung of the Prize Ladder goes dark immediately. The player always knows which Round they are in and how many Cases they still have to open.

Round 1 is fully playable. There is no Offer yet — the game simply stops once the Round's Cases are open.

**Blocked by:** 01

**Status:** done

No animation in this ticket. Cases open instantly. The theatrics are tickets 07 and 08 — the spec's build order is deliberate: the game must be playable and tunable before anything is animated against it.

The Player's Case can never be opened during a Round. It is excluded from everything openable.

- [x] A `PICK_PLAYER_CASE` action moves the chosen Case out of the grid into its own position
- [x] The Player's Case is visually distinct and clearly sealed
- [x] The Player's Case cannot be opened or re-picked
- [x] An `OPEN_CASE` action reveals a Case's value and marks it opened
- [x] Opened Cases remain on the board displaying their value, visibly dead
- [x] The matching Prize Ladder rung goes dark the moment a Case opens
- [x] The current Round number is always visible
- [x] A counter shows how many Cases remain to open this Round
- [x] Round structure is 5, 4, 3, 2, 1, 1, 1, 1 Cases across eight Rounds, defined in one obvious place
- [x] Opening the last Case of a Round advances the phase rather than allowing another opening
- [x] Tests: the Player's Case is never openable
- [x] Tests: each Round opens exactly its allotted number of Cases
