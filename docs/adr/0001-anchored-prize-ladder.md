# Prize Ladder is anchored and generated, not purely geometric

The original spec generated values as `TOP_PRIZE^(i/19)`. At ₱10,000 that produces amounts like ₱233,572 and crowds ten of twenty cases below ₱1,000 — ugly, and weighted hard against the player.

We instead pin the bottom four rungs at ₱1, ₱5, ₱10, ₱50 and fill the remaining sixteen geometrically, snapped to a lattice of clean denominations (mantissas × powers of ten). Every value is a round number at any Top Prize.

## Consequences

We knowingly spent drama for generosity. Swing — how far Expected Value moves between the best and worst single elimination — drops from 35% on the pure geometric ladder to 27%. Flattening the ladder further (we modelled 23% and 19% variants) makes offers stop reacting to what the player does, at which point only the Top Prize matters and the game stops being tense. **27% is close to the floor. Do not flatten the ladder further without re-measuring Swing.**

The default ₱10,000 ladder is hand-authored in `LADDER_OVERRIDE` because the generator's output at that value keeps ₱150/₱250 over the more satisfying ₱100/₱700. The generator is the fallback for every other Top Prize, and is verified to produce twenty unique, ordered, clean values from ₱10,000 to ₱1,000,000.
