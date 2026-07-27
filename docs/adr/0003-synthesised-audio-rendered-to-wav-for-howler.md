# Placeholder audio is synthesised to WAV, then played through Howler

The spec asked for three things that cannot all hold as written: route every cue through Howler, ship Web Audio oscillator placeholders, and make swapping in a real audio file "a one-line change per cue, not a refactor."

Howler plays audio *sources* — URLs, data URIs, buffers. It cannot play an oscillator, which is a live Web Audio node. Implementing placeholders as oscillators would mean they bypass Howler entirely, and swapping in a real file would then mean moving that cue from one audio engine to the other — precisely the refactor the spec ruled out.

We synthesise each cue once at boot, render it to a WAV blob, and hand that to Howler as its source (with `format: ['wav']`, since Howler cannot infer a type from a data URI). Every cue is a real `Howl` from day one.

## Consequences

Overlapping playback, looping, volume and fades all work identically for placeholders and for real files, because there is only ever one audio path. Replacing a placeholder is genuinely one line — swap the synthesised source for a file path.

The cost is a small hand-rolled WAV encoder (~40 lines, no dependency) and a few milliseconds of generation at startup for roughly ten cues.

**Do not replace the WAV round-trip with direct oscillator playback.** It looks like an unnecessary indirection and is the only reason the one-line swap works.
