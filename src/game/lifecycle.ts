/**
 * Pure GameState lifecycle — initialization and phase transitions.
 *
 * All functions are pure: they take a GameState (and inputs), return a new
 * GameState. No I/O. The hook layer (useGameStateDriver) wires these into
 * Firebase writes; tests exercise them directly.
 *
 * Neighbour convention:
 *   seating is the CLOCKWISE order around the table.
 *   - right neighbour = next clockwise = seating[(idx + 1) % N]
 *   - left  neighbour = previous clockwise = seating[(idx - 1 + N) % N]
 *
 * Pass direction (per round):
 *   R1 = 'left'  — I assign my category to my LEFT neighbour
 *   R2 = 'right' — I assign my category to my RIGHT neighbour
 *
 * Derivation:
 *   writerOf(me)   = neighbour in passDirection       (recipient of my category writes my hand)
 *   assignerOf(me) = neighbour OPPOSITE passDirection (the one whose category I write)
 *   handAuthorOf(me) = writerOf(me)                   (recipient → writes → returns hand to me)
 */

import { TIERS, type CategoryChoice, type GameState, type HandCard, type PassDirection, type Round, type RoundPlayerState, type Tier, type TierList } from './types';
import { resolveTrick, type ResolvedPlay } from './rules';

export type Shuffle = <T>(arr: T[]) => T[];

const defaultShuffle: Shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const opposite = (d: PassDirection): PassDirection => (d === 'left' ? 'right' : 'left');

// ─── Neighbour helpers ────────────────────────────────────────────────────

export function neighbourOf(seating: number[], playerId: number, direction: PassDirection): number {
  const idx = seating.indexOf(playerId);
  if (idx === -1) throw new Error(`Player ${playerId} not in seating`);
  const n = seating.length;
  const next = direction === 'right' ? (idx + 1) % n : (idx - 1 + n) % n;
  return seating[next];
}

export function writerOf(seating: number[], playerId: number, direction: PassDirection): number {
  return neighbourOf(seating, playerId, direction);
}

export function assignerOf(seating: number[], playerId: number, direction: PassDirection): number {
  return neighbourOf(seating, playerId, opposite(direction));
}

// ─── State factories ──────────────────────────────────────────────────────

function emptyPlayerState(): RoundPlayerState {
  return { categoryAssigned: null, tierListWritten: null, hand: null };
}

function makeRound(number: 1 | 2, passDirection: PassDirection, seating: number[], firstPlayerId: number): Round {
  const perPlayer: Record<number, RoundPlayerState> = {};
  for (const pid of seating) perPlayer[pid] = emptyPlayerState();
  return {
    number,
    passDirection,
    phase: 'category-pick',
    perPlayer,
    tricks: [],
    currentTrickIndex: 0,
    firstPlayerId,
  };
}

export function createInitialGameState(seating: number[], firstPlayerId: number): GameState {
  const hearts: Record<number, number> = {};
  for (const pid of seating) hearts[pid] = 0;
  return {
    phase: 'in-round',
    rounds: [makeRound(1, 'left', seating, firstPlayerId)],
    currentRoundIndex: 0,
    hearts,
    seating,
  };
}

// ─── Round accessor ───────────────────────────────────────────────────────

function currentRound(state: GameState): Round {
  const r = state.rounds[state.currentRoundIndex];
  if (!r) throw new Error('No current round');
  return r;
}

function withCurrentRound(state: GameState, mutate: (r: Round) => Round): GameState {
  const idx = state.currentRoundIndex;
  const nextRounds = [...state.rounds] as GameState['rounds'];
  nextRounds[idx] = mutate(state.rounds[idx]!);
  return { ...state, rounds: nextRounds };
}

// ─── Phase 1: category pick ───────────────────────────────────────────────

export function submitCategory(state: GameState, playerId: number, category: CategoryChoice): GameState {
  return withCurrentRound(state, (r) => ({
    ...r,
    perPlayer: {
      ...r.perPlayer,
      [playerId]: { ...r.perPlayer[playerId], categoryAssigned: { ...category } },
    },
  }));
}

export function allCategoriesSubmitted(round: Round): boolean {
  return Object.values(round.perPlayer).every((p) => p.categoryAssigned !== null);
}

export function startTierWriting(state: GameState): GameState {
  return withCurrentRound(state, (r) => ({ ...r, phase: 'tier-writing' }));
}

// ─── Phase 2: tier writing ────────────────────────────────────────────────

export function submitTierList(state: GameState, playerId: number, list: TierList): GameState {
  return withCurrentRound(state, (r) => ({
    ...r,
    perPlayer: {
      ...r.perPlayer,
      [playerId]: { ...r.perPlayer[playerId], tierListWritten: { ...list } },
    },
  }));
}

export function allTierListsSubmitted(round: Round): boolean {
  return Object.values(round.perPlayer).every((p) => p.tierListWritten !== null);
}

// ─── Deal: tierLists → shuffled hands ─────────────────────────────────────

let _cardIdCounter = 0;
function nextCardId(): string {
  _cardIdCounter += 1;
  return `c${Date.now().toString(36)}-${_cardIdCounter}`;
}

function makeHandFromList(list: TierList, shuffle: Shuffle): HandCard[] {
  const ordered: HandCard[] = TIERS.map((t: Tier) => ({
    id: nextCardId(),
    item: list[t],
    tier: t,
    played: false,
  }));
  return shuffle(ordered);
}

