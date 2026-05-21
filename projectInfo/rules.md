# Tierlist

Digital adaptation of *My Favourite Things* by Nilgiri / Archie Edwards, rebranded around the S–F tier-list aesthetic.

## Theme & overview

A trick-taking party game where you tier rank your own favourite things in a category your neighbour picked for you — but you don't know what you tiered each item as during play. You see only the items in your hand; your *tiering* is hidden until each card is revealed in the trick. The player who tiered your hand still remembers what they wrote, giving them strategic insight into your moves. Win tricks (one per trick) by playing the lowest tier — except the F-tier ("hate") card, which specifically beats an S-tier ("favourite") card. Most hearts after two rounds wins.

## Player count

- **3–6 players.** Six colour identities (matching paper's six suits).
- Symmetric seating. No named roles.
- Player count is fixed at game start; can't add players mid-round.

## Components (data shapes)

- **Tier cards (per player):** 6 cards, one per tier — `S`, `A`, `B`, `C`, `D`, `F`. Each player owns one set in their colour. These are persistent identifiers; rank is fixed to the card.
- **Item slots (per player per round):** 6 free-text strings, one per tier card. Written by the player to one side (left in round 1, right in round 2). These are filled at the start of each round and discarded at round end.
- **Category (per player per round):** a free-text string chosen by their neighbour. Public on the big screen from the moment it's assigned.
- **Hand (per player during play):** the 6 tier cards (with the items written by the assigner) in shuffled, opaque order. Items visible to the holder; tiers hidden.
- **Hearts:** integer score per player. Pool of hearts is conceptually unlimited (10 awarded per game max).
- **First-player marker:** points to the player who leads the next trick. Passes left after each trick.
- **Category suggestion pool:** a static JSON list (seeded from the rulebook's example categories — TV shows, animals, etc.) used to surface 3 random suggestions to a player who is stuck.

## Setup (per game)

1. Lobby phase: players join via `/room/:id/player`. Each picks a colour; colours are unique.
2. Host clicks **Start** when 3–6 players are seated.
3. Server assigns the youngest-equivalent seat (or just first joiner) the first-player marker. Pass direction is set to **left**.
4. Hearts pool = 0 per player.

## Round flow

Each round has three phases. **2 rounds per game.** Round 1: pass left. Round 2: pass right.

### Phase 1 — Category Pick

- Each player privately chooses a category to **assign to a specific neighbour** — their **left** neighbour in R1, their **right** neighbour in R2.
- That neighbour will *write* the tier list, but **the assigner is the one who plays it** in the trick phase. (In paper terms: you "give your cards" to your neighbour for them to fill in, and they "give them back" for you to play.)
- Phone input: free-text field + 3 random suggestions from the pool (tap to fill).
- Once all players have submitted, all categories become **public on the big screen**: "Alice tiers Animals (assigned by Bob) · Bob tiers 90s movies (assigned by Carol) · ..."

### Phase 2 — Tier Writing

- Each player fills out 6 items in the category their **right** neighbour (R1) or **left** neighbour (R2) assigned them — same person, opposite direction labels.
- Concretely: you tier a list for the neighbour to your **right** in R1 (the one who picked your category). That neighbour will then play the resulting hand of 6 cards in the trick phase. You're the only person who knows the tier mapping.
- All players write in parallel; the big screen shows a "X / N players have submitted" progress.
- When you submit, your phone shows a **brief recap screen for ~8 seconds**: "Your tier list for *Animals* (Alice will play these): S=Cat, A=Dog, B=Hamster, C=Snake, D=Spider, F=Cockroach". After the recap, this info is **not shown again** during play — you have to remember which item was at which tier so you can read Alice's plays.
- After all players submit, the server shuffles each tier list and assigns it as a hand to the **assigner** (the one who picked the category). The assigner now sees the 6 items, but not their tiers, and will play them.

### Phase 3 — Card Play (5 tricks)

- At the start of this phase, each player holds a hand of 6 cards written by their **left** neighbour (R1) or **right** neighbour (R2). The items are visible to the holder; the tiers are hidden. The writer of each hand still remembers the tier mapping (with memory decay) — that's the asymmetric-info edge.
- For each of 5 tricks:
  1. **Reading (trick 1 only, before any play):** the big screen displays each player's category and the 6 items in their hand (in shuffled order), one player at a time, so everyone hears the table state.
  2. **Play:** starting with the first-player-marker holder, clockwise, each player taps a card in their phone hand to play it. The played card appears on the big screen with the item label visible and the tier still hidden (face-down or "?" placeholder).
  3. **Reveal (per trick, not per round):** once all players have played their card for *this trick*, tiers are revealed one at a time in turn order, with a short animation delay between each. This happens after every trick — not deferred to round end. Played cards' tiers stay visible for the rest of the round.
  4. **Resolve:** determine winner (see below). Award one heart. The winner advances to lead the next trick; the first-player marker passes to them.
  5. Played cards move to a "played" area on the big screen — items + revealed tiers visible — so players can see what's been seen and plan accordingly.
- After 5 tricks, each player has **1 card left in their hand** — the unplayed mystery card. Round ends.

### Trick-winning rule

- Tiers map to numeric ranks: `S=1, A=2, B=3, C=4, D=5`. **Lowest rank wins** the trick.
- **F-card exception:** if at least one player played an S-card *and* at least one player played an F-card in the same trick, the **F wins** (F is the "anti-S").
- **Tie-break:** if multiple players tied for the winning condition (e.g. two F-vs-S situations, or two S cards in a 6-player game), the **earliest in turn order** wins.

## End-game trigger

After **2 rounds × 5 tricks = 10 tricks**, the game ends.

## Scoring

- 1 heart per trick won. Max 10 hearts per game.
- Final score = total hearts.
- Most hearts wins. **Ties share the victory** — multiple winners are displayed equally.

## End-game reveal

After the final trick, the big screen does an animated walkthrough — for each player, in turn — of:

- Their assigned categories (both rounds).
- The complete tier list each neighbour wrote for them (`S` through `F`, including the unplayed mystery card).

This is the marquee digital-only moment: "Oh, *THAT* was Alice's F-tier 90s movie?!"

Final score screen with hearts follows.

## Big-screen view contract (`/room/:id`)

- **Lobby:** join code, list of joined players with their picked colour, "Start" button (host only) when ≥3 players.
- **Phase 1 (Category Pick):** "X / N players have picked a category" progress. No content revealed until all submit, then all assignments shown at once.
- **Phase 2 (Tier Writing):** all category assignments displayed (public). "X / N players have submitted their tier list" progress per round.
- **Phase 3 (Card Play):**
  - Centre: current trick area, cards being played by each player (item visible, tier hidden until reveal).
  - Side: cards already played this round (item + revealed tier), grouped per player so memory is easier.
  - Above each player's area: their colour, name, current heart count, and the category they're tiering.
  - First-player marker indicator next to the leader.
- **End-game reveal:** full animated walkthrough as described.
- **Final score:** hearts per player, winners highlighted.

## Phone view contract (`/room/:id/player/:playerId`)

- **Lobby:** colour pick, name entry.
- **Phase 1:** "Pick a category for [left/right neighbour]" — free-text input + 3 tappable suggestions. Copy reflects who you're picking *for* (the player whose hand you'll then play). Locked once submitted.
- **Phase 2:** "Tier your [category] for [neighbour]" — 6 input fields stacked vertically, labelled `S` (best) through `F` (worst / hate). Copy reflects who'll play your list (your right neighbour in R1, left in R2). Submit button enabled when all filled. After submit, ~8-second recap, then "waiting for others".
- **Phase 3:**
  - Hand: 6 cards stacked, each showing the item written by the assigner. Tier hidden. One card already-played per trick is greyed/removed.
  - During your turn, tap a card to play it.
  - During other turns, hand is locked but you can still see your remaining items.
  - Heart count and category visible at top.
- **End-game:** view-only of the big-screen reveal (or just a "look at the big screen" prompt).

## Edge cases

- **Player drops:** out of scope. This is a same-room party game; we assume everyone stays. No reconnect, no auto-play, no pause UI. If a player accidentally backgrounds the app, returning to it should still show the current state (passive reconnect to room state via `react-gameroom`), but no special handling for true disconnects.
- **Duplicate items in a hand:** a player could write the same item on two tiers ("Cat" on S and A). Allowed — quirky but legal. The reveal shows two "Cat" cards with different tiers.
- **Empty submission:** require all 6 fields filled before "Submit". No blanks.
- **All-F trick:** if every player plays an F card and no S is played in that trick, F has no winning power. **Open decision** — see below.
- **All cards tied:** in 6-player games, two players might both play S and both play F (the F wins, breaking the S-vs-S tie automatically because F beats S). Other multi-tie scenarios resolve by turn order.

## Naming / vocabulary

Public-facing labels (use these in UI strings):

- **Tier list** — the 6-card ranking a player wrote for a neighbour.
- **Category** — the prompt ("Animals", "TV shows", etc.).
- **Hand** — the 6 cards currently held by a player during a round.
- **Trick** — one round of card play (each player plays one card, lowest tier wins).
- **Heart** — score token (1 per trick won).
- **Round** — the full sequence of category pick + tier writing + 5 tricks. Game has 2 rounds.
- **S-tier / F-tier** — "favourite" and "hated" cards respectively. Avoid saying "rank 1" or "ranking card" in user-facing copy.
- **Mystery card** — the unplayed card left in hand at round end. Revealed only at game-end reveal.

## Open design decisions

- **All-F edge case:** if all players play F in the same trick (no S present), the rules don't specify a winner. Possible resolutions: no winner / heart held over / earliest-turn-order wins by default. **Decide during implementation.** Likely just earliest-turn-order — simplest.
- **Brief-recap duration:** 8 seconds is a guess. Tune during playtesting.
- **Category suggestion source:** seed from the rulebook's example list (page 12 of MFT_Rulebook.pdf). If we want more, we can curate later. Not a blocking decision.
- **Tier card visual style:** how the S/A/B/C/D/F cards look — colours per tier (the trope is red→green gradient), typography, animation on reveal. Open for design pass; rules don't constrain this.
- **Sound design:** trick reveals, F-beats-S "upset" stinger, heart-award sound. Worth adding but not in scope for v1.
- **Mock pages:** standard pattern — a `MockBigScreen` showing all phases with fake state, and `MockPlayerPhone` cycling through each phone view. Implement alongside real pages so we can iterate UI without two devices.
- **Per-player colour selection vs. server-assigned:** the paper game has players pick colours. Confirm whether digital should let players pick (with conflict resolution) or just auto-assign on join. Default: let them pick from available, fall back to auto-assign if conflicts.
