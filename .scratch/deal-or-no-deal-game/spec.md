# Deal or No Deal — browser game

Status: ready-for-agent

## Problem Statement

There is no game yet. The goal is a single-player, browser-based Deal or No Deal that feels expensive — suspenseful, well-paced, theatrical — while remaining a small, tunable codebase with no backend.

The hard part is not the rules. The rules are trivial: hide twenty values, open them in batches, offer money in between. The hard part is that the game is *only* worth playing if each Case opening carries weight, and weight comes from three things that are easy to get wrong:

- **The player must be able to see what they stand to lose.** A revealed number means nothing without the Prize Ladder visible beside it. Eliminating ₱10,000 is only a gut-punch if the player can watch it go dark.
- **The Offer must feel like a judgement, not a formula.** If it is reverse-engineerable the tension collapses into arithmetic; if it is unmoored from what is In Play it stops feeling responsive to the player's luck.
- **Escalation needs contrast.** If every reveal is maximum drama, none of them are.

A naive implementation satisfies the rules and produces something nobody wants to play twice.

## Solution

A single-page Next.js app. The player picks one of twenty Cases as their Player's Case, then opens the remaining nineteen across eight Rounds. After every Round the Bank makes an Offer and the player takes the Deal or says No Deal. Declining the Round 8 Offer leads to the Swap Decision, where two Cases remain and the player either keeps theirs or trades it.

The Prize Ladder is permanently visible — flanking the board on desktop, pinned to the top of the viewport on mobile — with eliminated values going dark as they are opened. Each Case opening is preceded by a tension beat and resolved with a reveal whose intensity is chosen by Tier: the highest remaining values get dread, the lowest get relief, the middle gets variety, and the whole intensity floor rises as Rounds progress.

During each Offer the player also sees the Offer History: every previous Offer, the change from the one before, and the best they have already refused.

All money is Philippine pesos, whole numbers only, ₱ symbol with comma separators.

## User Stories

### Starting a game

1. As a player, I want to see an intro screen before anything begins, so that I understand the rules before committing to a decision.
2. As a player, I want my first interaction to start the game, so that the browser's audio autoplay policy is satisfied by a real gesture and sound works for the rest of the session.
3. As a player, I want to choose the Top Prize before starting, so that I can play for stakes that interest me.
4. As a player, I want to see all twenty Cases laid out unopened, so that I understand the scale of what I am choosing from.
5. As a player, I want to see the full Prize Ladder before I pick, so that I know exactly what is hidden on the board.
6. As a player, I want to pick any Case as my Player's Case, so that the choice feels like mine.
7. As a player, I want my Player's Case to visibly leave the board and sit apart once chosen, so that I never confuse it with Cases still In Play.
8. As a player, I want confirmation that my Player's Case stays sealed until the end, so that I understand what I am committing to.

### Opening cases

9. As a player, I want to be told how many Cases I must open this Round, so that I always know where I am in the game.
10. As a player, I want a running count of how many Cases remain to open in the current Round, so that I can anticipate the next Offer.
11. As a player, I want to choose which Case to open, so that the outcome feels like a consequence of my decisions.
12. As a player, I want to tap a Case one at a time and see it through, so that each reveal gets its own moment rather than being lost in a batch.
13. As a player, I want a tension beat before the Case opens, so that anticipation builds instead of the value simply appearing.
14. As a player, I want the Case lid to open in 3D rather than the value snapping into place, so that the board feels like physical objects.
15. As a player, I want a spotlight to follow whichever Case is opening, so that my attention is directed and the board feels lit rather than flat.
16. As a player, I want opening one of the highest remaining values to feel like a disaster, so that my luck registers emotionally and not just numerically.
17. As a player, I want opening one of the lowest remaining values to feel like relief, so that good luck is rewarded with a different feeling than bad luck.
18. As a player, I want middle-value reveals to vary between playthroughs, so that the game does not become a repeated animation I stop watching.
19. As a player, I want reveals to intensify as Rounds progress, so that the endgame feels heavier than the opening.
20. As a player, I want a low value opened late in the game to still read as relief, so that the game never misinforms me about what just happened.
21. As a player, I want the opened Case to stay on the board showing its value, so that I can see the shape of what I have already eliminated.
22. As a player, I want the corresponding rung of the Prize Ladder to go dark the moment a Case opens, so that the consequence is immediately legible.
23. As a player, I want the Prize Ladder to stay on screen during every reveal, so that I can see what the elimination cost me as it happens.

