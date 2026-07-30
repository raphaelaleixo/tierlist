# Mobile Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the phone view fit an iPhone screen, and replace the unusable drag-to-reorder with an explicit per-card tier guess.

**Architecture:** Two independent halves. Task 1 makes overflowing phase bodies scrollable and pins the shell to the toolbar-visible viewport height. Tasks 2–5 remove dnd-kit from the hand and add a private, local-only "guess" per card, rendered in the tier banner `TierCard` already draws.

**Tech Stack:** Vite + React 19 + TypeScript (strict), MUI (`sx`), Vitest + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-07-30-mobile-pass-design.md`

## Global Constraints

- **Guesses never leave the phone.** Local React state only. Never written to Firebase, never in `GameState`, never on the big screen.
- **Guesses are scratch notes.** Not persisted across a refresh. Dropped when their card leaves the hand.
- **Do not modify `src/game/lifecycle.ts` or `src/game/rules.ts`.** No domain-logic changes; guesses are pure UI state.
- **Playing a card stays irreversible and turn-gated.** Ungating applies to *selection* only. `canPlay` keeps every condition it has today.
- **Buttons never swap roles between positions.** Only labels and enabled state change.
- **The word is "guess", not "label"** — in the button, the picker, and any copy.
- Use they/them for any other player in copy; never infer pronouns from a name.
- Tests assert behaviour, not wording. Do not assert on prose copy.
- Existing suites must stay green: `rules.test.ts`, `lifecycle.test.ts`, `deserialize.test.ts`, `PhoneTierWriting.test.tsx`.
- Verification: `npm test`, `npm run lint`, `npm run build`.
- Work on `main` (the human works on main for this project; no feature branch).
- `PhoneCardPlay` and `TierCard` pull in `writeGameState` → `../firebase`, which calls `initializeApp` at module load and throws without env vars. Component tests must `vi.mock` the hook module. `src/components/phone/PhoneTierWriting.test.tsx` is the working precedent — read it before writing new tests.

---

## File Structure

| File | Change | Responsibility after the change |
|---|---|---|
| `src/components/PhoneGame.tsx` | Modify | Phase transition container; now also the scroll boundary for phase bodies |
| `src/pages/PlayerPage.tsx` | Modify | Phone shell; pinned to `100svh` so it never clips |
| `src/pages/MockPlayerPhone.tsx` | Modify | Dev shell; kept in sync with the real one |
| `index.html` | Modify | Adds `viewport-fit=cover` so `env(safe-area-inset-*)` resolves |
| `src/components/TierCard.tsx` | Modify | Card visual; gains an optional `guess` and one banner branch |
| `src/components/TierCard.test.tsx` | Create | Pins the three-way banner precedence |
| `src/components/phone/PhoneCardPlay.tsx` | Modify | Hand + play flow; loses dnd-kit, gains guess state and the picker |
| `src/components/phone/PhoneCardPlay.test.tsx` | Create | Pins off-turn selection, the play gate, and guess set/clear |

---

### Task 1: Make the phone layout fit

Independent of Tasks 2–5 and shippable alone.

**Files:**
- Modify: `src/components/PhoneGame.tsx:111-145`
- Modify: `src/pages/PlayerPage.tsx:34-42`
- Modify: `src/pages/MockPlayerPhone.tsx:182-183`
- Modify: `index.html:5`
- Modify: `src/components/phone/PhoneCardPlay.tsx` (footer bar padding, around `:353-363`)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks. Tasks 2–5 touch `PhoneCardPlay` too, but a different region (the hand and CTA, not the footer bar).

- [ ] **Step 1: Make phase bodies scrollable**

In `src/components/PhoneGame.tsx`, both absolute layers need the same treatment. In the **outgoing** layer (`:111-127`), add two properties after `flexDirection: 'column',`:

```tsx
            overflowY: 'auto',
            overscrollBehavior: 'contain',
```

Then in the **incoming** layer (`:129-145`), add the identical two properties after its `flexDirection: 'column',`.

Both layers get it, not just the live one: they render the same content and are visible simultaneously during the slide, so differing overflow rules would make the outgoing copy lay out differently mid-animation.

Add this comment directly above the outgoing layer's `<Box`:

```tsx
      {/* Both layers scroll. The shell is a fixed-height flex column and these
          are `position: absolute; inset: 0`, so without `overflow-y` any phase
          body taller than the viewport renders outside the box with no way to
          reach it — the document root can't scroll either. `overscroll-behavior:
          contain` stops a scroll that hits the end from chaining to the page. */}
