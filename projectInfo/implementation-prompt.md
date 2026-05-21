You're starting implementation of **Tierlist**, a digital adaptation of the paper boardgame *My Favourite Things*. Read `projectInfo/rules.md` first — that's the spec. Then read `projectInfo/aesthetics.md` — that's the visual brief (full CRT cosplay, golden-age arcade era; specific decisions about big screen vs. phone treatment).

The parent `Projects/CLAUDE.md` is auto-loaded and defines the stack, routing, deployment, and the `react-gameroom` rule. To restate the load-bearing rule: **`react-gameroom` is the user's library — never work around it.** If a need can't be cleanly met by its current API, stop and propose a library change rather than coding a consumer-side workaround.

## Non-obvious design decisions made during brainstorm

These are contractual but easy to re-litigate. Anchor on them:

- **Tier-list theming, not faithful re-skin.** Ranks are `S`, `A`, `B`, `C`, `D`, `F` (not 1–5 + heart). `S` is "favourite", `F` is "hate". F beats S; otherwise lowest letter wins. F has no comparison power outside the F-vs-S exception.
- **Brief recap, then memory.** After a player submits their tier list for a neighbour, their phone shows the recap for ~8 seconds, then it disappears for the rest of the game. The strategic asymmetry (writer knows the other's hand) is preserved as a memory game, not a persistent overlay. Don't add a "peek" button.
- **Categories: free-text plus 3 suggestions.** Phone has a free-text input *and* 3 random suggestions from a static pool (seed from the rulebook example list). Both work; don't make players pick a mode.
- **No disconnect handling.** This is a same-room party game. No pause UI, no auto-play for absent players, no reseat-on-rejoin flow. Passive reconnect to room state via `react-gameroom` is enough.
- **Big-screen end-of-game reveal.** After the last trick, the big screen does an animated walkthrough of every player's full tier list across both rounds — including the unplayed mystery card. This is the marquee moment; budget UI polish for it.
- **5 tricks per round, 2 rounds, "don't play your last card".** Faithful to paper. One card per player per round stays unplayed (the mystery card revealed only at end-game).
- **Round 2 reverses pass direction** (left → right). Mechanically the same; just flipped.

## Suggested starting point

1. **Domain types first.** Define `src/game/types.ts` from the components list in `rules.md` — `Tier` (`'S' | 'A' | 'B' | 'C' | 'D' | 'F'`), `TieredCard`, `Hand`, `PlayerState`, `Round`, `GameState`, `Trick`, etc. Make tier comparison and the F-beats-S rule explicit as a pure function with a unit test.
2. **Lobby via `react-gameroom`.** Wire `RoomPage` + `PlayerPage` to handle join, colour pick, and Start — before any game logic. Verify it works end-to-end on a phone before moving on.
3. **State machine + big-screen view.** Build the round-phase state machine (category-pick → tier-writing → 5×trick-play → next-round / reveal) and the big-screen views for each phase.
4. **Phone views last.** The phone is just a controller — it should be straightforward once the state machine is solid.
5. **Mock pages alongside.** Add `MockBigScreen` and `MockPlayerPhone` with fake state so you can iterate UI without two devices. Standard pattern in this directory.

## Stop and confirm the domain types with me before writing any UI.
