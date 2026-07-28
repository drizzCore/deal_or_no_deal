# 09 — Settings panel

**What to build:** A settings panel the player can reach at any time without leaving the game. They can change the Top Prize, mute or adjust volume, speed up reveals, override reduced motion, and start a new game.

**Blocked by:** 08

**Status:** done

Changing the Top Prize mid-game **must prompt for confirmation and then restart**. It cannot apply in place: the Prize Ladder *is* the game state. Swapping it under a game in progress would mean Cases already opened for ₱300 now hold something else, and the Expected Value the last Offer was calculated from no longer exists. The confirmation is what keeps the player in control of a destructive action.

Every other setting applies live with no disruption.

Reduced motion defaults to the player's operating system preference and is overridable in both directions — the OS default is not the final word.

- [x] A settings control is reachable from every phase of the game
- [x] Top Prize preset selection offers ₱10,000, ₱50,000, ₱100,000 and ₱1,000,000
- [x] Changing the Top Prize mid-game prompts for confirmation before restarting
- [x] Confirming reshuffles the board at the new Top Prize
- [x] Cancelling leaves the game in progress untouched
- [x] Sound on/off and volume apply immediately
- [x] Reveal speed offers normal and fast; fast roughly halves reveal durations
- [x] Reduced motion defaults to the OS preference and can be overridden either way
- [x] New game starts a fresh shuffle from any phase
- [x] The panel is usable on a phone screen
