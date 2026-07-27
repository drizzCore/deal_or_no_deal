# 10 — Mobile layout

**What to build:** The game is properly playable on a phone from a shared link. The Prize Ladder stays visible at all times without scrolling, the Case grid is comfortable to tap with a thumb, and the Offer panel and Offer History fit the screen.

**Blocked by:** 05, 07

**Status:** ready-for-agent

**The binding constraint is glanceability at the moment of reveal.** If the Prize Ladder is off-screen when a Case opens, the reveal means nothing and the entire Tier system stops paying off. A collapsible drawer saves the most space and was rejected for exactly this reason — do not reintroduce one.

The Prize Ladder is pinned to the top of the viewport as a compact two-column strip, with the Case grid scrolling beneath it.

The measurements that forced this: a 4×5 Case grid is roughly 350px tall and a full-size ladder another 240px, which overflows a 667px phone once the Player's Case and Offer panel are included. Something had to give, and it was not the ladder.

- [ ] The Prize Ladder is pinned to the top of the viewport on small screens and never scrolls away
- [ ] The ladder remains readable when compacted to two columns
- [ ] The Case grid scrolls beneath the pinned ladder
- [ ] Case tap targets are comfortable for a thumb and mis-taps are not a constant risk
- [ ] The Player's Case remains clearly distinct and visible on a small screen
- [ ] The Offer panel and Offer History table fit without horizontal scrolling
- [ ] The Swap Decision and game over screens work on a phone
- [ ] The game is playable start to finish at a 375px viewport width
- [ ] Nothing about the desktop flanking-column layout regresses