```

- [ ] **Step 2: Pin the shell to the toolbar-visible viewport**

In `src/pages/PlayerPage.tsx:39-42`, change:

```tsx
      '@supports (height: 100dvh)': {
        '.tl-player-screen': { height: '100dvh' },
      },
```

to:

```tsx
      // `svh`, not `dvh`: `dvh` tracks the CURRENT viewport, so when Safari's
      // toolbar slides back into view the box shrinks and clips its content.
      // `svh` is the toolbar-visible height — it always fits, at the cost of
      // some dead space while the toolbar is hidden. Right trade for a fixed
      // app shell that must never clip.
      '@supports (height: 100svh)': {
        '.tl-player-screen': { height: '100svh' },
      },
```

Also update the comment at `:22` which currently reads "`100dvh` tracks the visible area on mobile." — change that sentence to "`100svh` is the toolbar-visible height, so the shell never clips."

- [ ] **Step 3: Keep the mock shell in sync**

In `src/pages/MockPlayerPhone.tsx:183`, change:

```tsx
        '@supports (height: 100dvh)': { height: '100dvh' },
```

to:

```tsx
        '@supports (height: 100svh)': { height: '100svh' },
```

- [ ] **Step 4: Enable safe-area insets**

In `index.html:5`, change:

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

to:

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- [ ] **Step 5: Clear the home indicator**

In `src/components/phone/PhoneCardPlay.tsx`, the black footer bar currently has `py: 1.25` (around `:361`). Replace that single line with:

```tsx
          pt: 1.25,
          // `env()` resolves to 0 without `viewport-fit=cover` in index.html,
          // so both halves are needed for either to matter.
          pb: 'calc(10px + env(safe-area-inset-bottom))',
```

`py: 1.25` is 10px at the default MUI spacing of 8px, so the `10px` base preserves the current look on devices with no inset.

- [ ] **Step 6: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS.

No automated test here — this is layout, and neither defect reproduces in jsdom (there is no real viewport, no browser toolbar, and no safe-area inset). Asserting on `sx` values would test that the code says what it says, not that the bug is fixed. Real verification is Step 7.

- [ ] **Step 7: Verify manually — REQUIRED, do not skip or fake**

If you cannot drive a real browser, mark this NOT PERFORMED and say so plainly. Do not report it as passing.

`npm run dev`, then on a phone (or a browser device-emulation viewport at 375×667):
1. `/mock/phone` → `Tier-writing · fresh`, seat 1 — the form should now scroll and the Lock-it-in button should be reachable.
2. Scroll up and down so the mobile toolbar slides in and out — nothing should clip.
3. `/mock/phone` → `Card-play · 2/4 played` — the black footer bar should sit above the home indicator, not under it.

- [ ] **Step 8: Commit**

```bash
git add src/components/PhoneGame.tsx src/pages/PlayerPage.tsx src/pages/MockPlayerPhone.tsx index.html src/components/phone/PhoneCardPlay.tsx
git commit -m "Make the phone layout fit the viewport

Phase bodies are position:absolute inset:0 inside a fixed-height flex
column with no overflow-y, so content taller than the viewport was
unreachable — it didn't scroll and the document root couldn't either.
Tier-writing overflowed an iPhone SE.

Also pin the shell to 100svh rather than 100dvh so a returning Safari
toolbar can't clip it, and add viewport-fit=cover plus a safe-area
inset so the card-play footer clears the home indicator."
```

---

### Task 2: Give `TierCard` an optional guess

**Files:**
- Modify: `src/components/TierCard.tsx` (props `:47-78`, accent `:94`, banner `:305-326`)
- Test: `src/components/TierCard.test.tsx` (create)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `TierCard` accepts a new optional prop `guess?: Tier`. Banner precedence: `revealed` wins over `guess`, `guess` wins over nothing. Task 5 passes this prop.

- [ ] **Step 1: Write the failing test**

Create `src/components/TierCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TierCard from './TierCard';