### The bank's offer

24. As a player, I want the Bank to make an Offer after every Round, so that I face a real decision at regular intervals.
25. As a player, I want the Offer to arrive with its own moment — a sound and a pause — so that it registers as an event rather than a number changing.
26. As a player, I want the Offer to respond to what is still In Play, so that my luck visibly affects what I am being offered.
27. As a player, I want early Offers to be visibly stingy and later ones to close in on what the board is worth, so that holding out feels like it is rewarded.
28. As a player, I want the Offer to be unpredictable within a believable range, so that I cannot calculate it in advance and stop paying attention.
29. As a player, I want the Bank to occasionally lowball me badly, so that there are moments of genuine insult to react to.
30. As a player, I want the Bank to occasionally be unexpectedly generous, so that an Offer can surprise me in both directions.
31. As a player, I want every Offer to be a clean, readable amount, so that the number feels deliberate rather than computed.
32. As a player, I want to never be shown an Offer of ₱0, so that the Bank never appears broken.
33. As a player, I want the Offer to never exceed the best outcome still possible, so that taking the Deal is never trivially correct.
34. As a player, I want to see every previous Offer while I decide, so that I can judge the current one in context.
35. As a player, I want to see whether each Offer went up or down from the last, so that a falling Offer lands as the setback it is.
36. As a player, I want to see the best Offer I have already refused, so that I feel the weight of what I have passed up.
37. As a player, I want the Offer History to appear only while I am deciding, so that it does not clutter the board during play.
38. As a player, I do NOT want to be shown Expected Value or odds, so that the game remains a nerve test rather than an arithmetic exercise.

### Deal and no deal

39. As a player, I want to take the Deal at any Offer, so that I can stop whenever my nerve runs out.
40. As a player, I want taking the Deal to stop everything immediately, so that nothing continues running behind the ending.
41. As a player, I want taking the Deal to have its own stinger, so that the decision feels final.
42. As a player, I want to see what was in my Player's Case after taking the Deal, so that I learn whether I was right.
43. As a player, I want to see whether I beat the Offer I took, so that the ending resolves rather than simply stopping.
44. As a player, I want to say No Deal and continue, so that I can gamble on a better Offer.
45. As a player, I want No Deal to have its own declaration sound, so that the refusal feels like an act.

### The swap decision

46. As a player, I want declining the Round 8 Offer to lead to a distinct final screen, so that the endgame feels different from every Round before it.
47. As a player, I want to see exactly two Cases and exactly two possible values, so that the final decision is completely clear.
48. As a player, I want to choose between keeping my Player's Case and swapping for the last one, so that I own the final outcome.
49. As a player, I want the swap choice to have its own sound and pacing, so that it is not confused with opening another Case.
50. As a player, I want both values revealed at the end, so that I know what both choices would have given me.
51. As a player, I want the Case I am holding revealed last, so that the ending has a beat of suspense.
52. As a player, I want a celebration when I do well, so that winning feels like winning.
53. As a player, I want to see my final Winnings stated plainly, so that the game has a clear conclusion.

### Settings and replay

54. As a player, I want a settings panel reachable at any time, so that I can adjust the experience without leaving the game.
55. As a player, I want to change the Top Prize from settings, so that I can play for different stakes.
56. As a player, I want to be warned that changing the Top Prize starts a new game, so that I never lose a game in progress by accident.
57. As a player, I want to mute the game, so that I can play somewhere quiet.
58. As a player, I want to adjust volume, so that the sound sits where I want it.
59. As a player, I want a faster reveal speed option, so that I can replay without sitting through full theatrics every time.
60. As a player, I want reduced motion honoured from my operating system by default, so that the game does not make me unwell.
61. As a player, I want to override the motion setting myself, so that the default is not the final word.
62. As a player, I want to start a new game at any point, so that I am never stuck in a game I have lost interest in.
63. As a player, I want to play again from the ending screen, so that a finished game leads straight into another.
64. As a player, I want a new game to reshuffle the board, so that replaying is not a repeat.

