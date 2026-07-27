# 01 — Scaffold, reducer, Prize Ladder and peso formatting

**What to build:** Loading the app shows a Deal or No Deal board — the full Prize Ladder laid out in pesos and twenty numbered, unopened Cases. Nothing is interactive yet, but the board is real: the values are generated, shuffled into Cases, and rendered. Changing the Top Prize in config produces a different but equally clean Prize Ladder.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Read `spec.md` and ADR 0001 before starting. The Prize Ladder generation approach is a deliberate rejection of the obvious geometric formula and the reasoning is recorded there.

The default ₱10,000 Prize Ladder is hand-authored and must be used verbatim as the override:

```
1, 5, 10, 50, 100, 150, 200, 300, 400, 500,
700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000
```

The generator is the fallback for every other Top Prize: pin the bottom four rungs at ₱1, ₱5, ₱10, ₱50, spread the remaining sixteen geometrically, and snap each to a lattice of clean denominations (mantissas × powers of ten) whose density is chosen from how many decades the Top Prize spans.

The seeded PRNG living in state is the decision that makes the whole test strategy work — see the Testing Decisions section of the spec. Do not call `Math.random()` inside the reducer.

- [ ] Next.js App Router + TypeScript + Tailwind scaffolded, `npm run build` passes
- [ ] Vitest installed as a devDependency and running
- [ ] Game state is a single reducer over a discriminated union of phases; the PRNG seed lives in state and the reducer advances it deterministically
- [ ] A `NEW_GAME` action builds the Prize Ladder, shuffles the twenty values into Cases, and sets the phase to intro
- [ ] The ₱10,000 Prize Ladder matches the hand-authored values above exactly
- [ ] The generator produces twenty unique, strictly ascending, clean denominations at ₱50,000, ₱100,000 and ₱1,000,000
- [ ] Top Prize is a single constant; the four presets are defined in one obvious place
- [ ] All amounts render with a ₱ symbol, comma separators and no decimals
- [ ] The Prize Ladder renders as two columns, low values left and high values right
- [ ] Twenty numbered Cases render in a grid
- [ ] Tests: the Prize Ladder is always twenty unique ascending clean values, at all four Top Prizes
- [ ] Tests: the same seed always produces an identical board
