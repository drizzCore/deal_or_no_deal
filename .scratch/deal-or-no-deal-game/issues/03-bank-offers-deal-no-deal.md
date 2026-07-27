# 03 — Bank Offers, Deal and No Deal

**What to build:** After every Round the Bank makes an Offer and the game pauses. The player takes the Deal and the game ends immediately at that amount, or says No Deal and continues to the next Round. All eight Rounds are playable end to end.

**Blocked by:** 02

**Status:** ready-for-agent

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

An Offer landing below the cheapest Case In Play is **correct behaviour** and must not be guarded against. It is an insulting Offer the player should refuse, and occurs in roughly 1% of Offers.

- [ ] An Offer is presented after every Round, including Round 8
- [ ] Expected Value counts the Player's Case
- [ ] The factor is re-rolled inside the Round band on every Offer
- [ ] Wild swings fire on roughly 10% of Offers, in both directions
- [ ] The Offer is clamped to 95% of the highest value In Play
- [ ] The Offer is floored at ₱1
- [ ] Offers are rounded by the tier table above
- [ ] Deal ends the game immediately and stops everything else
- [ ] No Deal advances to the next Round
- [ ] Declining the Round 8 Offer advances to a swap phase (built in ticket 04)
- [ ] The Offer factor bands and rounding table live in one obvious, findable place for retuning
- [ ] Tests, across many thousands of seeded games: no Offer is ever ₱0
- [ ] Tests: no Offer ever exceeds 95% of the highest value In Play
- [ ] Tests: every Offer is a whole number matching its rounding tier
- [ ] Tests: factors stay inside the Round band except on wild swings, which stay inside their caps
- [ ] Tests: taking the Deal terminates the game and no further Offers or openings are possible
