import { describe, it, expect } from 'vitest';
import type { CategoryChoice, TierList, GameState } from './types';
import {
  neighbourOf,
  writerOf,
  assignerOf,
  createInitialGameState,
  submitCategory,
  allCategoriesSubmitted,
  startTierWriting,
  submitTierList,
  allTierListsSubmitted,
  dealHands,
  startCardPlay,
  playCard,
  isCurrentTrickComplete,
  resolveCurrentTrick,
  advanceAfterTrick,
  isRoundComplete,
  startRound2,
  endGame,
  currentTurnPlayerId,
} from './lifecycle';

const IDENTITY_SHUFFLE = <T,>(arr: T[]) => [...arr];

const cat = (name: string, emoji = '🔖'): CategoryChoice => ({ name, emoji });

const makeList = (suffix: string): TierList => ({
  S: `s${suffix}`,
  A: `a${suffix}`,
  B: `b${suffix}`,
  C: `c${suffix}`,
  D: `d${suffix}`,
  F: `f${suffix}`,
});

// Bootstrap a 3-player game all the way to mid-card-play, deterministically.
function bootstrapToCardPlay(): GameState {
  let s = createInitialGameState([1, 2, 3], 1);
  s = submitCategory(s, 1, cat('cat1'));
  s = submitCategory(s, 2, cat('cat2'));
  s = submitCategory(s, 3, cat('cat3'));
  s = startTierWriting(s);
  s = submitTierList(s, 1, makeList('1'));
  s = submitTierList(s, 2, makeList('2'));
  s = submitTierList(s, 3, makeList('3'));
  s = dealHands(s, IDENTITY_SHUFFLE);
  s = startCardPlay(s);
  return s;
}

describe('neighbourOf / writerOf / assignerOf', () => {
  const seating = [1, 2, 3, 4];

  it('right neighbour is next clockwise (wraps)', () => {
    expect(neighbourOf(seating, 1, 'right')).toBe(2);
    expect(neighbourOf(seating, 4, 'right')).toBe(1);
  });

  it('left neighbour is previous clockwise (wraps)', () => {
    expect(neighbourOf(seating, 1, 'left')).toBe(4);
    expect(neighbourOf(seating, 3, 'left')).toBe(2);
  });

  it('writerOf(p) = neighbour in passDirection (recipient writes for me)', () => {
    // R1 (left): I pass to my left; my left writes for me
    expect(writerOf(seating, 1, 'left')).toBe(4);
    // R2 (right): I pass to my right; my right writes for me
    expect(writerOf(seating, 1, 'right')).toBe(2);
  });

  it('assignerOf(p) = neighbour OPPOSITE passDirection (the one whose category I write)', () => {
    expect(assignerOf(seating, 1, 'left')).toBe(2);  // R1: my assigner is to my right
    expect(assignerOf(seating, 1, 'right')).toBe(4); // R2: my assigner is to my left
  });
});

describe('createInitialGameState', () => {
  it('starts in round 1, category-pick, hearts=0, R1 passes left', () => {
    const s = createInitialGameState([1, 2, 3], 2);
    expect(s.phase).toBe('in-round');
    expect(s.currentRoundIndex).toBe(0);
    expect(s.seating).toEqual([1, 2, 3]);
    expect(s.hearts).toEqual({ 1: 0, 2: 0, 3: 0 });
    expect(s.rounds[0].number).toBe(1);
    expect(s.rounds[0].passDirection).toBe('left');
    expect(s.rounds[0].phase).toBe('category-pick');
    expect(s.rounds[0].firstPlayerId).toBe(2);
    expect(s.rounds[0].tricks).toEqual([]);
    expect(s.rounds[0].currentTrickIndex).toBe(0);
    // perPlayer entries initialised for each seated player
    expect(s.rounds[0].perPlayer[1]).toBeDefined();
    expect(s.rounds[0].perPlayer[1].categoryAssigned).toBeNull();
  });
});

describe('submitCategory + allCategoriesSubmitted', () => {
  it('records each submission; allCategoriesSubmitted flips when last comes in', () => {
    let s = createInitialGameState([1, 2, 3], 1);
    expect(allCategoriesSubmitted(s.rounds[0])).toBe(false);
    s = submitCategory(s, 1, cat('Animals', '🐾'));
    expect(s.rounds[0].perPlayer[1].categoryAssigned).toEqual({ name: 'Animals', emoji: '🐾' });
    expect(allCategoriesSubmitted(s.rounds[0])).toBe(false);
    s = submitCategory(s, 2, cat('TV'));
    s = submitCategory(s, 3, cat('Movies'));
    expect(allCategoriesSubmitted(s.rounds[0])).toBe(true);
  });
});

