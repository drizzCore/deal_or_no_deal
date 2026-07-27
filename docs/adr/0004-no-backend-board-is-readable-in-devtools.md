# No backend, and the board is readable in devtools

All twenty Case values are generated in the browser and held in React state. There is no server, no database and no persistence. Anyone who opens devtools can read which Case holds the Top Prize before choosing, and can read the Offer roll before deciding.

This was raised explicitly and accepted: the game is a toy with no real stakes. Nothing rides on the outcome, so there is nothing to protect.

## Consequences

**This is not a bug and cannot be hardened in place.** Obfuscating the values, hashing them, or generating them lazily only raises the effort required — the client must know the answer to render the game, so the answer is always reachable.

If real money is ever attached to the outcome, the fix is architectural, not incremental: either move value generation and Offer calculation behind a server, or adopt a host-run model where a single operator holds the only open session. Do not attempt to solve it client-side.
