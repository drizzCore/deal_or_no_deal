# Offer rounding step scales with the offer's magnitude

The spec called for a single `ROUND_TO = 100` constant. Simulating 20,000 games on the ₱10,000 ladder showed this breaks two requirements at once.

Offers of exactly **₱0** appeared in 0.5% of all offers — roughly one game in twenty-five — because late-round Expected Value can fall below ₱100 entirely. And rounding to ₱100 quantised the randomness away: across 20,000 games, round 1 produced only **six** distinct offers ever (₱100–₱600), directly defeating the spec's own requirement that offers "never be reverse-engineered."

We replaced it with a `ROUNDING` tier table mapping offer size to step: ₱1,000 above ₱10,000; ₱100 above ₱1,000; ₱10 above ₱100; ₱1 below that. This eliminates ₱0 offers entirely and restores round 1 to 60 distinct values while keeping every offer a clean number.

## Consequences

**Do not "simplify" this back to a single constant.** It looks like needless complexity and is not — a fixed step cannot serve both a ₱10,000 board and a ₱1,000,000 one, and the failure mode at the small end is an offer of ₱0.

A tier table was chosen over the equivalent `10^(floor(log10(x)) - 1)` expression purely so the numbers stay findable and editable, per the spec's tuning requirement.
