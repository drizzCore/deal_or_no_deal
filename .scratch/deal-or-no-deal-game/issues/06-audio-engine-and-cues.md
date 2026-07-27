# 06 — Audio engine and all ten cues

**What to build:** The game has sound. An ambient bed, reveal stings and interface clicks overlap cleanly without cutting each other off. Audio starts working from the player's first interaction on the intro screen, and can be muted or have its volume adjusted.

**Blocked by:** 04

**Status:** done (3 cues awaiting their triggers in 07/08 — see below)

Read ADR 0003 before starting. **Oscillators are never played directly.** Howler cannot play an oscillator, so direct oscillator playback would mean placeholders bypass Howler entirely and swapping in a real audio file later would become a cross-engine refactor — which the original brief explicitly ruled out.

Each cue is synthesised once at boot, rendered to a WAV blob, and handed to Howler as its source with an explicit `wav` format hint (Howler cannot infer a type from a data URI). This round trip is the only reason replacing a placeholder with a real file is a one-line change. Do not remove it as an unnecessary indirection.

The WAV encoder is hand-rolled — no new dependency.

No audio may be sourced from the television show. Placeholders are synthesised; royalty-free replacements are later work.

Ten cues: Case creak, rising tension loop, low-Tier chime, high-Tier sting, Offer arrival, Deal accepted, No Deal declared, swap decision, final fanfare, interface click.

- [x] A WAV encoder renders synthesised tones to blobs, with no new dependency
- [x] All ten cues exist as real Howl instances built from synthesised sources
- [x] Replacing any placeholder with a real audio file is a one-line change per cue
- [x] The ambient bed loops without cutting off other cues
- [x] Overlapping cues mix rather than interrupting each other
- [x] Audio is unlocked by the intro screen's start interaction, satisfying browser autoplay policy
- [x] Mute and volume controls work and take effect immediately
- [~] Every cue fires at its correct trigger point across a full game — **7 of 10 wired; 3 blocked, see below**
- [x] Taking a Deal stops all running audio immediately

## Carried to tickets 07 and 08

All ten cues are built, loaded and verified as real audio. Seven fire automatically today: `caseOpen`, `offerArrives`, `noDeal`, `swapDecision`, `dealAccepted`, `fanfare`, `uiClick`.

Three have no trigger yet, because the thing that triggers them does not exist:

- `tension` — plays through the countdown beat, which **ticket 07** builds
- `lowReveal` / `highReveal` — selected by Tier, which **ticket 08** builds

Nothing further is needed in the audio layer for these. Each is one `play()` call from the ticket that introduces its trigger.