describe('startTierWriting', () => {
  it('moves round phase to tier-writing', () => {
    let s = createInitialGameState([1, 2, 3], 1);
    s = submitCategory(s, 1, cat('A'));
    s = submitCategory(s, 2, cat('B'));
    s = submitCategory(s, 3, cat('C'));
    s = startTierWriting(s);
    expect(s.rounds[0].phase).toBe('tier-writing');
  });
});

describe('submitTierList + allTierListsSubmitted', () => {
  it('records lists per player', () => {
    let s = createInitialGameState([1, 2, 3], 1);
    s = submitCategory(s, 1, cat('A'));
    s = submitCategory(s, 2, cat('B'));
    s = submitCategory(s, 3, cat('C'));
    s = startTierWriting(s);
    expect(allTierListsSubmitted(s.rounds[0])).toBe(false);
    s = submitTierList(s, 1, makeList('1'));
    s = submitTierList(s, 2, makeList('2'));
    s = submitTierList(s, 3, makeList('3'));
    expect(s.rounds[0].perPlayer[1].tierListWritten).toEqual(makeList('1'));
    expect(allTierListsSubmitted(s.rounds[0])).toBe(true);
  });
});

describe('dealHands', () => {
  it('each player\'s hand = their passDirection neighbour\'s tierListWritten as HandCards', () => {
    // R1 pass left. seating [1,2,3]: left of 1 = 3, left of 2 = 1, left of 3 = 2
    let s = createInitialGameState([1, 2, 3], 1);
    s = submitCategory(s, 1, cat('c1'));
    s = submitCategory(s, 2, cat('c2'));
    s = submitCategory(s, 3, cat('c3'));
    s = startTierWriting(s);
    s = submitTierList(s, 1, makeList('1'));
    s = submitTierList(s, 2, makeList('2'));
    s = submitTierList(s, 3, makeList('3'));
    s = dealHands(s, IDENTITY_SHUFFLE);

    // P1's hand = list written by writer(1) = neighbourOf(1, 'left') = 3 → makeList('3')
    const p1 = s.rounds[0].perPlayer[1].hand!;
    expect(p1.map((c) => c.item)).toEqual(['s3', 'a3', 'b3', 'c3', 'd3', 'f3']);
    expect(p1.map((c) => c.tier)).toEqual(['S', 'A', 'B', 'C', 'D', 'F']);
    expect(p1.every((c) => !c.played)).toBe(true);
    expect(new Set(p1.map((c) => c.id)).size).toBe(6); // unique ids

    const p2 = s.rounds[0].perPlayer[2].hand!;
    expect(p2.map((c) => c.item)).toEqual(['s1', 'a1', 'b1', 'c1', 'd1', 'f1']);
    const p3 = s.rounds[0].perPlayer[3].hand!;
    expect(p3.map((c) => c.item)).toEqual(['s2', 'a2', 'b2', 'c2', 'd2', 'f2']);
  });

  it('respects the shuffle function', () => {
    const reverse = <T,>(arr: T[]) => [...arr].reverse();
    let s = createInitialGameState([1, 2], 1);
    s = submitCategory(s, 1, cat('c1'));
    s = submitCategory(s, 2, cat('c2'));
    s = startTierWriting(s);
    s = submitTierList(s, 1, makeList('1'));
    s = submitTierList(s, 2, makeList('2'));
    s = dealHands(s, reverse);
    expect(s.rounds[0].perPlayer[1].hand!.map((c) => c.item)).toEqual([
      'f2', 'd2', 'c2', 'b2', 'a2', 's2',
    ]);
  });
});

describe('startCardPlay', () => {
  it('moves phase to card-play and seeds trick 0 with firstPlayerId as leader', () => {
    const s = bootstrapToCardPlay();
    expect(s.rounds[0].phase).toBe('card-play');
    expect(s.rounds[0].tricks).toHaveLength(1);
    expect(s.rounds[0].tricks[0].index).toBe(0);
    expect(s.rounds[0].tricks[0].leaderId).toBe(1);
    expect(s.rounds[0].tricks[0].plays).toEqual([]);
    expect(s.rounds[0].tricks[0].winnerId).toBeNull();
    expect(s.rounds[0].currentTrickIndex).toBe(0);
  });
});