// The banner is the only place a tier is ever shown on a card. It has three
// states and the precedence between them is the whole contract:
//   revealed        -> the real tier, full colour
//   guess, unrevealed -> "S?" style, muted
//   neither         -> "?"
function renderCard(props: Partial<React.ComponentProps<typeof TierCard>> = {}) {
  return render(
    <TierCard
      emoji="🐾"
      category="Animals"
      writerName="Bob"
      holderColor="red"
      item="Cat"
      tier="S"
      revealed={false}
      {...props}
    />,
  );
}

describe('TierCard tier banner', () => {
  it('shows "?" when unrevealed with no guess', () => {
    renderCard();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows the guessed tier with a "?" suffix when unrevealed', () => {
    renderCard({ guess: 'A' });
    expect(screen.getByText('A?')).toBeInTheDocument();
    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });

  it('shows the real tier once revealed, ignoring any guess', () => {
    renderCard({ tier: 'S', revealed: true, guess: 'F' });
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.queryByText('F?')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/TierCard.test.tsx`
Expected: FAIL — the `guess` prop doesn't exist, so `A?` is never rendered (TypeScript will also reject the unknown prop).

- [ ] **Step 3: Add the prop**

In `src/components/TierCard.tsx`, in the `TierCardProps` interface immediately after the `revealed` prop and its comment (around `:61-62`), add:

```tsx
  /** The holder's private guess at this card's tier. Shown as "S?" in the
   *  banner while `revealed` is false, muted so it never reads as fact.
   *  Ignored once `revealed` is true. Never leaves the holder's device. */
  guess?: Tier;
```

Then add `guess,` to the destructured parameter list in the function signature, directly after `revealed,` (around `:87`).

- [ ] **Step 4: Drive the banner from it**

Add the `alpha` import. `src/components/TierCard.tsx` should import it from MUI's styles entry:

```tsx
import { alpha } from "@mui/material/styles";
```

Replace the accent line at `:94`:

```tsx
  const accent = revealed ? TIER_COLORS[tier] : "#9a9a9a";
```

with:

```tsx
  // A guess borrows the tier's colour at reduced alpha rather than a
  // desaturated version: desaturating this palette collapses adjacent tiers
  // toward the same grey, which would leave the letter carrying all the signal.
  const showGuess = !revealed && guess !== undefined;
  const accent = revealed
    ? TIER_COLORS[tier]
    : showGuess
      ? alpha(TIER_COLORS[guess], 0.55)
      : "#9a9a9a";
```

Then in the banner (`:305-326`) make two changes. The transform at `:322`:

```tsx
              transform: revealed ? "none" : "translateY(110%)",
```

becomes:

```tsx
              // A guess slides the banner up early, reusing the reveal
              // animation — so committing a guess feels like a small reveal.
              transform: revealed || showGuess ? "none" : "translateY(110%)",
```

and the content at `:324`:

```tsx
            {revealed ? tier : "?"}
```

becomes:

```tsx
            {revealed ? tier : showGuess ? `${guess}?` : "?"}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/TierCard.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Verify nothing else broke**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS. `TierCard` is used by the big screen too (`PlayerCell`, `LiveTierList`, `BigScreenEndReveal`); none pass `guess`, so they keep today's behaviour exactly.

- [ ] **Step 7: Commit**

```bash
git add src/components/TierCard.tsx src/components/TierCard.test.tsx
git commit -m "Add an optional private guess to TierCard

The banner already renders {revealed ? tier : '?'} and slides in on
reveal, so a guess is one more branch: 'S?' at 55% alpha, sliding up
early. Callers that don't pass a guess are unaffected."
```

---

### Task 3: Remove drag-to-reorder from the hand

Pure deletion. No behaviour is added here — the hand simply stops being reorderable, which is the state Task 5 builds on.

**Files:**
- Modify: `src/components/phone/PhoneCardPlay.tsx` (imports `:1-19`, order state `:79-110`, sensors `:111-117`, modifier `:119-138`, drag handler `:140-149`, wrapper `:248-301`, card component `:399-487`)

**Interfaces:**
- Consumes: nothing.
- Produces: the component `SortableCard` is renamed `HandCardView` and its prop `isPlayable: boolean` is renamed `isSelectable: boolean`. Task 4 changes when `isSelectable` is true; Task 5 adds a `guess` prop to it. The name `HandCard` is already taken by the domain type imported from `../../game/types` — do not reuse it.

- [ ] **Step 1: Strip the dnd-kit imports**

In `src/components/phone/PhoneCardPlay.tsx`, delete these three import blocks entirely (`:3-19`):

```tsx
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

Leave every other import alone for now; Step 6 cleans up whatever became unused.

- [ ] **Step 2: Delete the local order state and the derived hand**

Delete the whole block from the `// Local-only hand order.` comment through the end of the `orderedHand` memo (`:79-110`) — that is the `orderedIds` `useState`, the reconciliation `useEffect`, and the `orderedHand` `useMemo`.

- [ ] **Step 3: Delete the sensors, the modifier, and the drag handler**

Delete the `// Sensor split:` comment and the `sensors` definition (`:111-117`), the `// Without this, dnd-kit visualises…` comment and the whole `clampDragToCarousel` modifier (`:119-138`), and the entire `handleDragEnd` function (`:140-149`).

- [ ] **Step 4: Unwrap the carousel**

Delete the `<DndContext …>` opening tag and its props (`:248-259`) and the `<SortableContext …>` opening tag (`:260`), plus the matching `</SortableContext>` and `</DndContext>` closing tags (`:300-301`). The carousel `<Box>` stays exactly as it is.

Change the map to iterate the hand directly — replace `{orderedHand.map((card) => (` with:

```tsx
            {myHand.map((card) => (
```

and rename the element from `<SortableCard` to `<HandCardView`.

Replace the comment above the carousel (`:244-247`) with:

```tsx
      {/* Hand — full-width horizontal scroll-snap. NOT constrained by the
          Container above, so neighbours peek properly on the desktop mock
          (where the Container caps at ~444 px). Tap a card to select it. */}
```

- [ ] **Step 5: Turn the sortable card into a plain card**

Rename the section comment at `:399` from `// ─── Sortable hand card ───…` to `// ─── Hand card ───…`.

Rename the interface `SortableCardProps` to `HandCardViewProps` and rename its `isPlayable: boolean;` member to `isSelectable: boolean;`.

Rename the function `SortableCard` to `HandCardView` and rename `isPlayable` to `isSelectable` in its destructured parameters.

Delete the whole `useSortable({ … })` call and its destructuring (`:423-434`).

Replace the `draggableStyle` object (`:436-446`) with:

```tsx
  const cardStyle = {
    opacity: card.played ? 0.25 : 1,
    filter: isSelected ? `drop-shadow(0 8px 18px ${myColor})` : 'none',
    transitionProperty: 'filter, opacity, translate, scale',
    transitionDuration: '200ms',
  } as const;
```

In the returned `<Box>`, delete `ref={setNodeRef}`, `{...attributes}` and `{...listeners}`. Simplify the click handler from the `isDragging` guard to just:

```tsx
      onClick={onTap}
```

In the `sx`, change `cursor: isPlayable ? 'pointer' : 'default',` to `cursor: isSelectable ? 'pointer' : 'default',`, delete the `touchAction: 'pan-x',` line and its three-line comment, change the selected transform from `...(isSelected && !isDragging ? …)` to:

```tsx
        ...(isSelected ? { translate: '0 -8px', scale: '1.03' } : {}),
```

and change `...draggableStyle,` to `...cardStyle,`.

With the drag gone there is nothing competing for the gesture, so the carousel uses the browser's default panning. Keep `userSelect`, `WebkitUserSelect` and `WebkitTouchCallout`.

- [ ] **Step 6: Clean up newly-unused imports**

`useMemo` and `useEffect` may no longer be used in this file. Check every remaining usage before removing either from the `react` import — other code in the file may still need them. Let `npm run lint` be the arbiter.

- [ ] **Step 7: Drop the dnd-kit dependencies**

`PhoneCardPlay.tsx` was the only consumer in the whole tree — verified at plan time with `grep -rn "@dnd-kit" src/`, which returns nothing else. With Steps 1–5 done, all three packages are dead weight in the bundle.

First re-confirm, because the tree may have moved since:

```bash
grep -rn "@dnd-kit" src/
```

Expected: no matches. **If anything matches, stop and report** — do not remove a dependency something still imports.

Then:

```bash
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Commit the resulting `package.json` and `package-lock.json` alongside the source change.

- [ ] **Step 8: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS, no unused-import errors, no TypeScript errors. The build should also show a smaller bundle now the dnd-kit packages are gone.

- [ ] **Step 9: Commit**

```bash
git add src/components/phone/PhoneCardPlay.tsx package.json package-lock.json
git commit -m "Remove drag-to-reorder from the hand

The reorder drag and the carousel scroll shared an axis: touch-action
pan-x handed horizontal panning to the browser while the TouchSensor
waited out a 500ms/10px long-press, and once iOS commits to a pan,
preventDefault can't reclaim it. Unwinnable by tuning.

Reordering was a memory aid for guessing hidden tiers; a per-card
guess replaces it in the next commit.

PhoneCardPlay was dnd-kit's only consumer, so drop the three packages."
```

---

### Task 4: Allow selecting a card when it isn't your turn

**Files:**
- Modify: `src/components/phone/PhoneCardPlay.tsx` (card props around `:283-292`, card element around `:448-470`)
- Test: `src/components/phone/PhoneCardPlay.test.tsx` (create)

**Interfaces:**
- Consumes: `HandCardView` and its `isSelectable` prop from Task 3.
- Produces: the card `<Box>` gains `role="button"` and `aria-pressed={isSelected}`, which is how selection becomes observable to tests and to screen readers. Task 5's tests rely on it.

- [ ] **Step 1: Write the failing test**

Create `src/components/phone/PhoneCardPlay.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createInitialGameState,
  submitCategory,
  startTierWriting,
  submitTierList,
  dealHands,
  startCardPlay,
} from '../../game/lifecycle';
import type { GameState, TierList } from '../../game/types';
import type { PlayerMeta } from '../big-screen/playerMeta';
import PhoneCardPlay from './PhoneCardPlay';

// PhoneCardPlay imports writeGameState, which imports ../firebase, which calls
// initializeApp at module load and throws without env vars.
vi.mock('../../hooks/useGameState', () => ({ writeGameState: vi.fn() }));

const SEATING = [1, 2, 3, 4];
const NAMES: Record<number, string> = { 1: 'Alice', 2: 'Bob', 3: 'Carol', 4: 'Dan' };
const HEX: Record<number, string> = { 1: '#e5484d', 2: '#00b4d8', 3: '#ffce1c', 4: '#d6409f' };
const META: Record<number, PlayerMeta> = Object.fromEntries(
  SEATING.map((id) => [id, { id, name: NAMES[id], color: 'red', colorHex: HEX[id] }]),
) as Record<number, PlayerMeta>;

const listFor = (pid: number): TierList => ({
  S: `${pid}-S`, A: `${pid}-A`, B: `${pid}-B`,
  C: `${pid}-C`, D: `${pid}-D`, F: `${pid}-F`,
});

// `firstPlayerId: 2` means it is Bob's turn, NOT Alice's — Alice (myId 1) is
// the player we render, so every test below runs in the off-turn state.
function cardPlayState(firstPlayerId = 2): GameState {
  let s = createInitialGameState(SEATING, firstPlayerId);
  for (const pid of SEATING) s = submitCategory(s, pid, { name: `cat-${pid}`, emoji: '🐾' });
  s = startTierWriting(s);
  for (const pid of SEATING) s = submitTierList(s, pid, listFor(pid));
  s = dealHands(s, (a) => [...a]);
  return startCardPlay(s);
}

function renderHand(state: GameState) {
  return render(<PhoneCardPlay roomId="R" gameState={state} myId={1} meta={META} />);
}

describe('PhoneCardPlay selection', () => {
  it('lets you select a card when it is not your turn', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    const cards = screen.getAllByRole('button', { pressed: false });
    expect(cards.length).toBeGreaterThan(0);

    await user.click(cards[0]);
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('still refuses to play when it is not your turn, even with a card selected', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);

    // The primary CTA reads "Waiting" off-turn and must stay disabled.
    expect(screen.getByRole('button', { name: /waiting/i })).toBeDisabled();
  });

  it('deselects when you tap the same card again', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    const card = screen.getAllByRole('button', { pressed: false })[0];
    await user.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    await user.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/phone/PhoneCardPlay.test.tsx`
Expected: FAIL — the cards have no `role="button"` / `aria-pressed`, so `getAllByRole('button', { pressed: false })` finds nothing, and selection is gated on `isMyTurn` so the click would not select anyway.

- [ ] **Step 3: Ungate selection**

In `src/components/phone/PhoneCardPlay.tsx`, in the props passed to `<HandCardView>` (around `:285-292`), replace:

```tsx
                isPlayable={
                  !card.played && isMyTurn && !trickComplete && !iAlreadyPlayedThisTrick
                }
                onTap={() => {
                  if (!card.played && isMyTurn && !trickComplete && !iAlreadyPlayedThisTrick) {
                    setSelectedCardId((id) => (id === card.id ? null : card.id));
                  }
                }}
```

with:

```tsx
                // Selection is NOT turn-gated: guessing a card's tier is most
                // useful while you wait for other players. Only the play
                // action is gated, via `canPlay`.
                isSelectable={!card.played}
                onTap={() => {
                  if (card.played) return;
                  setSelectedCardId((id) => (id === card.id ? null : card.id));
                }}
```

- [ ] **Step 4: Make selection observable**

In `HandCardView`'s returned `<Box>`, add these three props immediately after `onClick={onTap}`:

```tsx
      role="button"
      aria-pressed={isSelected}
      aria-disabled={!isSelectable}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/phone/PhoneCardPlay.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Prove the first test guards the real behaviour**

Temporarily restore the `isMyTurn` condition inside `onTap`, re-run the file, and confirm the first and third tests FAIL. Then restore the fix and confirm they pass. Report both outputs. A regression guard you have not watched fail is not yet a regression guard.

- [ ] **Step 7: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/phone/PhoneCardPlay.tsx src/components/phone/PhoneCardPlay.test.tsx
git commit -m "Let players select a card off-turn

Guessing a card's tier is most useful while waiting for other players,
so selection can't be gated on isMyTurn. Only the play action stays
gated, via canPlay, which is unchanged.

Cards gain role=button and aria-pressed, which makes selection
observable to tests and to screen readers."
```

---

### Task 5: Add the tier guess

**Files:**
- Modify: `src/components/phone/PhoneCardPlay.tsx` (state near `:72`, card props near `:283`, CTA `:307-347`, `HandCardViewProps`)
- Modify: `src/components/phone/PhoneCardPlay.test.tsx` (append)

**Interfaces:**
- Consumes: `TierCard`'s `guess?: Tier` prop (Task 2); `HandCardView` / `isSelectable` (Task 3); `role="button"` + `aria-pressed` (Task 4).
- Produces: nothing consumed downstream.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/phone/PhoneCardPlay.test.tsx`:

```tsx
describe('PhoneCardPlay tier guesses', () => {
  it('cannot guess until a card is selected', () => {
    renderHand(cardPlayState());
    expect(screen.getByRole('button', { name: /guess tier/i })).toBeDisabled();
  });

  it('records a guess and shows it on the card with a "?" suffix', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: 'A' }));

    expect(screen.getByText('A?')).toBeInTheDocument();
  });

  it('clears a guess', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByText('A?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByText('A?')).not.toBeInTheDocument();
  });

  it('drops a guess when its card leaves the hand', async () => {
    const user = userEvent.setup();
    const { rerender } = renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByText('A?')).toBeInTheDocument();

    // A fresh deal produces new card ids, so every existing guess is stale.
    rerender(<PhoneCardPlay roomId="R" gameState={cardPlayState()} myId={1} meta={META} />);
    expect(screen.queryByText('A?')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/phone/PhoneCardPlay.test.tsx`
Expected: the four new tests FAIL — there is no "Guess tier" button.

- [ ] **Step 3: Add the guess state**

In `src/components/phone/PhoneCardPlay.tsx`, add `Tier` to the domain type import:

```tsx
import type { GameState, HandCard, Tier } from '../../game/types';
```

Then, directly after the `submitting` state (around `:73`), add:

```tsx
  // The holder's private guesses at their own cards' hidden tiers, keyed by
  // cardId. Local only — never written to Firebase, never shown on the big
  // screen, and gone on refresh. It replaces drag-to-reorder as the memory
  // aid for tracking what you think each card is.
  const [guesses, setGuesses] = useState<Record<string, Tier>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  // Drop guesses whose card is no longer in hand (a new round deals new ids).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuesses((prev) => {
      const handIds = new Set(myHand.map((c) => c.id));
      const kept = Object.entries(prev).filter(([id]) => handIds.has(id));
      return kept.length === Object.keys(prev).length
        ? prev
        : (Object.fromEntries(kept) as Record<string, Tier>);
    });
  }, [myHand]);
```

If Task 3 removed `useEffect` from the react import, add it back.

- [ ] **Step 4: Close the picker when the selection changes**

Immediately after the block from Step 3, add:

```tsx
  // A picker left open across a selection change would apply to the wrong card.
  useEffect(() => {
    setPickerOpen(false);
  }, [selectedCardId]);
```

- [ ] **Step 5: Pass the guess down to the card**

In the `<HandCardView>` props (around `:285`), add:

```tsx
                guess={guesses[card.id]}
```

In `HandCardViewProps`, add the member:

```tsx
  guess?: Tier;
```

Add `guess,` to `HandCardView`'s destructured parameters, and pass it through to `<TierCard>` by adding this line next to `revealed={false}`:

```tsx
        guess={guess}
```

`TierCard` already ignores `guess` when `revealed` is true, and the hand always passes `revealed={false}`.

- [ ] **Step 6: Add the chip colours**

`TIER_COLORS` in `src/components/TierCard.tsx` is module-private and must stay that way — exporting it to share with one consumer couples the card's palette to the hand. Add a local constant near `CARD_WIDTH` (around `:42`) in `PhoneCardPlay.tsx`:

```tsx
// Mirrors TIER_COLORS in TierCard.tsx. Duplicated rather than exported: these
// are picker chips, not cards, and a shared export would make the card's
// palette a public API for one caller.
const TIER_CHIP_COLORS: Record<Tier, string> = {
  S: '#ef3a3a',
  A: '#ff8c1c',
  B: '#ffce1c',
  C: '#3aaf4d',
  D: '#3a7aef',
  F: '#9a3aef',
};
```

- [ ] **Step 7: Build the two-button row and the inline picker**

Replace the entire CTA `<Container>` block (`:307-347`) with:

```tsx
      <Container maxWidth="xs" sx={{ pb: 2, mt: 'auto' }}>
        <Stack spacing={1.2}>
          {/* Inline, not a modal: a dialog would cover the card whose item you
              are reading in order to decide. */}
          {pickerOpen && selectedCard && (
            <Stack spacing={0.75}>
              <Box
                sx={{
                  textAlign: 'center',
                  fontFamily: CARD_FONT,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                Your guess — only you see this
              </Box>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                {(['S', 'A', 'B', 'C', 'D', 'F'] as const).map((t) => (
                  <Box
                    key={t}
                    component="button"
                    type="button"
                    onClick={() => {
                      setGuesses((prev) => ({ ...prev, [selectedCard.id]: t }));
                      setPickerOpen(false);
                    }}
                    sx={{
                      flex: 1,
                      minHeight: 44,
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontFamily: CARD_FONT,
                      fontWeight: 900,
                      fontSize: '1rem',
                      color: '#fff',
                      bgcolor:
                        guesses[selectedCard.id] === t
                          ? TIER_CHIP_COLORS[t]
                          : 'rgba(255,255,255,0.12)',
                      outline:
                        guesses[selectedCard.id] === t
                          ? '2px solid rgba(255,255,255,0.9)'
                          : 'none',
                    }}
                  >
                    {t}
                  </Box>
                ))}
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => {
                  setGuesses((prev) => {
                    const next = { ...prev };
                    delete next[selectedCard.id];
                    return next;
                  });
                  setPickerOpen(false);
                }}
                sx={{
                  alignSelf: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: CARD_FONT,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  py: 0.5,
                }}
              >
                Clear
              </Box>
            </Stack>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Fixed positions, never swapping roles: playing a card is
                irreversible, so the slot under your thumb must not change
                meaning between turns. */}
            <Box sx={{ flex: 1 }}>
              <ShinyButton
                accent={myColor}
                variant="secondary"
                fullWidth
                disabled={!selectedCard}
                onClick={() => setPickerOpen((o) => !o)}
              >
                <Box
                  sx={{
                    fontFamily: CARD_FONT,
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Guess tier
                </Box>
              </ShinyButton>
            </Box>

            <Box sx={{ flex: 1 }}>
              {trickResolved ? (
                <ShinyButton
                  accent={myColor}
                  variant="primary"
                  fullWidth
                  disabled={dismissRequested}
                  onClick={() => void handleDismiss()}
                >
                  <Box
                    sx={{
                      fontFamily: CARD_FONT,
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {dismissRequested ? 'Continuing…' : 'Continue'}
                  </Box>
                </ShinyButton>
              ) : (
                <ShinyButton
                  accent={myColor}
                  variant="primary"
                  fullWidth
                  disabled={!canPlay}
                  onClick={() => void handlePlay()}
                >
                  <Box
                    sx={{
                      fontFamily: CARD_FONT,
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedCard ? 'Play' : isMyTurn ? 'Pick a card' : 'Waiting'}
                  </Box>
                </ShinyButton>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
```

The primary button keeps its exact existing labels, gating and handlers — only its width and font size change to share the row.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/components/phone/PhoneCardPlay.test.tsx`
Expected: PASS, 7 tests (3 from Task 4, 4 new).

- [ ] **Step 9: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 10: Verify manually — REQUIRED, do not skip or fake**

If you cannot drive a real browser, mark this NOT PERFORMED and say so plainly.

`npm run dev`, then `/mock/phone` → `Card-play · 2/4 played`, seat 1:
1. Tap a card while it is not your turn — it should lift and the Guess tier button should enable.
2. Tap Guess tier, pick `A` — the card's bottom banner should slide up showing `A?` in a muted orange.
3. Tap Guess tier again, tap Clear — the banner should slide back down.
4. Swipe the carousel sideways — it should scroll cleanly, with no long-press delay or stutter.
5. Check the picker row at 375px: six chips plus Clear should not overflow. If they do, move Clear beneath the row rather than shrinking the chips below 44px.

- [ ] **Step 11: Commit**

```bash
git add src/components/phone/PhoneCardPlay.tsx src/components/phone/PhoneCardPlay.test.tsx
git commit -m "Add private per-card tier guesses

Replaces drag-to-reorder as the hand's memory aid. Position was a weak
encoding — 'this card is third' doesn't say third-what — and it forced
a horizontal drag inside a horizontal scroller.

Guesses are local scratch state: never written to Firebase, never on
the big screen, dropped when the card leaves the hand. Rendered as
'S?' in the tier banner at reduced alpha so a guess never reads as
fact.

The CTA becomes two fixed-position buttons. Guess tier is enabled
whenever a card is selected, including off-turn, which is when
guessing is most useful."
```

---

## Self-Review

**Spec coverage.** Part 1 of the spec → Task 1 (all five changes: overflow, `svh`, mock sync, `viewport-fit`, safe-area padding). Part 2 change 1 (`TierCard`) → Task 2. Change 2's drag removal → Task 3; its selection ungating → Task 4; its guess state and two-button row → Task 5. Change 3 (inline picker) → Task 5 Steps 6–7. The spec's "explicitly unchanged" list is honoured: no task touches `src/game/*`, the big screen, or the two-step play flow.

The spec listed four component tests; the plan has seven, because Task 4's ungating needed its own guard and deselection was worth pinning. The spec's test 4 ("a guess does not survive the card leaving the hand") is implemented as the fresh-deal rerender, which is the reachable version of that scenario — you cannot set a guess on an already-played card through the UI.

**Placeholder scan.** No TBD/TODO, no "similar to Task N", no "handle edge cases". Every code step carries literal before-and-after text.

**Type consistency.** `SortableCard`→`HandCardView` and `isPlayable`→`isSelectable` are renamed once in Task 3 and used under the new names in Tasks 4 and 5. `guess?: Tier` has the same type on `TierCardProps` (Task 2) and `HandCardViewProps` (Task 5). `HandCardView` deliberately avoids `HandCard`, which is the domain type from `../../game/types`. `TIER_CHIP_COLORS` is defined in Task 5 Step 6 and consumed in Step 7, so an implementer working in order never reads a reference before its definition.

**Known risk.** Task 4's tests select cards via `getAllByRole('button', { pressed: false })`, which will also match any other `aria-pressed="false"` button in the tree. Today there is none — the CTA buttons have no `aria-pressed` — but if that changes, these selectors get brittle. Acceptable now; noted so a future reader knows why they broke.

**Line numbers.** Every reference was read from the working tree at plan time. Tasks 3, 4 and 5 all edit `PhoneCardPlay.tsx` in sequence, so line numbers shift as they land. Locate each edit by matching the quoted text, not by trusting the number.