### Presentation and platform

65. As a player, I want to play on my phone from a shared link, so that no installation is required.
66. As a player on a phone, I want the Prize Ladder always visible without scrolling, so that reveals still land on a small screen.
67. As a player on a phone, I want the Case grid usable with my thumb, so that tapping the wrong Case is not a constant risk.
68. As a player, I want every amount shown with a ₱ symbol and comma separators, so that values are instantly readable.
69. As a player, I want no centavos anywhere, so that the amounts read as prizes rather than transactions.
70. As a player, I want ambient sound, reveal stings and interface clicks to overlap without cutting each other off, so that the audio feels produced rather than stitched together.
71. As a player, I want the background atmosphere to shift with how the board is trending, so that the mood tracks my luck without me being told.

### Maintenance

72. As a maintainer, I want the Top Prize to be a single constant, so that changing the stakes does not mean rewriting the Prize Ladder.
73. As a maintainer, I want the Offer factor bands in one obvious place, so that I can retune the Bank's generosity after playtesting.
74. As a maintainer, I want the Offer rounding steps in one readable table, so that I can change how clean Offers look without touching the Offer formula.
75. As a maintainer, I want reveal durations as named constants, so that I can adjust pacing after playing without hunting through animation code.
76. As a maintainer, I want the Prize Ladder generator to work at any Top Prize, so that the presets are not special cases.
77. As a maintainer, I want to replace a placeholder sound with a real audio file in one line, so that sourcing real audio later is not a refactor.
78. As a maintainer, I want every game reproducible from a seed, so that a strange Offer seen during playtesting can be recovered and examined.

## Implementation Decisions

### Stack

Next.js App Router with TypeScript, Tailwind, Framer Motion for animation, Howler for audio, canvas-confetti for celebration bursts. Vitest as a devDependency for tests — **this is the one package outside the originally approved list, and it was flagged and approved.** Deployed to Vercel with no additional configuration. No database, no API routes, no auth, no persistence between sessions.

React Three Fiber and Three.js are **not** used. A hero 3D moment was considered and deferred until the CSS build has been played.

Zustand is not needed. All state lives in one reducer.

### Prize Ladder generation — see ADR 0001

The spec's original `TOP_PRIZE^(i/19)` curve is **not** used. It produced values like ₱233,572 and buried ten of twenty Cases below ₱1,000.

The bottom four rungs are pinned at ₱1, ₱5, ₱10, ₱50. The remaining sixteen are spread geometrically and snapped to a lattice of clean denominations (mantissas × powers of ten), with lattice density chosen from how many decades the Top Prize spans. Every value is a round number at any Top Prize.

The default ₱10,000 Prize Ladder is hand-authored, because the generator's output at that value prefers ₱150/₱250 over the more satisfying ₱100/₱700:

```
1, 5, 10, 50, 100, 150, 200, 300, 400, 500,
700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000
```

Expected Value ₱1,921. Median ₱600. Nine of twenty Cases at ₱1,000 or more. Swing 27%.

The generator is the fallback for every other Top Prize and is verified to produce twenty unique, ordered, clean values at ₱10,000, ₱50,000, ₱100,000 and ₱1,000,000. Presets exposed in settings are those four.

**Swing is the constraint to protect.** Flattening the Prize Ladder further to be more generous was modelled at 23% and 19% Swing; at those levels Offers stop reacting to what the player does and only the Top Prize matters. 27% is close to the floor.

### Offer calculation — see ADR 0002

Expected Value is the mean of every value In Play, including the Player's Case. The Offer is Expected Value × a factor rolled fresh every time inside the Round's band — never a reused multiplier.

Factor bands by Round are unchanged from the original spec: 0.10–0.25 for Round 1, 0.25–0.45 for Rounds 2–3, 0.45–0.65 for Rounds 4–5, 0.65–0.90 for Rounds 6–8.

**Wild swing:** 10% of Offers roll outside the band, half low and half high — down to 0.05 × Expected Value or up to 1.15 × Expected Value.

**Two guards, both load-bearing:**