export function dealHands(state: GameState, shuffle: Shuffle = defaultShuffle): GameState {
  return withCurrentRound(state, (r) => {
    const nextPerPlayer: Record<number, RoundPlayerState> = {};
    for (const pid of state.seating) {
      const writerId = writerOf(state.seating, pid, r.passDirection);
      const writerList = r.perPlayer[writerId].tierListWritten;
      if (!writerList) throw new Error(`Cannot deal: player ${writerId} has not submitted a tier list`);
      nextPerPlayer[pid] = { ...r.perPlayer[pid], hand: makeHandFromList(writerList, shuffle) };
    }
    return { ...r, perPlayer: nextPerPlayer };
  });
}

export function startCardPlay(state: GameState): GameState {
  return withCurrentRound(state, (r) => ({
    ...r,
    phase: 'card-play',
    currentTrickIndex: 0,
    tricks: [
      { index: 0, leaderId: r.firstPlayerId, plays: [], winnerId: null, fBeatsS: false },
    ],
  }));
}

// ─── Phase 3: card play ───────────────────────────────────────────────────

export function playCard(state: GameState, playerId: number, cardId: string): GameState {
  return withCurrentRound(state, (r) => {
    const playerHand = r.perPlayer[playerId].hand;
    if (!playerHand) throw new Error(`Player ${playerId} has no hand`);
    const card = playerHand.find((c) => c.id === cardId);
    if (!card) throw new Error(`Card ${cardId} not in player ${playerId}'s hand`);
    if (card.played) throw new Error(`Card ${cardId} already played`);

    const nextHand = playerHand.map((c) => (c.id === cardId ? { ...c, played: true } : c));
    const trickIdx = r.currentTrickIndex;
    const trick = r.tricks[trickIdx];
    const nextTrick = {
      ...trick,
      plays: [...trick.plays, { playerId, cardId, revealed: false }],
    };
    const nextTricks = [...r.tricks];
    nextTricks[trickIdx] = nextTrick;
    return {
      ...r,
      perPlayer: {
        ...r.perPlayer,
        [playerId]: { ...r.perPlayer[playerId], hand: nextHand },
      },
      tricks: nextTricks,
    };
  });
}

export function isCurrentTrickComplete(state: GameState): boolean {
  const r = currentRound(state);
  return r.tricks[r.currentTrickIndex].plays.length === state.seating.length;
}

// Whose turn is it in the current trick? Trick play proceeds clockwise (right)
// from the leader. Returns null when not in card-play or the trick is complete.
export function currentTurnPlayerId(state: GameState): number | null {
  if (state.phase !== 'in-round') return null;
  const r = state.rounds[state.currentRoundIndex];
  if (!r || r.phase !== 'card-play') return null;
  const trick = r.tricks[r.currentTrickIndex];
  if (!trick) return null;
  if (trick.plays.length >= state.seating.length) return null;
  const leaderIdx = state.seating.indexOf(trick.leaderId);
  if (leaderIdx === -1) return null;
  return state.seating[(leaderIdx + trick.plays.length) % state.seating.length];
}

function tierOfCard(round: Round, playerId: number, cardId: string): Tier {
  const card = round.perPlayer[playerId].hand?.find((c) => c.id === cardId);
  if (!card) throw new Error(`Card ${cardId} not found for player ${playerId}`);
  return card.tier;
}

export function resolveCurrentTrick(state: GameState): GameState {
  const r = currentRound(state);
  const trick = r.tricks[r.currentTrickIndex];
  const resolved: ResolvedPlay[] = trick.plays.map((p) => ({
    playerId: p.playerId,
    tier: tierOfCard(r, p.playerId, p.cardId),
  }));
  const { winnerId, fBeatsS } = resolveTrick(resolved);

  const nextTricks = [...r.tricks];
  nextTricks[r.currentTrickIndex] = {
    ...trick,
    plays: trick.plays.map((p) => ({ ...p, revealed: true })),
    winnerId,
    fBeatsS,
  };
  return {
    ...state,
    hearts: { ...state.hearts, [winnerId]: (state.hearts[winnerId] ?? 0) + 1 },
    rounds: state.rounds.map((rr, i) =>
      i === state.currentRoundIndex ? { ...r, tricks: nextTricks } : rr,
    ) as GameState['rounds'],
  };
}

export function advanceAfterTrick(state: GameState): GameState {
  return withCurrentRound(state, (r) => {
    const finishedIdx = r.currentTrickIndex;
    const winnerId = r.tricks[finishedIdx].winnerId;
    if (winnerId == null) throw new Error('Trick not yet resolved');
    const nextIdx = finishedIdx + 1;
    return {
      ...r,
      currentTrickIndex: nextIdx,
      tricks: [
        ...r.tricks,
        { index: nextIdx, leaderId: winnerId, plays: [], winnerId: null, fBeatsS: false },
      ],
    };
  });
}

export function isRoundComplete(state: GameState): boolean {
  const r = currentRound(state);
  return r.tricks.length === 5 && r.tricks.every((t) => t.winnerId !== null);
}

// ─── Round 2 transition ───────────────────────────────────────────────────

export function startRound2(state: GameState): GameState {
  const r1 = state.rounds[0];
  const lastWinner = r1.tricks[r1.tricks.length - 1]?.winnerId;
  if (lastWinner == null) throw new Error('Cannot start round 2 — round 1 unresolved');
  const round2 = makeRound(2, 'right', state.seating, lastWinner);
  return {
    ...state,
    currentRoundIndex: 1,
    rounds: [r1, round2],
  };
}

// ─── End game ─────────────────────────────────────────────────────────────

export function endGame(state: GameState): GameState {
  return { ...state, phase: 'game-end-reveal' };
}

export function showFinalScore(state: GameState): GameState {
  return { ...state, phase: 'final-score' };
}