describe('playCard + isCurrentTrickComplete', () => {
  it('appends to current trick.plays and marks card played=true', () => {
    let s = bootstrapToCardPlay();
    const p1Hand = s.rounds[0].perPlayer[1].hand!;
    const cardToPlay = p1Hand[0]; // S-tier card
    s = playCard(s, 1, cardToPlay.id);
    const trick = s.rounds[0].tricks[0];
    expect(trick.plays).toHaveLength(1);
    expect(trick.plays[0]).toEqual({
      playerId: 1,
      cardId: cardToPlay.id,
      revealed: false,
    });
    const p1After = s.rounds[0].perPlayer[1].hand!.find((c) => c.id === cardToPlay.id);
    expect(p1After!.played).toBe(true);
  });

  it('isCurrentTrickComplete reflects when all seated players have played', () => {
    let s = bootstrapToCardPlay();
    expect(isCurrentTrickComplete(s)).toBe(false);
    s = playCard(s, 1, s.rounds[0].perPlayer[1].hand![0].id);
    s = playCard(s, 2, s.rounds[0].perPlayer[2].hand![0].id);
    expect(isCurrentTrickComplete(s)).toBe(false);
    s = playCard(s, 3, s.rounds[0].perPlayer[3].hand![0].id);
    expect(isCurrentTrickComplete(s)).toBe(true);
  });
});

describe('resolveCurrentTrick', () => {
  it('marks all plays revealed, sets winnerId / fBeatsS, awards heart', () => {
    let s = bootstrapToCardPlay();
    // Plays: p1=S, p2=A, p3=F → F-beats-S, p3 wins
    s = playCard(s, 1, s.rounds[0].perPlayer[1].hand!.find((c) => c.tier === 'S')!.id);
    s = playCard(s, 2, s.rounds[0].perPlayer[2].hand!.find((c) => c.tier === 'A')!.id);
    s = playCard(s, 3, s.rounds[0].perPlayer[3].hand!.find((c) => c.tier === 'F')!.id);
    s = resolveCurrentTrick(s);
    const trick = s.rounds[0].tricks[0];
    expect(trick.winnerId).toBe(3);
    expect(trick.fBeatsS).toBe(true);
    expect(trick.plays.every((p) => p.revealed)).toBe(true);
    expect(s.hearts[3]).toBe(1);
    expect(s.hearts[1]).toBe(0);
  });
});

describe('advanceAfterTrick + isRoundComplete', () => {
  it('next trick.leader = previous winner; round complete after 5 tricks', () => {
    let s = bootstrapToCardPlay();
    // Play 5 tricks, each time p1=A (low) so p1 wins each
    for (let i = 0; i < 5; i++) {
      const p1Card = s.rounds[0].perPlayer[1].hand!.find((c) => !c.played && c.tier !== 'F');
      const p2Card = s.rounds[0].perPlayer[2].hand!.find((c) => !c.played && c.tier !== 'A');
      const p3Card = s.rounds[0].perPlayer[3].hand!.find((c) => !c.played && c.tier !== 'A');
      s = playCard(s, 1, p1Card!.id);
      s = playCard(s, 2, p2Card!.id);
      s = playCard(s, 3, p3Card!.id);
      s = resolveCurrentTrick(s);
      const lastIdx = s.rounds[0].currentTrickIndex;
      const lastWinner = s.rounds[0].tricks[lastIdx].winnerId;
      expect(typeof lastWinner).toBe('number');
      if (i < 4) {
        s = advanceAfterTrick(s);
        // After advancing, currentTrickIndex incremented, new trick seeded with leaderId=lastWinner
        expect(s.rounds[0].currentTrickIndex).toBe(lastIdx + 1);
        expect(s.rounds[0].tricks[lastIdx + 1].leaderId).toBe(lastWinner);
      }
    }
    expect(s.rounds[0].tricks).toHaveLength(5);
    expect(s.rounds[0].tricks.every((t) => t.winnerId !== null)).toBe(true);
    expect(isRoundComplete(s)).toBe(true);
    // One card remains unplayed per player (mystery card)
    for (const pid of [1, 2, 3]) {
      const unplayed = s.rounds[0].perPlayer[pid].hand!.filter((c) => !c.played);
      expect(unplayed).toHaveLength(1);
    }
  });
});