- The Offer is clamped to 95% of the highest value In Play. Without this, a generous swing when the last two Cases are close in value (₱2,000 and ₱2,500 → 1.15 × ₱2,250 = ₱2,587) produces an Offer larger than the best possible outcome, making the Deal free money. Occurs in roughly 9 of 320,000 Offers; the clamp binds 0.01% of the time.
- The Offer is floored at ₱1.

**Rounding is a tier table, not a single constant.** A fixed step of 100 produced Offers of exactly ₱0 in 0.5% of all Offers, and left Round 1 with only six distinct possible Offers across 20,000 simulated games — defeating the requirement that Offers not be reverse-engineerable. The tier table eliminates ₱0 entirely and restores Round 1 to 60 distinct values:

```
above ₱10,000  → step ₱1,000
above  ₱1,000  → step   ₱100
above    ₱100  → step    ₱10
otherwise      → step     ₱1
```

An Offer below the cheapest Case In Play is **left in deliberately** (about 1.1% of Offers). It is an insulting Offer the player should refuse — a real beat, not a defect.

### Game state

One reducer holding the entire game. State is a discriminated union over phases: intro, picking the Player's Case, opening Cases within a Round, presenting an Offer, the Swap Decision, and game over. The Swap Decision is a distinct phase, **not** a ninth Round that opens zero Cases.

Round structure is 5, 4, 3, 2, 1, 1, 1, 1 Cases across eight Rounds — eighteen of the nineteen non-player Cases, leaving exactly one Case plus the Player's Case entering the Swap Decision.

**The PRNG seed lives in state and the reducer advances it deterministically.** `Math.random()` is never called inside the reducer. This keeps the reducer a genuinely pure `(state, action) => state`, makes tests deterministic without injecting anything, and makes every game reproducible from its seed.

### Tier classification — deviation from the original spec

Before each Case opens, values still openable are re-ranked, excluding the Player's Case. Top three remaining → high Tier. Bottom three remaining → low Tier. Everything else → one of several medium variants chosen at random.

**Tiering continues for the whole game.** The original spec made every reveal from Round 4 onward top-Tier; that was rejected. Rounds 4–8 open six Cases, so that rule produced six consecutive identical maximum-drama reveals — no dynamic range — and gave the ₱1 Case the full dread treatment, which actively misinforms the player.

Instead a Round-scaled intensity multiplier raises the floor as Rounds progress. A low-Tier reveal in Round 7 is more intense than a low-Tier reveal in Round 1, while remaining visibly lighter than a high-Tier reveal beside it. Escalation is preserved; contrast is preserved.

The pool is always large enough for this to be well-defined: the smallest openable pool during Rounds 1–3 is seven Cases, so top-three and bottom-three never overlap.

### Presentation

CSS 3D transforms for the board — perspective, preserve-3d, lid rotation on open, shifting shadows. A spotlight-style radial highlight follows the Case currently opening.

The Prize Ladder is permanently visible: two columns flanking the board on desktop (low left, high right), and a compact two-column strip **pinned to the top of the viewport** on mobile with the Case grid scrolling beneath it. Glanceability at the moment of reveal is the binding constraint — a collapsible drawer was rejected for exactly this reason.

Reveal durations are named constants, roughly 3.5s high Tier, 2s medium, 1.5s low, halved by the fast reveal-speed setting. `prefers-reduced-motion` is respected by default and overridable in settings; reduced motion removes shake and flash while preserving the flow.

Ambient background tone shifts with how the remaining pot is trending — cooler when high values dominate, warmer when it is trending low. **This is built last** and is the first thing to cut if the core loop needs the time.

Confetti fires on low-Tier reveals and on the final win screen only.

All amounts are formatted `en-PH`, zero decimal places, ₱ symbol with comma separators.

### Settings

Reachable at any time. Contains Top Prize preset selection, sound on/off, volume, reveal speed, reduced motion, and new game.

Changing the Top Prize mid-game **prompts for confirmation and then restarts** with a fresh shuffle. Every other setting applies live with no disruption.

### Audio — see ADR 0003

Ten cues: Case creak, rising tension loop, low-Tier chime, high-Tier sting, Offer arrival, Deal accepted, No Deal declared, swap decision, final fanfare, interface click.

