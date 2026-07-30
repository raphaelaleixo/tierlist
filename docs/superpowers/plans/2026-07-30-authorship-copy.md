# Authorship Copy Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it unambiguous on every screen that a tier list is its author's own favourites, and fix the bug that names the wrong player as the one who will play it.

**Architecture:** Three independent changes to presentation only. Task 1 fixes a wrong helper call in `PhoneTierWriting` (pinned by a new game-suite test). Task 2 rewrites the two phone authoring screens to use the possessive vocabulary the play screens already use, and reorders the tier-writing header so it stops leading with who plays the list. Task 3 corrects `HowToPlayPage` and `projectInfo/rules.md`, which currently state the opposite game.

**Tech Stack:** Vite + React 19 + TypeScript (strict), MUI (`sx` styling), Vitest, ESLint.

**Spec:** `docs/superpowers/specs/2026-07-30-authorship-copy-design.md`

## Global Constraints

- **The game model is "own taste".** Every player ranks *their own* favourites in a category a neighbour handed them. No player ever guesses another player's preferences. All copy must be consistent with this.
- **Possessive framing, not directional.** Say "Dan's favourites" / "ranked by Dan", never "for Dan to tier" — directional phrasing reads as "about Dan" and is the defect being fixed.
- **Use they/them** for any other player in copy. Player pronouns are unknown; never infer from a name.
- **No new screens and no new pre-round explainer.** Existing screens only.
- **Do not modify `src/game/lifecycle.ts` or `src/game/rules.ts`.** The helpers are correct; only a component's use of them is wrong.
- **Do not write tests that assert on display strings.** Copy is still being tuned. The one new test in Task 1 asserts a deal invariant, not rendering.
- **Existing suites must stay green:** `rules.test.ts`, `lifecycle.test.ts`, `deserialize.test.ts`.
- Verification commands: `npm test`, `npm run lint`, `npm run build`.
- Mock roster for visual checks: seating `[1,2,3,4]` = Alice(red) / Bob(cyan) / Carol(yellow) / Dan(magenta), round 1 passes **left**. For Alice: she picks a category for **Dan**, writes in **Bob's** category, and **Bob** plays her list.

---

## File Structure

| File | Change | Responsibility after the change |
|---|---|---|
| `src/game/lifecycle.test.ts` | Modify (append one `describe`) | Pins the deal invariant that `assignerOf(me)` plays my list |
| `src/components/phone/PhoneTierWriting.tsx` | Modify | Tier-writing entry + locked views; owns the "your list" framing |
| `src/components/phone/PhoneCategoryPick.tsx` | Modify | Category-pick entry + locked views; owns the "their favourites" framing |
| `src/pages/MockPlayerPhone.tsx` | Modify (add one fixture) | Dev-only fixtures; gains a tier-writing-locked state so the recap copy is reachable |
| `src/pages/HowToPlayPage.tsx` | Modify | Public rules page; must state the own-taste model |
| `projectInfo/rules.md` | Modify | Design source of truth; must not contradict itself |

---

### Task 1: Fix the wrong "who plays your list" player

`PhoneTierWriting.tsx:59` computes `willPlayId` as `writerOf(seating, myId, passDirection)`. That helper returns the neighbour who authored *your hand*. The player who plays *your list* is `assignerOf(seating, myId, passDirection)` — already computed on line 55 as `assignerId`. The two values are never equal for 3+ players, so the screen names the wrong person.

**Files:**
- Test: `src/game/lifecycle.test.ts` (append at end of file)
- Modify: `src/components/phone/PhoneTierWriting.tsx:54-62`

**Interfaces:**
- Consumes: `createInitialGameState`, `submitCategory`, `startTierWriting`, `submitTierList`, `dealHands`, `writerOf`, `assignerOf` from `./lifecycle`; `TierList` from `./types`. All already exported.
- Produces: nothing new. Task 2 relies on the local `assignerId` variable and on `willPlayName` / `willPlayColor` keeping their current names and types (`string`).

- [ ] **Step 1: Write the failing test**

Append to `src/game/lifecycle.test.ts`:

