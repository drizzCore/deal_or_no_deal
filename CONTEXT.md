# Deal or No Deal

A single-player browser game of chance and nerve. The player commits to one sealed case, eliminates the rest under pressure, and repeatedly chooses between a guaranteed offer and the unknown.

## Language

### The board

**Case**:
One of twenty numbered containers, each holding exactly one value from the Prize Ladder. A Case is either sealed or opened; opening one is irreversible.
_Avoid_: box, briefcase, suitcase

**Player's Case**:
The single Case the player commits to before any other is opened. It stays sealed until the endgame and can never be opened during a round.
_Avoid_: my case, chosen case, own case

**Prize Ladder**:
The ordered set of twenty distinct peso values used in a game, from ₱1 up to the Top Prize. The same twenty values every game — only their assignment to Cases is random.
_Avoid_: prize pool, money list, values

**Top Prize**:
The highest value on the Prize Ladder. The single number that determines the shape of the whole ladder.
_Avoid_: jackpot, max prize, grand prize

**In Play**:
The set of Cases not yet opened, *including* the Player's Case. What is In Play determines the Expected Value.
_Avoid_: remaining, left, active

### The game

**Round**:
A fixed number of Case openings, followed by exactly one Offer. Rounds are numbered 1–8 and open 5, 4, 3, 2, 1, 1, 1, 1 Cases respectively.

**Offer**:
The amount the Bank proposes in exchange for ending the game. Anchored to Expected Value, scaled by round, with randomness layered on top.
_Avoid_: bid, bank offer amount, buyout

**Bank**:
The unseen adversary that makes Offers. Has no strategy beyond the Offer formula — the persona exists for tension, not mechanics.
_Avoid_: banker, house, dealer

**Expected Value**:
The mean of every value still In Play, counting the Player's Case. The anchor every Offer is derived from.
_Avoid_: EV in prose, average, pot

**Deal**:
The player accepts the current Offer. Ends the game immediately at that amount.

**No Deal**:
The player declines the current Offer. Advances to the next Round, or to the Swap Decision after Round 8.

**Swap Decision**:
The endgame state reached by declining the Round 8 Offer, when exactly two Cases are In Play. The player either keeps the Player's Case or trades it for the last remaining Case. Distinct from a Round — it opens no Cases and involves no Offer.
_Avoid_: round 9, final round, last round

**Winnings**:
What the player walks away with — either an accepted Offer, or the value inside whichever Case they hold after the Swap Decision.

**Offer History**:
The record of every Offer the Bank has made this game, with the change from the previous one. Visible only while the player is deciding on an Offer. Deliberately contains no derived figures — it reports what the Bank said, never what the odds are.

### Design vocabulary

**Swing**:
How far Expected Value moves between the best and worst single elimination, as a percentage of starting Expected Value. High Swing means every Case opening shifts the game; low Swing means only the Top Prize matters. The measure of whether a Prize Ladder is dramatic.

**Tier**:
The dramatic weight assigned to a Case opening — high, medium, or low — which selects the reveal treatment. Derived from where the Case's value ranks among values still openable, not from the value itself.
