# The Offer is a fixed ramp that never moves against the board

Supersedes the random factor bands and the wild swing from ADR 0002 and the spec.

Playtesting turned up the worst incoherence in the game: an Offer went from **₱1,300 to ₱2,300 in the Round the ₱10,000 Case was opened**. Losing the top prize made the Bank more generous.

The cause was structural, not a bug. The Offer was `Expected Value × factor(round)`, and the factor band climbed steeply between Rounds — 0.25–0.45 at Round 3, 0.45–0.65 at Round 4, a jump of about 1.57×. Whenever Expected Value fell by less than the band climbed, the Offer rose. Measured across 8,000 simulated games, **the Offer rose after a bad Round 37% of the time**, and rose after the single best Case was opened 24.7% of the time.

Removing the randomness alone does not fix this. A fixed coefficient per Round still produced a rise on 32% of bad Rounds — it only tamed the magnitude, from a worst observed jump of 14× down to 2.1×. The frequency comes from the ramp, not the noise.

Two changes together:

**The coefficient is fixed and smooth** — a ramp of +0.05 a Round, from 0.70 at Round 1 to 1.05 at Round 8. No band, no roll, no wild swing. The Offer is now a deterministic function of the board.

The curve started at 0.18 and was raised after comparing against a separate prototype of the same game. A low opening coefficient stops the early Rounds being a decision at all — nobody accepts a fifth of the board, so "No Deal" is automatic for three Rounds. Starting near the board's value makes every Round a genuine choice. The cost is that holding out only grows the multiple about 1.5× instead of 4.7×, so the tension moves from *the Offer keeps growing* to *the board might collapse*. That is the better game.

**The Offer may never move against Expected Value.** A worse board drags it down in proportion to what was lost; a better board can only push it up. Both directions measure at 0%.

## Consequences

The Bank is fully predictable given the board. The original brief wanted unpredictability so the Offer could not be reverse-engineered — that is knowingly given up. In practice the player never sees Expected Value (deliberately, see ADR on the Offer History), so predicting an Offer means averaging up to twenty hidden values in their head. Coherence was worth more than that.

**ADR 0005's floor outranks this rule.** If the cheapest Case still In Play rises past the previous Offer, that Offer has become dominated and the floor must push the new one above it — even though the board got worse. Measured at 1 occurrence in ~14,000 Offer transitions, and the rise was 2.5%. The test permits exactly this case and nothing else.

Dragging the Offer down in proportion to the loss, rather than merely capping it at the previous Offer, was chosen because capping left the Offer sitting flat across several declining Rounds, which reads as the Bank not paying attention. The cost is that a sustained run of bad Rounds holds the ramp back. It is bounded: across 3,000 games the tenth percentile still reaches 69% of the board by Round 8, against a mean of 83%.