```ts
describe('deal authorship invariant', () => {
  // A player's own tier list is played by the neighbour who ASSIGNED them
  // their category (assignerOf), not by the neighbour who writes their hand
  // (writerOf). PhoneTierWriting used to show the latter.
  const tagged = (tag: string): TierList => ({
    S: `${tag}-S`, A: `${tag}-A`, B: `${tag}-B`,
    C: `${tag}-C`, D: `${tag}-D`, F: `${tag}-F`,
  });

  function dealtWithTaggedLists(seating: number[], round: 1 | 2) {
    let s = createInitialGameState(seating, seating[0]);
    if (round === 2) {
      // startRound2 needs a resolved round 1; build round 2 directly instead
      // by flipping the pass direction on the fresh round.
      s = { ...s, rounds: [{ ...s.rounds[0], passDirection: 'right' }] };
    }
    for (const pid of seating) {
      s = submitCategory(s, pid, { name: `cat-${pid}`, emoji: '🐾' });
    }
    s = startTierWriting(s);
    for (const pid of seating) s = submitTierList(s, pid, tagged(String(pid)));
    return dealHands(s, (a) => [...a]);
  }

  it.each([
    { round: 1 as const, direction: 'left' as const },
    { round: 2 as const, direction: 'right' as const },
  ])('round $round: my list is dealt to assignerOf(me)', ({ round, direction }) => {
    const seating = [1, 2, 3];
    const dealt = dealtWithTaggedLists(seating, round).rounds[0];

    for (const author of seating) {
      const holder = seating.find((pid) =>
        dealt.perPlayer[pid].hand!.every((c) => c.item.startsWith(`${author}-`)),
      );
      expect(holder).toBe(assignerOf(seating, author, direction));
      expect(holder).not.toBe(writerOf(seating, author, direction));
    }
  });

  it('holds for a 6-player table', () => {
    const seating = [1, 2, 3, 4, 5, 6];
    const dealt = dealtWithTaggedLists(seating, 1).rounds[0];

    for (const author of seating) {
      const holder = seating.find((pid) =>
        dealt.perPlayer[pid].hand!.every((c) => c.item.startsWith(`${author}-`)),
      );
      expect(holder).toBe(assignerOf(seating, author, 'left'));
    }
  });
});
```

Make sure `assignerOf`, `writerOf`, `submitTierList`, `dealHands` and the `TierList` type are in the file's existing import lists — add any that are missing.

- [ ] **Step 2: Run the test to confirm it passes against the helpers**

Run: `npx vitest run src/game/lifecycle.test.ts -t "deal authorship invariant"`
Expected: PASS. This test documents correct helper behaviour; the bug is in the component, so this is a regression guard, not a red test. If it FAILS, stop — the defect is deeper than the spec assumes and needs re-triage.

- [ ] **Step 3: Fix the component**

In `src/components/phone/PhoneTierWriting.tsx`, replace lines 54-62:

```tsx
  // The neighbour who PICKED a category for me — I'm tiering in their category.
  const assignerId = assignerOf(gameState.seating, myId, round.passDirection);
  const myCategory = round.perPlayer[assignerId]?.categoryAssigned ?? null;
  // The neighbour who'll PLAY my tier list (the same player who'll receive
  // my hand at deal time).
  const willPlayId = writerOf(gameState.seating, myId, round.passDirection);
  const willPlay = meta[willPlayId];
  const willPlayName = willPlay?.name ?? `Player ${willPlayId}`;
  const willPlayColor = willPlay?.colorHex ?? '#888';
```

with:

```tsx
  // The neighbour who PICKED a category for me. I write in their category —
  // and they are also the player who PLAYS the list I write, because the deal
  // hands each list back to whoever assigned it (see the deal authorship
  // invariant in lifecycle.test.ts). Not writerOf(me): that's the neighbour
  // who authors MY hand, which is the other end of the loop.
  const assignerId = assignerOf(gameState.seating, myId, round.passDirection);
  const myCategory = round.perPlayer[assignerId]?.categoryAssigned ?? null;
  const willPlay = meta[assignerId];
  const willPlayName = willPlay?.name ?? `Player ${assignerId}`;
  const willPlayColor = willPlay?.colorHex ?? '#888';
```

