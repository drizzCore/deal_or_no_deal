# 05 — Offer History table

**What to build:** While deciding on an Offer, the player sees every Offer the Bank has made this game — the Round it came in, the amount, whether it went up or down from the last one and by how much, and the best Offer they have already refused. The table disappears once they decide, so it never clutters the board during play.

**Blocked by:** 03

**Status:** ready-for-agent

This table is a strategy tool, not decoration. It carries **only what the Bank has said** — amounts the player has already seen. It must never show Expected Value, the average of what is left, odds, or any other derived figure. Showing those hands the player a solver and the game collapses into arithmetic. The spec lists this under Out of Scope deliberately.

The change column is what makes a falling Offer land, and the best-so-far line is what makes refusing one hurt. Both are the point of the feature.

- [ ] Every Offer is recorded in state as it is made
- [ ] The table shows Round, Offer amount, and change from the previous Offer
- [ ] Rises and falls are distinguished by direction indicator and colour
- [ ] The best Offer refused so far is shown, with the Round it came from
- [ ] The current Round's row is visually highlighted
- [ ] The table is visible only while the player is deciding on an Offer
- [ ] No Expected Value, odds, or derived statistic appears anywhere in the table
- [ ] Amounts use the same ₱ formatting as the rest of the game
- [ ] Tests: the recorded history matches the Offers actually made across a full game
