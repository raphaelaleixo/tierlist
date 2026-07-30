# Mobile pass — make the phone view fit, and replace drag-reorder with tier guesses

Date: 2026-07-30
Status: approved in conversation, pending written review

## Problem

First real iPhone playtest surfaced two independent defects.

1. **The layout doesn't fit the screen.** Content taller than the viewport is
   unreachable — it doesn't scroll, it's just cut off.
2. **Drag-to-reorder the hand is unusable.** The long-press-then-drag gesture
   loses to the carousel's native scroll most of the time.

They are unrelated in cause and can ship independently.

## Part 1 — Layout

### Root cause

`PhoneGame.tsx:129-141` renders each phase body as `position: absolute;
inset: 0`, and nothing in the chain sets `overflow-y`. The shell is
`height: 100dvh` (`PlayerPage.tsx:34-42`), `PhoneGame` takes the remainder via
`flex: 1; minHeight: 0`, and the phase body is pinned to exactly that box.

Content taller than the box therefore renders outside it with no way to reach
it: the phase layer doesn't scroll, and the document root can't either because
the shell is a fixed-height flex column.

The absolute positioning exists so the outgoing and incoming phase bodies can
be stacked during the `phoneEnter` / `phoneExit` slide. It is not gratuitous
and should stay.

Tier-writing is the screen most likely to overflow, and the authorship-copy
work of 2026-07-30 made it taller by adding a footnote above the submit
button. On an iPhone SE (~550px usable): 6 inputs × 56px + header ~130 +
footnote ~40 + button ~50 + padding ~48 ≈ 604px into ~550px.

### Changes

1. **`src/components/PhoneGame.tsx`** — add `overflowY: 'auto'` and
   `overscrollBehavior: 'contain'` to both absolute phase layers (`:111-127`
   outgoing, `:129-145` incoming). Content that fits is unchanged; content that
   doesn't becomes scrollable. `overscroll-behavior: contain` stops a scroll at
   the end of the phase body chaining to the page behind it.

2. **`src/pages/PlayerPage.tsx:34-42`** — change the shell from `100dvh` to
   `100svh`, keeping the `100vh` fallback for browsers without the unit.
   `dvh` tracks the *current* viewport, so when Safari's toolbar slides back
   into view the box shrinks and clips. `svh` is the toolbar-visible height —
   always fits, at the cost of some dead space when the toolbar is hidden. For
   a fixed app shell that is the right trade. Apply the same change to
   `MockPlayerPhone.tsx:182-183` so the mock keeps matching the real shell.

3. **`index.html:5`** — add `viewport-fit=cover` to the viewport meta, and give
   the card-play footer bar (`PhoneCardPlay.tsx`, the black bottom strip)
   `paddingBottom: 'calc(10px + env(safe-area-inset-bottom))'` so it clears the
   home indicator. Without `viewport-fit=cover` the `env()` values are zero, so
   both halves are needed for either to matter.

### Out of scope

Not re-flowing the tier-writing form to be shorter. Scrolling makes it
reachable; whether six 56px inputs is the right density is a separate design
question.

## Part 2 — Tier guesses replace drag-reorder

### Why reordering existed, and why it was the wrong shape

Reordering was a memory aid. You hold a neighbour's list and never learn its
tiers, so reordering was how you recorded your guesses about them and revised
as reveals eliminated possibilities. It is note-taking.

Position is a weak encoding for that — "this card is third" doesn't say
third-*what* — and it is precisely what forced a horizontal drag inside a
horizontal scroller.

### Why the drag can't be tuned into working

`PhoneCardPlay.tsx:470` sets `touch-action: pan-x`, handing horizontal panning
to the browser. `:117` waits out `delay: 500, tolerance: 10`. Any drift beyond
10px during that half-second both cancels the pending drag and commits the
native scroller — and once iOS has begun a pan, `preventDefault` on later
`touchmove` cannot reclaim it. The drag and the scroll share an axis, so this
is a race the user loses by design, not by mistuning.

The usual iOS suspects are already handled: `WebkitTouchCallout: 'none'` and
`userSelect: 'none'` are set at `:463-465`.

### The replacement

A **guess** is a tier the holder privately assigns to a card in their own hand.
It renders in the same banner slot as the real tier, suffixed with `?` —
`S?`, `A?`.

**Decisions taken (human, 2026-07-30):**

- **Scratch notes only.** Guesses live in local component state, never reach
  Firebase, never reach the big screen, and die with the card when it is
  played. Not persisted across a refresh. Rejected alternatives: persisting and
  comparing guess-vs-actual, and scoring guesses on the big screen — both
  compete with the end-game reveal, which is the game's actual payoff, and
  reward whoever bookkeeps hardest.
- **Drag is removed entirely, and card positions stay as dealt.** Rejected
  auto-sort-by-guess: cards rearranging under your finger after each tag is
  unrequested motion, and it destroys "the card I keep on the left" as a
  memory anchor — the very thing reordering was for. An explicit *Sort by
  guess* button is a possible later addition, deliberately not built now.
