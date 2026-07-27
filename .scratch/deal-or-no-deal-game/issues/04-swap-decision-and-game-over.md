# 04 — Swap Decision and game over

**What to build:** Declining the Round 8 Offer leads to a distinct final screen where exactly two Cases remain. The player keeps their Player's Case or swaps it for the last one. Both values are revealed, the one they are holding last. Their Winnings are stated plainly and they can play again.

Taking a Deal at any point also reaches a proper ending — their Player's Case is opened so they learn whether they were right, and whether they beat the Offer they took.

**After this ticket the game is complete and playable start to finish.**

**Blocked by:** 03

**Status:** ready-for-agent

The Swap Decision is its own phase with its own screen and its own decision flow. It is **not** a ninth Round that happens to open zero Cases — the spec is explicit about this and so is the state model.

The round arithmetic that gets you here is load-bearing and silent if broken: nineteen non-player Cases, minus 5+4+3+2+1+1+1+1 = 18 opened, leaves exactly one, plus the Player's Case. Test it.

Revealing the Player's Case after a Deal was marked optional in the original brief and was explicitly promoted to required — it is the emotional payoff of the format. Without it a Deal just stops.

- [ ] Declining the Round 8 Offer enters a distinct Swap Decision phase
- [ ] Exactly two Cases are shown, with exactly two possible values made clear
- [ ] The player can keep their Player's Case or swap for the remaining one
- [ ] Both values are revealed, with the held Case revealed last
- [ ] Winnings are stated plainly on a game over screen
- [ ] Taking a Deal opens the Player's Case afterward and shows whether they beat the Offer
- [ ] Play again starts a fresh game with a reshuffled board
- [ ] No animation, Offer, or Case opening can continue running after the game ends
- [ ] Tests: exactly two Cases are In Play entering the Swap Decision, one of which is the Player's Case
- [ ] Tests: exactly eighteen Cases are opened across a full eight-Round game
- [ ] Tests: the Swap Decision is reachable only by declining the Round 8 Offer