Each cue is synthesised once at boot, rendered to a WAV blob, and handed to Howler as its source with an explicit `wav` format hint. **Oscillators are never played directly.** Howler cannot play an oscillator, so direct oscillator playback would mean placeholders bypass Howler entirely and swapping in a real file would become a cross-engine refactor — which the original spec explicitly ruled out. The WAV round-trip is the only reason the one-line swap works.

Requires a small hand-rolled WAV encoder, no dependency. Audio is unlocked by the intro screen's start interaction, satisfying browser autoplay policy.

No audio is sourced from the television show.

### Security posture — see ADR 0004

The game is a toy with no real stakes. All Case values are generated client-side and are readable in devtools. This was raised explicitly and accepted. It is not hardenable in place — the client must know the values to render the game.

## Testing Decisions

### What makes a good test here

Tests assert external behaviour through the reducer only. A test plays a game by dispatching actions and reads the resulting state. No test reaches into ladder generation, Offer calculation or Tier classification directly, and no test asserts on animation values, class names, or DOM structure — a test that checks a `rotateX` value tells you nothing about whether a reveal feels good.

### The single seam

**The game reducer.** Everything meaningful is an action against it, so a test can play a complete game with no React, no DOM, no timers, no audio. Because the PRNG seed is in state, tests are deterministic by choosing a seed — nothing needs injecting or mocking.

### Coverage

Property tests play many thousands of seeded games to completion and assert invariants across all of them. This is the same simulation approach that found the ₱0 Offers, the six-distinct-Offers quantisation and the wild-swing cap hole during design, made permanent:

- The Prize Ladder is always twenty unique, strictly ascending, clean values — at ₱10,000, ₱50,000, ₱100,000 and ₱1,000,000
- No Offer is ever ₱0
- No Offer ever exceeds 95% of the highest value In Play
- Every Offer is a whole number matching its rounding tier
- Offer factors stay inside the Round band except on wild swings, which stay inside their caps
- Exactly two Cases are In Play entering the Swap Decision, one of which is the Player's Case
- Exactly eighteen Cases are opened across a full eight-Round game
- Tier classification always matches the ranking of values still openable
- Taking the Deal terminates the game and no further Offers or openings are possible
- The same seed always produces an identical game

**These tests are guarding deliberate decisions, not just catching regressions.** ADR 0001, 0002 and 0003 all record choices that look like over-complication to a future reader; the invariants are what stop them being "simplified" back into bugs.

### Prior art

None — this is a greenfield repo. These tests establish the pattern.

## Out of Scope

- Any backend, database, API route, or persistence between sessions
- User accounts, authentication, multiplayer, leaderboards, or score history
- Three.js / React Three Fiber and any WebGL hero moment
- Real audio files — placeholders ship, sourcing royalty-free replacements is later work
- Deployment. The build is verified locally and committed; **nothing is published.** Both the Vercel and GitHub CLIs are authenticated and available when the decision is made to deploy
- Free-text entry of an arbitrary Top Prize — presets only. The generator needs roughly twenty clean rungs to work and validating arbitrary input was judged not worth the error states
- Showing the player Expected Value, odds, or any derived statistic. Deliberately excluded — it turns a nerve test into arithmetic
- Hardening the client-side board against inspection. See ADR 0004; not solvable client-side
- Testing animation, layout, audio output, or visual behaviour. These are playtesting concerns

## Further Notes

**Build order.** The core loop first — pick, open, offer, deal, swap, end — in plain CSS with placeholder audio, playable start to finish. Theatrics layered on after. Ambient tone shifting is last and is the designated cut.

**Expect to retune after playing.** The Offer factor bands, reveal durations and Swing were all set analytically, from simulation rather than from feel. The bands and durations are deliberately isolated as constants for exactly this. Swing is the exception — it is bounded by ADR 0001 and should not be lowered without re-measuring.

**Git identity mismatch.** Global git config is `drizzCore <fujimoto.sora78@gmail.com>` while the GitHub and Vercel accounts are `carlFoundency`. Commits will be attributed to drizzCore unless a repo-local identity is set.

**Issue tracker.** `/setup-matt-pocock-skills` has not been run for this repo, so no tracker is configured. This spec follows the local Markdown convention, which also matches the decision to keep everything off the internet for now.
