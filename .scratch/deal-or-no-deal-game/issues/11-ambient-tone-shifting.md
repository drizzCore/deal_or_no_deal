# 11 — Ambient tone shifting

**What to build:** The background atmosphere drifts with how the board is trending — cooler when high values still dominate what is In Play, warmer and redder when it is trending low. The player is never told this is happening; the mood simply tracks their luck.

**Blocked by:** 08

**Status:** ready-for-agent

**This is the designated cut.** The spec names it explicitly as the first thing to drop if the core loop needs the time. It is the subtlest effect in the game and nothing else depends on it. If earlier tickets ran long or the game needs retuning after playtesting, close this as `wontfix` and spend the time there instead.

The shift must be slow and subtle enough that it reads as atmosphere rather than as a status indicator. If a player can tell what the background is telling them, it is too strong.

Reduced motion should be considered — a slow colour drift is not motion in the vestibular sense, but a hard transition on every Case opening would be.

- [ ] Background tone responds to the distribution of values still In Play
- [ ] Cooler tones when high values dominate, warmer when trending low
- [ ] Transitions are slow enough to read as atmosphere, not as a readout
- [ ] The effect never competes with Tier reveal flashes for attention
- [ ] No text, legend or indicator explains the effect to the player
- [ ] The effect resets cleanly on a new game
