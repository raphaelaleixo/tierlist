# Authorship copy — making it clear you rank your OWN favourites

Date: 2026-07-30
Status: approved, ready for implementation planning

## Problem

Observed in a live 3-player run (Paula / Raphael / Tester). Paula hit two
confusions during round 1:

1. Writing her tier list, she didn't know whether to rank by her own taste or
   by Raphael's (Raphael being the player who would play her list).
2. She assumed Tester — who was writing the hand Paula would play — needed to
   know Paula's preferences.

Both are the same misconception mirrored: that a tier list is *about* the
player who ends up holding it. It isn't. Every list is its author's own
favourites; the twist is that someone else plays it blind.

The confusion is earned, not user error. The copy says both things at once:

- `projectInfo/rules.md:7` — "you tier rank your own favourite things"
- `src/pages/HowToPlayPage.tsx:47` — "You secretly rank **a neighbour's**
  favourites from S to F"

Those contradict. Paula read the how-to-play page and followed it correctly.

## Decision: the game is "own taste"

Confirmed with the user. Players always rank **their own** favourites, in a
category a neighbour handed them. This matches the source game (*My Favourite
Things*), `rules.md`, and the end-game reveal payoff ("*that* was your
F-tier?!"). It also means no player needs to know any other player, which is
what makes the game work with a stranger at the table.

The rejected alternative — rank what you think the *holder* likes — is a
coherent but different game that requires a table of close friends.

## Root cause: two competing vocabularies

The app already describes authorship correctly during play, and only gets it
wrong while authoring:

| Surface | Framing | Example | Correct? |
|---|---|---|---|
| `PlayerCell.tsx:124` (big screen) | possessive | "Tester's Animals" | yes |
| `PhoneCardPlay.tsx:237` (hand header) | possessive | "ranked by Tester" | yes |
| `PhoneCategoryPick.tsx:203` | directional | "for Tester to tier" | no |
| `PhoneTierWriting.tsx:221` | directional | "for Raphael to play" | no |

Directional framing ("for X") reads as "about X". Possessive framing ("X's")
does not. The fix is to extend the possessive vocabulary backwards into the
two authoring screens, so the whole app speaks one way.

This is an ordering problem as much as a wording one: the tier-writing header
*leads* with who will play the list, before the player knows what they are
being asked to write. No rewording fixes that; the element has to move.

## Scope

Copy plus layout on existing screens. No new screens, no new teaching beat
(a pre-round explainer is a tax on the majority who already understand, and
party games get skipped through anyway). No game-logic changes — `lifecycle.ts`
and `rules.ts` are correct as written.

## Changes

### 1. `src/components/phone/PhoneCategoryPick.tsx`

Subline goes possessive; one helper line added below the input.

- Subline (`:203`, and the locked view at `:97`):
  "for **[Tester]** to tier." → "for **[Tester]**'s favourites."
- New helper line under the text input, small type:
  "They'll rank their own — and you play their list, so pick something you can
  read them on."

The helper line earns its length by doing three jobs: it kills "am I picking a
category about Tester", kills "Tester needs to know me", and explains why the
choice is strategic (Paula plays Tester's list blind, so she wants a category
she can predict Tester in).

### 2. `src/components/phone/PhoneTierWriting.tsx`

Header stops leading with who plays the list.

Entry view (`HeaderBlock`, `:184-225`):

- Title: category name alone → "YOUR {CATEGORY}", with "YOUR" in the player's
  own colour and the category name in white.
- Subline: "for [Raphael] to play." → "Rank your own favourites, S to F."
- New footnote immediately above the Lock-it-in button:
  "**[Raphael]** plays these — they won't know your order."

"Who plays it" survives as a consequence read *after* the task is understood,
rather than as the frame read before it.

Locked / recap view (`LockedView`, `:256-325`): same header treatment; the
footnote becomes the memory prompt the recap beat exists for —
"Memorise it — you're the only one who knows this order."

Use they/them for the other player throughout; player pronouns are unknown.

### 3. `src/pages/HowToPlayPage.tsx`

| Line | Now | Becomes |
|---|---|---|
| 43 | "Rate your friends' taste" | "Your taste, in someone else's hands" |
| 47-48 | "You secretly rank a neighbour's favourites from S to F; they play the hand…" | "You secretly rank your own favourites from S to F — then a neighbour plays them without knowing the order you gave." |
| 70-71 | "…secretly tier a list for another…" | "…secretly rank your own favourites in a category someone handed you…" |
| 76-77 | "They'll write the tier list, but you'll be the one who plays it" | "They'll rank their own favourites in it — and you'll be the one who plays that list." |
| 82 | "Now fill in the category a neighbour gave you: six items…" | "…your six items — your actual favourites, your actual ranking." |
| 90 | "six cards a neighbour wrote for you" | "six cards a neighbour wrote — their favourites, not yours." |

Glossary:

- `:13` **Tier list** — "The six-card ranking a player writes for a neighbour"
  → "A player's own six favourites, ranked S down to F. Someone *else* plays it."
- `:15` **Hand** — "written for you by a neighbour"
  → "another player's tier list, handed to you to play blind."

### 4. `projectInfo/rules.md`

Same slip in the components section: `:20` and `:108` say the hand's items are
"written by the assigner". The assigner is the player who *plays* the hand; the
writer is the neighbour they assigned a category to. Correct both to "written
by the neighbour you assigned a category to".

Add one line under Theme & overview so the ambiguity does not regrow:

> **Whose taste?** Always your own. You never guess another player's
> preferences — the category is a gift from a neighbour, but the ranking is
> yours.

### 5. Explicitly unchanged

- `PhoneCardPlay.tsx`, `PlayerCell.tsx`, `LiveTierList.tsx`,
  `BigScreenEndReveal.tsx` — already use possessive framing.
- `src/game/*` — logic is correct; this is a presentation defect only.

## Testing

The existing suites (`rules.test.ts`, `lifecycle.test.ts`,
`deserialize.test.ts`) cover logic that is not changing; they must still pass.

No new unit tests — asserting on display strings is brittle and would lock in
wording we may still tune. Verification is by eye through the existing mock
pages (`MockPlayerPhone`, `MockBigScreen`), which can reach every affected
screen without a live room:

1. `MockPlayerPhone` category-pick state — new subline and helper line.
2. `MockPlayerPhone` tier-writing state — new header, footnote placement.
3. `MockPlayerPhone` tier-writing locked state — memory prompt.
4. `/how-to-play` — all six body edits and both glossary edits.

Success criterion: reading only the phone screens, with no prior explanation,
a new player can answer "whose favourites am I ranking?" correctly.

## Open questions

None.
