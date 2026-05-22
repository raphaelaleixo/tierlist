import { describe, it, expect } from 'vitest';
import { createInitialGameState, submitCategory } from './lifecycle';
import { deserializeGameState } from './deserialize';

// Simulates what Firebase RTDB does to a serialised value:
//   1. drops every `null` key
//   2. drops empty objects (because their only contents were nulls)
//   3. drops empty arrays
// Walks an object recursively and reproduces this stripping.
function firebaseStrip<T>(value: T): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    const arr = value
      .map((v) => firebaseStrip(v))
      .filter((v) => v !== undefined);
    return arr.length === 0 ? undefined : arr;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const stripped = firebaseStrip(v);
      if (stripped !== undefined) out[k] = stripped;
    }
    return Object.keys(out).length === 0 ? undefined : out;
  }
  return value;
}

describe('deserializeGameState — Firebase round-trip', () => {
  it('hydrates a fresh GameState after Firebase strips nulls + empty containers', () => {
    const original = createInitialGameState([1, 2, 3], 1);
    const stripped = firebaseStrip(original);
    expect(stripped).toBeDefined(); // sanity: not the whole game is null
    const hydrated = deserializeGameState(stripped);
    expect(hydrated).not.toBeNull();
    expect(hydrated!.seating).toEqual([1, 2, 3]);
    expect(hydrated!.hearts).toEqual({ 1: 0, 2: 0, 3: 0 });
    expect(hydrated!.rounds[0]!.perPlayer[1]).toEqual({
      categoryAssigned: null,
      tierListWritten: null,
      hand: null,
    });
    expect(hydrated!.rounds[0]!.tricks).toEqual([]);
    expect(hydrated!.rounds[0]!.phase).toBe('category-pick');
    expect(hydrated!.rounds[0]!.passDirection).toBe('left');
    expect(hydrated!.rounds[0]!.firstPlayerId).toBe(1);
  });

  it('preserves submitted categories through the round-trip', () => {
    let original = createInitialGameState([1, 2, 3], 1);
    original = submitCategory(original, 1, { name: 'Animals', emoji: '🐾' });
    original = submitCategory(original, 2, { name: 'TV', emoji: '📺' });
    const stripped = firebaseStrip(original);
    const hydrated = deserializeGameState(stripped);
    expect(hydrated!.rounds[0]!.perPlayer[1].categoryAssigned).toEqual({ name: 'Animals', emoji: '🐾' });
    expect(hydrated!.rounds[0]!.perPlayer[2].categoryAssigned).toEqual({ name: 'TV', emoji: '📺' });
    expect(hydrated!.rounds[0]!.perPlayer[3].categoryAssigned).toBeNull();
  });

  it('falls back legacy string category data to {name, default emoji}', () => {
    const legacy = {
      seating: [1, 2],
      hearts: { 1: 0, 2: 0 },
      phase: 'in-round',
      currentRoundIndex: 0,
      rounds: [{
        number: 1, passDirection: 'left', phase: 'category-pick',
        firstPlayerId: 1, currentTrickIndex: 0,
        perPlayer: { 1: { categoryAssigned: 'OldFormatCategory' } },
      }],
    };
    const hydrated = deserializeGameState(legacy);
    expect(hydrated!.rounds[0]!.perPlayer[1].categoryAssigned).toEqual({
      name: 'OldFormatCategory',
      emoji: '📋',
    });
  });

  it('returns null for null/undefined input', () => {
    expect(deserializeGameState(null)).toBeNull();
    expect(deserializeGameState(undefined)).toBeNull();
  });

  it('handles arrays serialised as objects with numeric keys', () => {
    const objLikeArray = {
      phase: 'in-round',
      currentRoundIndex: 0,
      seating: { 0: 1, 1: 2, 2: 3 },
      hearts: { 1: 0, 2: 1, 3: 0 },
      rounds: {
        0: {
          number: 1,
          passDirection: 'left',
          phase: 'card-play',
          firstPlayerId: 1,
          currentTrickIndex: 0,
          tricks: {
            0: { index: 0, leaderId: 1, fBeatsS: false, plays: { 0: { playerId: 1, cardId: 'x', revealed: true } } },
          },
          perPlayer: { 1: { categoryAssigned: 'Foo' } },
        },
      },
    };
    const hydrated = deserializeGameState(objLikeArray);
    expect(hydrated!.seating).toEqual([1, 2, 3]);
    expect(hydrated!.rounds[0]!.tricks).toHaveLength(1);
    expect(hydrated!.rounds[0]!.tricks[0].plays).toHaveLength(1);
    expect(hydrated!.rounds[0]!.tricks[0].plays[0].cardId).toBe('x');
  });
});
