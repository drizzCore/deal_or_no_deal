# 11 — Ambient tone shifting

**What to build:** The background atmosphere drifts with how the board is trending — cooler when high values still dominate what is In Play, warmer and redder when it is trending low. The player is never told this is happening; the mood simply tracks their luck.

**Blocked by:** 08

**Status:** done

**This is the designated cut.** The spec names it explicitly as the first thing to drop if the core loop needs the time. It is the subtlest effect in the game and nothing else depends on it. If earlier tickets ran long or the game needs retuning after playtesting, close this as `wontfix` and spend the time there instead.

The shift must be slow and subtle enough that it reads as atmosphere rather than as a status indicator. If a player can tell what the background is telling them, it is too strong.

Reduced motion should be considered — a slow colour drift is not motion in the vestibular sense, but a hard transition on every Case opening would be.

- [x] Background tone responds to the distribution of values still In Play
- [x] Cooler tones when high values dominate, warmer when trending low
- [x] Transitions are slow enough to read as atmosphere, not as a readout
- [x] The effect never competes with Tier reveal flashes for attention
- [x] No text, legend or indicator explains the effect to the player
- [x] The effect resets cleanly on a new game

## Notes

**Ranked, not averaged.** The Prize Ladder is geometric, so a mean of the
remaining *values* is dominated by the Top Prize — the board would read "cool"
right up to the instant that one Case opened, then lurch. Mean *rank* treats
losing ₱10,000 and losing ₱1 as equal and opposite, which is what the
atmosphere should follow.

**Reduced motion suppresses it entirely** rather than keeping it. The global
reduced-motion rule collapses the 2.6s transition to 0.01ms, which would turn a
slow drift into a hard colour snap on every Case opening — exactly what this
ticket warned against.

**A gain multiplier was needed.** Raw board tone rarely leaves ±0.35 in an
ordinary game, and at the layer's low alpha that is invisible. `AMBIENT_TONE_GAIN`
lifts it into view; it lives in config next to every other tunable. Raise it if
the room never seems to change, lower it if a player can tell what the colour is
telling them.

**The drift itself was not observed.** The browser pane here runs hidden and
freezes the document timeline, so the opacity transition sits pinned at its
start value forever. Verified the resolved values instead: with the transition
suppressed the warm layer computes to exactly the `--warm` variable (0.811 at a
board that had lost everything above ₱1,500). Someone should watch it drift on
real hardware.