describe('startRound2', () => {
  it('creates round 2 with reversed direction and last-trick winner as leader', () => {
    // Hand-craft a minimal end-of-round-1 state
    let s = bootstrapToCardPlay();
    // Mark round 1 as if complete with player 2 winning the last trick
    s.rounds[0].tricks = [
      { index: 0, leaderId: 1, plays: [], winnerId: 1, fBeatsS: false },
      { index: 1, leaderId: 1, plays: [], winnerId: 3, fBeatsS: false },
      { index: 2, leaderId: 3, plays: [], winnerId: 1, fBeatsS: false },
      { index: 3, leaderId: 1, plays: [], winnerId: 2, fBeatsS: false },
      { index: 4, leaderId: 2, plays: [], winnerId: 2, fBeatsS: false },
    ];
    s.rounds[0].currentTrickIndex = 4;
    s = startRound2(s);
    expect(s.currentRoundIndex).toBe(1);
    expect(s.rounds).toHaveLength(2);
    expect(s.rounds[1]!.number).toBe(2);
    expect(s.rounds[1]!.passDirection).toBe('right');
    expect(s.rounds[1]!.phase).toBe('category-pick');
    expect(s.rounds[1]!.firstPlayerId).toBe(2);
    expect(s.rounds[1]!.tricks).toEqual([]);
    expect(s.rounds[1]!.currentTrickIndex).toBe(0);
    // Round 1 preserved for the end-game reveal
    expect(s.rounds[0].tricks).toHaveLength(5);
  });
});

describe('endGame', () => {
  it('moves top-level phase to game-end-reveal', () => {
    let s = bootstrapToCardPlay();
    s = endGame(s);
    expect(s.phase).toBe('game-end-reveal');
  });
});

describe('currentTurnPlayerId', () => {
  it('starts as the trick leader; advances clockwise (= "right") as plays come in', () => {
    // seating [1,2,3,4], R1 leader = 1
    let s = createInitialGameState([1, 2, 3, 4], 1);
    s = submitCategory(s, 1, cat('a'));
    s = submitCategory(s, 2, cat('b'));
    s = submitCategory(s, 3, cat('c'));
    s = submitCategory(s, 4, cat('d'));
    s = startTierWriting(s);
    s = submitTierList(s, 1, makeList('1'));
    s = submitTierList(s, 2, makeList('2'));
    s = submitTierList(s, 3, makeList('3'));
    s = submitTierList(s, 4, makeList('4'));
    s = dealHands(s, IDENTITY_SHUFFLE);
    s = startCardPlay(s);

    expect(currentTurnPlayerId(s)).toBe(1); // leader
    s = playCard(s, 1, s.rounds[0].perPlayer[1].hand![0].id);
    expect(currentTurnPlayerId(s)).toBe(2); // next clockwise
    s = playCard(s, 2, s.rounds[0].perPlayer[2].hand![0].id);
    expect(currentTurnPlayerId(s)).toBe(3);
    s = playCard(s, 3, s.rounds[0].perPlayer[3].hand![0].id);
    expect(currentTurnPlayerId(s)).toBe(4);
    s = playCard(s, 4, s.rounds[0].perPlayer[4].hand![0].id);
    expect(currentTurnPlayerId(s)).toBeNull(); // trick complete
  });

  it('wraps when leader is mid-array', () => {
    const s = createInitialGameState([1, 2, 3, 4], 3);
    // Bootstrap directly via startCardPlay is tricky without a leader-3 fixture;
    // verify the leader-based starting point via a synthetic state:
    const synth = { ...s, rounds: [{ ...s.rounds[0]!, phase: 'card-play' as const,
      tricks: [{ index: 0, leaderId: 3, plays: [], winnerId: null, fBeatsS: false }] }] as typeof s.rounds };
    expect(currentTurnPlayerId(synth)).toBe(3);
    const after1: typeof synth = {
      ...synth,
      rounds: [{
        ...synth.rounds[0]!,
        tricks: [{ ...synth.rounds[0]!.tricks[0], plays: [{ playerId: 3, cardId: 'x', revealed: false }] }],
      }] as typeof synth.rounds,
    };
    expect(currentTurnPlayerId(after1)).toBe(4);
  });

  it('returns null outside card-play', () => {
    const s = createInitialGameState([1, 2, 3], 1);
    expect(currentTurnPlayerId(s)).toBeNull();
  });
});
