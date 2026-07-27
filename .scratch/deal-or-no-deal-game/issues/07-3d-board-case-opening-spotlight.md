# 07 — 3D board, Case opening and spotlight

**What to build:** The board reads as physical objects under a light rather than a flat grid of boxes. Cases sit in perspective with shadows that shift as though lit. When a Case opens, its lid rotates open in 3D and a spotlight follows whichever Case is currently opening. There is a tension beat before each opening rather than the value simply appearing.

**Blocked by:** 04, 05

**Status:** done (perf on real hardware unverified — see below)

CSS 3D transforms only — perspective, preserve-3d, lid rotation, shifting box-shadows. **No Three.js or React Three Fiber.** The brief is explicit that the CSS version must work end to end first, and a WebGL renderer in a phone game's bundle for one set piece was considered and rejected.

This ticket is the generic opening treatment applied to every Case. Differentiating the reveal by Tier is ticket 08 — build the single good animation here, then vary it there.

Reveal durations must be named constants, not values buried in animation code. The spec expects them to be retuned after playtesting.

`prefers-reduced-motion` is respected from this ticket onward: reduced motion removes shake and flash while preserving the flow of the game. Do not defer it to the settings ticket.

- [x] The Case grid renders in perspective with preserve-3d
- [x] Case lids rotate open in 3D — never an instant swap to the revealed value
- [x] Shadows shift as though cast by a real light source
- [x] A short tension beat precedes each opening
- [x] A spotlight-style highlight follows the Case currently being opened
- [x] Reveal durations are named constants in one findable place
- [x] `prefers-reduced-motion` is honoured by default, removing shake and flash but preserving flow
- [~] Animation performance is acceptable on a mid-range phone with twenty Cases on screen — **not measurable here, see below**
- [x] Taking a Deal halts every running animation immediately

## What could not be verified in this environment

The Browser pane runs hidden and does not composite frames, which freezes the
document timeline — CSS transitions sit at `currentTime: 0` and never advance.
Animation *playback* therefore cannot be observed here.

What was verified instead, and is sufficient to know the CSS is right:

- With the transition suppressed, an open lid's computed transform decodes to
  exactly **−118°**, and a closed lid to identity
- The body's inset shadow switches to its "open" value
- `is-arming` / `is-open` toggle on the correct nodes at the correct moments
- The lid DOM node **survives** the open (see below), so there is a start value
  to animate from
- The spotlight moves between Cases (12.5%/30% → 12.5%/90%)
- Interrupting a beat leaves zero Cases opened — the timer really is cancelled

**Frame rate on a real phone is untested.** Someone should open this on a
mid-range device and watch it. The costs are deliberately small — one spotlight
element, twenty lids each transitioning `transform` and `box-shadow`, and no
per-frame JavaScript — but that is reasoning, not measurement.

## A bug this ticket introduced and fixed

`CaseTile` originally rendered a `<button>` when selectable and a `<div>` once
opened. React treats a type change as unmount-and-remount, so opening a Case
destroyed the lid and recreated it already-open: no transition, an instant swap,
exactly what this ticket forbids. The 3D subtree now lives in an element whose
type never changes, and the button is an overlay that unmounts on open.
