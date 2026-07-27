# 07 — 3D board, Case opening and spotlight

**What to build:** The board reads as physical objects under a light rather than a flat grid of boxes. Cases sit in perspective with shadows that shift as though lit. When a Case opens, its lid rotates open in 3D and a spotlight follows whichever Case is currently opening. There is a tension beat before each opening rather than the value simply appearing.

**Blocked by:** 04, 05

**Status:** ready-for-agent

CSS 3D transforms only — perspective, preserve-3d, lid rotation, shifting box-shadows. **No Three.js or React Three Fiber.** The brief is explicit that the CSS version must work end to end first, and a WebGL renderer in a phone game's bundle for one set piece was considered and rejected.

This ticket is the generic opening treatment applied to every Case. Differentiating the reveal by Tier is ticket 08 — build the single good animation here, then vary it there.

Reveal durations must be named constants, not values buried in animation code. The spec expects them to be retuned after playtesting.

`prefers-reduced-motion` is respected from this ticket onward: reduced motion removes shake and flash while preserving the flow of the game. Do not defer it to the settings ticket.

- [ ] The Case grid renders in perspective with preserve-3d
- [ ] Case lids rotate open in 3D — never an instant swap to the revealed value
- [ ] Shadows shift as though cast by a real light source
- [ ] A short tension beat precedes each opening
- [ ] A spotlight-style highlight follows the Case currently being opened
- [ ] Reveal durations are named constants in one findable place
- [ ] `prefers-reduced-motion` is honoured by default, removing shake and flash but preserving flow
- [ ] Animation performance is acceptable on a mid-range phone with twenty Cases on screen
- [ ] Taking a Deal halts every running animation immediately