- **Two buttons in fixed positions**, never swapping roles. Playing a card is
  irreversible; a slot that means "Guess" during other players' turns and
  "Play" on yours trains a mis-tap that cannot be undone.
- **The button says "Guess tier", not "Add a tier label".** The word *guess*
  carries the disclaimer in the affordance, so the picker doesn't have to argue
  the point.

### Changes

1. **`src/components/TierCard.tsx`** — add an optional `guess?: Tier` prop.
   Precedence in the bottom banner (`:324`) and the accent colour (`:94`):
   - `revealed` → real tier, full `TIER_COLORS[tier]`
   - else `guess` set → `` `${guess}?` ``, `TIER_COLORS[guess]` at 55% opacity
     so a guess never reads as fact. Opacity rather than desaturation, because
     desaturating the tier palette collapses adjacent tiers toward the same
     grey and the letter would end up carrying all the signal.
   - else → `?`, existing grey `#9a9a9a`

   The banner already renders `{revealed ? tier : "?"}`, so this is one
   additional branch, not new structure.

2. **`src/components/phone/PhoneCardPlay.tsx`**
   - Remove `DndContext`, `SortableContext`, `useSortable`, `MouseSensor`,
     `TouchSensor`, `useSensors`, the `horizontalListSortingStrategy` import,
     the sensor definitions (`:111-117`), and the wrapper (`:248-301`).
     `SortableCard` becomes a plain `HandCard`.
   - Remove `touch-action: pan-x` (`:470`) — with no drag competing, the
     carousel can use the browser's default panning. Keep
     `WebkitTouchCallout` / `userSelect: none`.
   - Delete the `orderedIds` local order state and its reconciliation effect
     (`:75-98`) and the `orderedHand` memo. Render `myHand` directly.
   - Add `guesses: Record<string, Tier>` local state, keyed by `cardId`,
     reconciled against the hand the same way `orderedIds` was (drop entries
     whose card has left the hand).
   - **Ungate selection from `isMyTurn`.** `onTap` (`:288-292`) currently
     requires `isMyTurn && !trickComplete && !iAlreadyPlayedThisTrick`.
     Selection must work whenever you hold the card, because guessing is most
     useful during other players' turns. Only the *play* action stays gated —
     `canPlay` (`:76-77`) is unchanged.
   - Replace the single full-width CTA (`:307-347`) with a two-button row:
     - secondary **Guess tier** — enabled whenever a card is selected,
       regardless of turn
     - primary — unchanged behaviour and labels (`Pick a card` / `Play` /
       `Waiting` / `Continue`), still gated on `canPlay`

     When the trick is resolved the primary becomes the shared `Continue`, as
     today. `Guess tier` stays available then too.

3. **The picker — inline, not a modal.** Tapping `Guess tier` reveals a row of
   six tier chips `S A B C D F` directly above the button row, with a small
   **Clear** action. Tapping a chip sets the guess and collapses the row;
   tapping `Guess tier` again collapses it without changing anything. If the
   card already has a guess, that chip renders selected — guesses are
   revisable, which is the whole point.

   Inline rather than a `Dialog` for two reasons: a modal would cover the card
   whose item you are reading in order to decide, and the phone views have no
   existing Dialog idiom to match (`PhoneCategoryPick.tsx:279` uses a
   `Popover`, but only because the emoji picker is a large third-party grid).
   Inline also avoids a focus trap and a dismiss gesture for what is a
   six-option choice.

   The chips carry the disclaimer: a short label on the row reading
   `Your guess — only you see this`. Six chips plus Clear across a 375px
   screen leaves roughly 44px per target, which meets the minimum touch size;
   if it proves tight, Clear moves to a text link beneath the row rather than
   shrinking the chips.

### Explicitly unchanged

- `src/game/*` — no domain logic changes. Guesses are pure UI state.
- The big screen — guesses never leave the phone.
- The two-step play flow — select, then confirm.

## Testing

Existing suites must stay green (`rules.test.ts`, `lifecycle.test.ts`,
`deserialize.test.ts`, `PhoneTierWriting.test.tsx`).

**New component tests** in `src/components/phone/PhoneCardPlay.test.tsx`.
These assert behaviour, not copy, so they sit inside the project's
no-display-string-assertions rule:

1. A card can be selected when it is **not** the player's turn (the regression
   guard for the ungating — this is the load-bearing change).
2. The primary play action remains disabled when it is not the player's turn,
   even with a card selected.
3. Setting a guess renders the guessed tier with its `?` suffix on that card,
   and clearing it restores the unguessed state.
4. A guess does not survive the card leaving the hand.

`PhoneCardPlay` imports `writeGameState` from `../../hooks/useGameState`, which
imports `../firebase` and initialises at module load — mock that module in the
test, as `PhoneTierWriting.test.tsx` already does.

**Manual, on a real iPhone** — the only way to confirm the actual defects are
gone, since neither reproduces in jsdom:

- Tier-writing scrolls and nothing is unreachable.
- Nothing clips when Safari's toolbar slides in and out.
- The footer bar clears the home indicator.
- The carousel scrolls cleanly with no long-press interfering.

## Open questions

None.