- [ ] **Step 4: Drop the now-unused import**

`writerOf` is no longer referenced in this file. Change line 5 from:

```tsx
import { assignerOf, writerOf, submitTierList } from '../../game/lifecycle';
```

to:

```tsx
import { assignerOf, submitTierList } from '../../game/lifecycle';
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all tests PASS, no lint errors (in particular no unused-import error for `writerOf`), build succeeds.

- [ ] **Step 6: Verify visually**

Run `npm run dev`, open `/mock/phone`, select fixture `Tier-writing · fresh`, seat **1** (Alice).
Expected: the subline reads "for **Bob** to play." (cyan chip). Before this fix it read "for **Dan** to play."

- [ ] **Step 7: Commit**

```bash
git add src/game/lifecycle.test.ts src/components/phone/PhoneTierWriting.tsx
git commit -m "Fix wrong player named as the one who plays your tier list

PhoneTierWriting used writerOf(me) — the neighbour who authors MY hand
— where it needed assignerOf(me), the neighbour whose category I write
in and who plays the list back. The screen named a player unrelated to
the list being written, which is a large part of the reported
whose-taste-is-this confusion.

Pin the deal invariant in lifecycle.test.ts for 3- and 6-player tables,
both pass directions."
```

---

### Task 2: Rewrite the two phone authoring screens

**Files:**
- Modify: `src/components/phone/PhoneTierWriting.tsx` (`HeaderBlock` `:182-225`, entry submit area `:154-173`, `LockedView` `:256-325`)
- Modify: `src/components/phone/PhoneCategoryPick.tsx` (locked subline `:97`, entry subline `:203`, new helper line after the input row ending `:259`) — note both sublines are byte-identical, so an unqualified find-and-replace will hit both; that is intended here, but apply them as two separate targeted edits to avoid surprises
- Modify: `src/pages/MockPlayerPhone.tsx` (add one fixture so the locked recap view is reachable)

**Interfaces:**
- Consumes: `willPlayName` / `willPlayColor` (`string`) and `assignerId` from Task 1; `PlayerNameChip` (props `{ name: string; colorHex: string }`), `OpenMojiIcon`, `pastelOnDark(hex: string, amount: number): string`, and the module-level `CARD_FONT` constant — all already imported in both files.
- Produces: `HeaderBlock` gains a required `myColor: string` prop and a required `variant: 'entry' | 'locked'` prop. `LockedView` already receives `myColor` and passes it through.

- [ ] **Step 1: Give `HeaderBlock` the new signature and markup**

`HeaderBlock` loses `willPlayName`/`willPlayColor` — the new footnote component owns them — and gains `myColor` and `variant`. In `PhoneTierWriting.tsx`, replace the whole `HeaderBlock` function (`:182-225`) with:

```tsx
function HeaderBlock({
  category,
  myColor,
  variant,
}: {
  category: CategoryChoice | null;
  myColor: string;
  variant: 'entry' | 'locked';
}) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      {category && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <OpenMojiIcon emoji={category.emoji} variant="black" invert size="4rem" />
        </Box>
      )}
      {/* Ownership leads. "YOUR" in the player's own colour is the whole
          point of the screen: these are your favourites, not a guess at
          anyone else's. Who plays the list is demoted to a footnote near
          the submit button. */}
      <Box
        sx={{
          fontFamily: CARD_FONT,
          fontWeight: 900,
          fontSize: '2.2rem',
          lineHeight: 1,
          textTransform: 'uppercase',
          color: '#fff',
        }}
      >
        <Box component="span" sx={{ color: myColor }}>Your </Box>
        {category?.name ?? '—'}
      </Box>
      <Box
        sx={{
          mt: 1.5,
          fontFamily: CARD_FONT,
          fontWeight: 600,
          fontSize: '0.95rem',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.3,
          textTransform: 'uppercase',
        }}
      >
        {variant === 'entry'
          ? 'Rank your own favourites, S to F.'
          : 'Your favourites, locked in.'}
      </Box>
    </Box>
  );
}
```

This leaves the file temporarily broken — both call sites still pass the removed props. Steps 3 and 4 fix them; don't run the build until then.

- [ ] **Step 2: Add the footnote component**

Add immediately after `HeaderBlock` in the same file:

```tsx
// The "who plays this" line. Deliberately placed next to the submit button
// rather than in the header: read as a consequence after you understand the
// task, it's flavour; read before it, it reframes the task as "write this
// FOR them", which is the misreading we're fixing.
function PlaysThisNote({
  willPlayName,
  willPlayColor,
  variant,
}: {
  willPlayName: string;
  willPlayColor: string;
  variant: 'entry' | 'locked';
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        fontFamily: CARD_FONT,
        fontWeight: 600,
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.4,
        textTransform: 'uppercase',
      }}
    >
      {variant === 'entry' ? (
        <>
          <PlayerNameChip name={willPlayName} colorHex={willPlayColor} /> plays these
          — they won&rsquo;t know your order.
        </>
      ) : (
        <>
          Memorise it — you&rsquo;re the only one who knows this order.
        </>
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Update the entry view's call sites**

In the entry `return` (around `:112-116`), replace:

```tsx
          <HeaderBlock
            category={myCategory}
            willPlayName={willPlayName}
            willPlayColor={willPlayColor}
          />
```

with:

```tsx
          <HeaderBlock category={myCategory} myColor={myColor} variant="entry" />
```

Then insert the footnote directly above the Lock-in button (before the `{/* Lock-in button */}` comment at `:154`):

```tsx
          <PlaysThisNote
            willPlayName={willPlayName}
            willPlayColor={willPlayColor}
            variant="entry"
          />
```

- [ ] **Step 4: Update the locked view**

In `LockedView` (`:256-325`), the header is currently inlined rather than using `HeaderBlock`. Replace the whole inlined header `<Box sx={{ textAlign: 'center' }}>…</Box>` block (`:282-325`) with the "Locked in" eyebrow plus a `HeaderBlock` call:

```tsx
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '0.85rem',
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: myColor,
                mb: 1.5,
              }}
            >
              Locked in
            </Box>
          </Box>
          <HeaderBlock category={category} myColor={myColor} variant="locked" />
```

Then, immediately before the existing "Waiting for the others…" Box (`:355`), add:

```tsx
          <PlaysThisNote
            willPlayName={willPlayName}
            willPlayColor={willPlayColor}
            variant="locked"
          />
```

`LockedView` already destructures `willPlayName`, `willPlayColor`, `category` and `myColor`, so no prop-signature change is needed.

- [ ] **Step 5: Rewrite the category-pick sublines**

In `PhoneCategoryPick.tsx`, at **both** `:97` (locked view) and `:203` (entry view), replace:

```tsx
                for <PlayerNameChip name={recipientName} colorHex={recipientColor} /> to tier.
```

with:

```tsx
                for <PlayerNameChip name={recipientName} colorHex={recipientColor} />&rsquo;s favourites.
```

- [ ] **Step 6: Add the helper line to the category-pick entry view**

In `PhoneCategoryPick.tsx`, insert directly after the text-input `</Box>` that closes the input row (the one ending at `:259`, immediately before the `<Popover`):

```tsx
          {/* Carries three facts in one line: the category is for THEIR own
              favourites (not a guess at yours), you'll be the one playing
              their list, and therefore the pick is strategic — you want a
              category you can read them in. */}
          <Box
            sx={{
              mt: -1.5,
              textAlign: 'center',
              fontFamily: CARD_FONT,
              fontWeight: 600,
              fontSize: '0.8rem',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            They&rsquo;ll rank their own — and you play their list, so pick
            something you can read them on.
          </Box>
```

- [ ] **Step 7: Add the missing mock fixture**

The recap copy from Step 4 is unreachable in the mocks today — no fixture has the viewed seat submitting a tier list. In `src/pages/MockPlayerPhone.tsx`, add `'tier-writing-locked'` to the `FixtureKey` union (after `'tier-writing-fresh'` on `:101`):

```ts
  | 'tier-writing-locked'
```

and add this entry to `FIXTURES` directly after the `'tier-writing-fresh'` entry (`:126`):

```ts
  'tier-writing-locked': {
    label: 'Tier-writing · locked',
    build: () => {
      let s = createInitialGameState(SEATING, 1);
      s = submitCategory(s, 1, { name: 'Animals', emoji: '🐾' });
      s = submitCategory(s, 2, { name: 'TV shows', emoji: '📺' });
      s = submitCategory(s, 3, { name: '90s movies', emoji: '📼' });
      s = submitCategory(s, 4, { name: 'Snacks', emoji: '🍿' });
      s = startTierWriting(s);
      // Only seat 1 has submitted, so seat 1 shows the locked recap while
      // seats 2-4 still show the entry form.
      return submitTierList(s, 1, {
        S: 'Friends', A: 'The Wire', B: 'Lost',
        C: 'Heroes', D: 'Glee', F: 'Riverdale',
      });
    },
  },
```

`submitTierList` is already imported in this file.

- [ ] **Step 8: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS. Watch specifically for a TypeScript error on any `HeaderBlock` call site still passing `willPlayName` / `willPlayColor` — the prop signature changed in Step 1.

- [ ] **Step 9: Verify visually**

Run `npm run dev` and check each, at `/mock/phone`:

| Fixture | Seat | Expected |
|---|---|---|
| `Cat-pick · 2 in` | 3 (Carol) | Subline "for **Bob**'s favourites."; helper line below the input |
| `Cat-pick · 2 in` | 1 (Alice) | Locked view subline "for **Dan**'s favourites." |
| `Tier-writing · fresh` | 1 (Alice) | Header "**YOUR** TV SHOWS" ("YOUR" in red); subline "Rank your own favourites, S to F."; footnote above the button naming **Bob** |
| `Tier-writing · locked` | 1 (Alice) | "Locked in" eyebrow, same header, "Memorise it…" note above "Waiting for the others…" |

Confirm no horizontal overflow and no text clipping on a narrow viewport (375px wide).

- [ ] **Step 10: Commit**

```bash
git add src/components/phone/PhoneTierWriting.tsx src/components/phone/PhoneCategoryPick.tsx src/pages/MockPlayerPhone.tsx
git commit -m "Reframe phone authoring screens around list ownership

The tier-writing header led with who would play the list, which reads
as 'write this for them'. Ownership now leads ('YOUR Animals', in the
player's colour) and who-plays-it is demoted to a footnote by the
submit button. Category pick goes possessive and gains a line covering
both the model and why the pick is strategic.

Add a tier-writing-locked mock fixture; the recap view had no reachable
mock state."
```

---

### Task 3: Correct the rules page and the design doc

**Files:**
- Modify: `src/pages/HowToPlayPage.tsx` (`:13`, `:15`, `:43`, `:47-48`, `:70-71`, `:76-77`, `:82`, `:90`)
- Modify: `projectInfo/rules.md` (`:7` area, `:20`, `:108`)

**Interfaces:**
- Consumes: nothing from Tasks 1-2. This task is independent and could run first; it is ordered last only because the phone screens are what players actually read during a game.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Fix the hero copy**

In `src/pages/HowToPlayPage.tsx`, change the `h1` at `:43` from:

```tsx
              Rate your friends&rsquo; taste
```

to:

```tsx
              Your taste, in someone else&rsquo;s hands
```

Then change the lead paragraph at `:46-50` from:

```tsx
              Tierlist is a trick-taking party game hiding inside a tier list — a web take on{' '}
              <em>My Favourite Things</em> by Nilgiri (Archie Edwards). You secretly rank a
              neighbour&rsquo;s favourites from S to F; they play the hand without knowing the ranks
              you gave. Play the lowest tier to win a trick — but the F-tier you hate beats the
              S-tier you love. Most hearts after two rounds wins.
```

to:

```tsx
              Tierlist is a trick-taking party game hiding inside a tier list — a web take on{' '}
              <em>My Favourite Things</em> by Nilgiri (Archie Edwards). You secretly rank{' '}
              <b>your own</b> favourites from S to F — then a neighbour plays them without
              knowing the order you gave. Play the lowest tier to win a trick — but the F-tier
              you hate beats the S-tier you love. Most hearts after two rounds wins.
```

- [ ] **Step 2: Fix the three-phase intro**

Change `:70-71` from:

```tsx
              Each round runs through the same three phases. You&rsquo;ll pick a category for one
              neighbour, secretly tier a list for another, then play out five tricks.
```

to:

```tsx
              Each round runs through the same three phases. You&rsquo;ll pick a category for one
              neighbour, secretly rank your own favourites in a category someone handed you,
              then play out five tricks.
```

- [ ] **Step 3: Fix phase 1**

Change `:76-77` from:

```tsx
              in round 1, your <b>right</b> in round 2. They&rsquo;ll write the tier list, but{' '}
              <b>you&rsquo;ll be the one who plays it</b> later. Stuck for an idea? Tap one of three
```

to:

```tsx
              in round 1, your <b>right</b> in round 2. They&rsquo;ll rank <b>their own</b>{' '}
              favourites in it — and <b>you&rsquo;ll be the one who plays that list</b> later.
              Stuck for an idea? Tap one of three
```

- [ ] **Step 4: Fix phase 2**

Change `:82-83` from:

```tsx
              Now fill in the category a neighbour gave <em>you</em>: six items, one for each tier from{' '}
              <b>S (favourite)</b> to <b>F (hate)</b>. When you submit, you get about eight seconds to
```

to:

```tsx
              Now fill in the category a neighbour gave <em>you</em>: <b>your</b> six items —
              your actual favourites, your actual ranking — one for each tier from{' '}
              <b>S (favourite)</b> to <b>F (hate)</b>. When you submit, you get about eight seconds to
```

- [ ] **Step 5: Fix phase 3**

Change `:90` from:

```tsx
              You&rsquo;re now holding six cards a neighbour wrote for you. You can see the items but{' '}
```

to:

```tsx
              You&rsquo;re now holding six cards a neighbour wrote — <b>their</b> favourites, not
              yours. You can see the items but{' '}
```

- [ ] **Step 6: Fix the glossary**

Change `:13` from:

```tsx
  ['Tier list', 'The six-card ranking a player writes for a neighbour, S (favourite) down to F (hate).'],
```

to:

```tsx
  ['Tier list', 'A player’s own six favourites, ranked S (favourite) down to F (hate). Someone else plays it.'],
```

Change `:15` from:

```tsx
  ['Hand', 'The six cards you hold and play during a round — written for you by a neighbour.'],
```

to:

```tsx
  ['Hand', 'The six cards you hold and play during a round — another player’s tier list, handed to you to play blind.'],
```

- [ ] **Step 7: Fix `projectInfo/rules.md`**

Add this immediately after the "Theme & overview" paragraph (after `:7`):

```markdown
**Whose taste?** Always your own. You never guess another player's preferences — the category is a gift from a neighbour, but the ranking is yours.
```

Change `:20` from:

```markdown
- **Hand (per player during play):** the 6 tier cards (with the items written by the assigner) in shuffled, opaque order. Items visible to the holder; tiers hidden.
```

to:

```markdown
- **Hand (per player during play):** the 6 tier cards (with the items written by the neighbour you assigned a category to) in shuffled, opaque order. Items visible to the holder; tiers hidden.
```

Change `:108` from:

```markdown
  - Hand: 6 cards stacked, each showing the item written by the assigner. Tier hidden. One card already-played per trick is greyed/removed.
```

to:

```markdown
  - Hand: 6 cards stacked, each showing the item written by the neighbour you assigned a category to. Tier hidden. One card already-played per trick is greyed/removed.
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 9: Verify visually**

Run `npm run dev` and open `/how-to-play`. Read the page top to bottom and confirm no sentence anywhere implies you rank someone else's favourites. Check the glossary entries for "Tier list" and "Hand" specifically.

Then grep for stragglers:

```bash
grep -rn "for you by\|neighbour's favourites\|friends' taste\|written by the assigner" src/ projectInfo/
```

Expected: no matches.

- [ ] **Step 10: Commit**

```bash
git add src/pages/HowToPlayPage.tsx projectInfo/rules.md
git commit -m "Correct how-to-play and rules.md to state the own-taste model

HowToPlayPage said 'you secretly rank a neighbour's favourites', the
opposite of the actual game and of rules.md. A playtester read it and
followed it. rules.md had its own slip, attributing hand items to the
assigner rather than the neighbour they assigned to.

Add an explicit 'Whose taste?' line to rules.md so the ambiguity
doesn't regrow."
```

---

## Self-Review

**Spec coverage.** Every numbered change in the spec maps to a task: bug fix and Change 2's first paragraph → Task 1; Changes 1 and 2 → Task 2; Changes 3 and 4 → Task 3; Change 5 ("explicitly unchanged") is honoured by no task touching those files. The spec's new-fixture requirement is Task 2 Step 7. The spec's single new unit test is Task 1 Step 1.

**Placeholder scan.** No TBD/TODO. Every code step carries the literal before and after text. No "similar to Task N" references.

**Type consistency.** `HeaderBlock`'s signature changes once, in Task 2 Step 1, and both call sites (entry Step 3, locked Step 4) are updated to match. `PlaysThisNote` is defined in Step 2 before its two uses. `willPlayName`/`willPlayColor` keep type `string` throughout and survive Task 1's rewiring — only the value they derive from changes.

**Build-red window.** Task 2 Steps 1-4 are a single refactor split across four edits; the file does not compile between Step 1 and Step 3. This is flagged inline in Step 1. Run the build only at Step 8. All other tasks leave the tree green at every step.

**Verification honesty.** Tasks 2 and 3 are verified by eye, not by assertion — that is the spec's deliberate choice, so a green `npm test` after those tasks proves only that nothing regressed, not that the copy is right. The visual checklists in Step 9 (Task 2) and Step 9 (Task 3) are the actual acceptance gate and must genuinely be performed.

---

### Task 4: Correct the homepage tagline

Added mid-flight. The Task 3 implementer found `src/locales/en.json` driving the homepage hero with copy that states the opposite model. The spec never listed this file; the human ruled to fix both lines (option A of four presented, 2026-07-30).

`src/locales/en.json` is the only locale file, and these two strings are its only model-contradicting content (verified by grep for taste/favourite/neighbour/rank/tier).

**Files:**
- Modify: `src/locales/en.json:3-4`

**Interfaces:**
- Consumes: nothing from Tasks 1-3.
- Produces: nothing. `HomePage.tsx:91-93` reads these keys via `t('home.taglineLead')` and `t('home.taglineDetail')`; the keys do not change, only their values.

- [ ] **Step 1: Replace both tagline strings**

In `src/locales/en.json`, change lines 3-4 from:

```json
    "taglineLead": "Rate your friends' taste.",
    "taglineDetail": "Rank each other’s favourites S-tier to trash. In secret.",
```

to:

```json
    "taglineLead": "Your taste, in someone else’s hands.",
    "taglineDetail": "Rank your own favourites S-tier to trash. Someone else plays them.",
```

Note the curly apostrophe (`’`, U+2019) in `someone else’s` — it matches the typographic style already used in `taglineDetail` and elsewhere in this file. Do not substitute an ASCII `'`.

`taglineLead` deliberately matches the `HowToPlayPage.tsx` hero ("Your taste, in someone else's hands") so home and how-to-play speak with one voice.

- [ ] **Step 2: Confirm the JSON still parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/en.json','utf8')); console.log('valid JSON')"`
Expected: `valid JSON`

- [ ] **Step 3: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 4: Verify visually**

Run `npm run dev` and open `/`. The hero should read "Your taste, in someone else’s hands." above "Rank your own favourites S-tier to trash. Someone else plays them." Confirm neither line clips or overflows at 375px width.

If you cannot drive a browser, mark this NOT PERFORMED — do not claim it passed.

- [ ] **Step 5: Commit**

```bash
git add src/locales/en.json
git commit -m "Correct homepage tagline to the own-taste model

The hero read 'Rate your friends' taste' over 'Rank each other's
favourites' — both stating the opposite of how the game works, on the
most-read screen in the app. taglineLead was also the exact sentence
removed from HowToPlayPage for having misled a playtester.

taglineLead now matches the how-to-play hero so the two surfaces speak
with one voice."
```
