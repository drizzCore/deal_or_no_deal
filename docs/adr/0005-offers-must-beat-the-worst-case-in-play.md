# An Offer must land strictly between the worst and best Cases In Play

Supersedes the decision recorded in ADR 0002 and repeated in the spec and in ticket 03, all of which stated that an Offer landing below the cheapest Case In Play was correct behaviour and must not be guarded against.

That was reasoned from the television show — insulting Offers happen, and refusing one is a real beat. It did not survive playtesting. With ₱700 and ₱1,500 left on the board, the Bank offered **₱660**, and the player correctly read it as broken rather than insulting.

The reasoning was simply wrong. Refusing an Offer always yields one of the values still In Play, so the worst possible outcome of No Deal is the cheapest remaining Case. An Offer at or below it is **strictly dominated** — there is no state of the world in which accepting is not a mistake. That is not a hard decision presented to the player; it is a non-decision that makes the Bank look broken.

An Offer is now clamped into the open interval between the worst and best Cases In Play: strictly above the cheapest, and still capped at 95% of the best.

## Consequences

**Early Rounds are unaffected.** The cheapest Case is ₱1 until the low end starts being eliminated, so the floor does not bind and Round 1 lowballs are exactly as stingy as before. It only engages once the cheap Cases are gone — which is precisely when a dominated Offer would be noticed.

Wild-swing lowballs still fire at the same rate; they are simply clamped when they would otherwise be dominated. The ₱660 that prompted this was a wild swing at factor 0.60, below the Round 8 band of 0.65–0.90.

The rounding step is chosen per Offer as the coarsest one that still admits a clean value strictly inside the band. Without that, a narrow band has no representable Offer at all — ₱2,000 and ₱2,100 admit nothing at a ₱100 step. The shipped Prize Ladders never get that tight, but the generator at other Top Prizes could.

Measured before the fix: **1.6% of Offers were dominated** (259 of 16,000 across 2,000 simulated games). The invariant is now a test.
