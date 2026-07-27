# 08 — Tier classification and tiered reveals

**What to build:** Opening a Case feels different depending on what it costs the player. Losing one of the highest remaining values plays as a disaster — slow, dark, red and gold, a dramatic sting. Losing one of the lowest plays as relief — quick, bright, an upbeat chime and a small confetti burst. Everything in between varies between playthroughs so the game never becomes an animation the player stops watching. And the whole thing gets heavier as Rounds progress.

**Blocked by:** 06, 07

**Status:** done

Before each Case opens, re-rank the values still openable — excluding the Player's Case, which can never be opened. Top three remaining → high Tier. Bottom three remaining → low Tier. Everything else → one of three or four medium variants chosen at random.

**Tiering continues for the whole game.** The original brief made every reveal from Round 4 onward top-Tier; this was explicitly rejected. Rounds 4–8 open six Cases, so that rule produced six consecutive identical maximum-drama reveals — no dynamic range left — and gave the ₱1 Case the full dread treatment, which actively misinforms the player about what just happened.

Instead, a Round-scaled intensity multiplier raises the floor as Rounds progress. A low-Tier reveal in Round 7 is more intense than a low-Tier reveal in Round 1, while still being visibly lighter than a high-Tier reveal beside it. **Escalation and contrast both survive.** Do not flatten this back.

The smallest openable pool during Rounds 1–3 is seven Cases, so top-three and bottom-three can never overlap.

Confetti fires on low-Tier reveals only — not on medium or high.

- [x] Tier is recalculated immediately before each opening, from values still openable
- [x] The Player's Case is excluded from Tier ranking
- [x] High Tier: slow-motion reveal, red/gold flash, brief shake, dramatic sting, screen darkens
- [x] Low Tier: quick relief reveal, green/light flash, upbeat chime, small confetti burst
- [x] Medium Tier: one of three or four variants, chosen at random per opening
- [x] A Round-scaled intensity multiplier raises all Tiers as Rounds progress
- [x] A low-Tier reveal in a late Round is still visibly lighter than a high-Tier one
- [x] Tier is recorded in state and driven from the reducer
- [x] Reduced motion suppresses shake, flash and screen darkening across all Tiers
- [x] Tests: Tier classification always matches the ranking of values still openable
- [x] Tests: the Player's Case never affects Tier ranking
