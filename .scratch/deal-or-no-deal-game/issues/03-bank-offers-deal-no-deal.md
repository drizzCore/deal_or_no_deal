# 03 — Bank Offers, Deal and No Deal

**What to build:** After every Round the Bank makes an Offer and the game pauses. The player takes the Deal and the game ends immediately at that amount, or says No Deal and continues to the next Round. All eight Rounds are playable end to end.

**Blocked by:** 02

**Status:** done

Read ADR 0002 before starting. The rounding approach looks like needless complexity and is not — a single `ROUND_TO` constant was tried and produced Offers of exactly ₱0 in one game in twenty-five, while leaving Round 1 with only six distinct possible Offers ever. Do not simplify it back.

Expected Value is the mean of every value In Play **including the Player's Case**, whose value is unknown to the player but still counts toward the average.

The factor is rolled fresh inside the Round's band every single time — never a reused multiplier. Bands: 0.10–0.25 for Round 1, 0.25–0.45 for Rounds 2–3, 0.45–0.65 for Rounds 4–5, 0.65–0.90 for Rounds 6–8.

Wild swing: 10% of Offers roll outside the band, half low and half high — down to 0.05 × Expected Value or up to 1.15 × Expected Value.

Rounding is a tier table, not a constant:

```
above ₱10,000  → step ₱1,000
above  ₱1,000  → step   ₱100
above    ₱100  → step    ₱10
otherwise      → step     ₱1
```

~~An Offer landing below the cheapest Case In Play is **correct behaviour** and must not be guarded against. It is an insulting Offer the player should refuse, and occurs in roughly 1% of Offers.~~

**Reversed after playtesting — see ADR 0005.** The Bank offered ₱660 against ₱700 and ₱1,500 still on the board, and it read as broken rather than insulting. Refusing always yields one of the remaining values, so an Offer at or below the cheapest is strictly dominated — a non-decision, not a hard one. Offers are now clamped strictly between the worst and best Cases In Play.

- [x] An Offer is presented after every Round, including Round 8
- [x] Expected Value counts the Player's Case
- [x] The factor is re-rolled inside the Round band on every Offer
- [x] Wild swings fire on roughly 10% of Offers, in both directions
- [x] The Offer is clamped to 95% of the highest value In Play
- [x] The Offer is floored at ₱1
- [x] Offers are rounded by the tier table above
- [x] Deal ends the game immediately and stops everything else
- [x] No Deal advances to the next Round
- [x] Declining the Round 8 Offer advances to a swap phase (built in ticket 04)
- [x] The Offer factor bands and rounding table live in one obvious, findable place for retuning
- [x] Tests, across many thousands of seeded games: no Offer is ever ₱0
- [x] Tests: no Offer ever exceeds 95% of the highest value In Play
- [x] Tests: every Offer is a whole number matching its rounding tier
- [x] Tests: factors stay inside the Round band except on wild swings, which stay inside their caps
- [x] Tests: taking the Deal terminates the game and no further Offers or openings are possible
