import { describe, it, expect } from 'vitest';
import { winnerOfTrick, resolveTrick, type ResolvedPlay } from './rules';

const play = (playerId: number, tier: ResolvedPlay['tier']): ResolvedPlay => ({
  playerId,
  tier,
});

describe('winnerOfTrick', () => {
  it('lowest tier wins when no S/F interaction', () => {
    const winner = winnerOfTrick([play(1, 'C'), play(2, 'A'), play(3, 'B')]);
    expect(winner).toBe(2);
  });

  it('F has no win power without an S in the trick', () => {
    const winner = winnerOfTrick([play(1, 'F'), play(2, 'B'), play(3, 'C')]);
    expect(winner).toBe(2);
  });

  it('F beats S (the "upset" override)', () => {
    const winner = winnerOfTrick([play(1, 'S'), play(2, 'A'), play(3, 'F')]);
    expect(winner).toBe(3);
  });

  it('ties on lowest tier go to earliest in turn order', () => {
    const winner = winnerOfTrick([play(1, 'B'), play(2, 'A'), play(3, 'A')]);
    expect(winner).toBe(2);
  });

  it('multiple Fs with an S — earliest F wins', () => {
    const winner = winnerOfTrick([play(1, 'S'), play(2, 'F'), play(3, 'F')]);
    expect(winner).toBe(2);
  });

  it('multiple Ss with one F — F still wins', () => {
    const winner = winnerOfTrick([play(1, 'S'), play(2, 'S'), play(3, 'F')]);
    expect(winner).toBe(3);
  });

  it('all-F (no S) — earliest in turn order wins', () => {
    const winner = winnerOfTrick([play(1, 'F'), play(2, 'F'), play(3, 'F')]);
    expect(winner).toBe(1);
  });

  it('single play wins by default', () => {
    const winner = winnerOfTrick([play(4, 'D')]);
    expect(winner).toBe(4);
  });
});

describe('resolveTrick (winner + UPSET flag)', () => {
  it('flags F-beats-S override for the big-screen callout', () => {
    expect(resolveTrick([play(1, 'S'), play(2, 'F')])).toEqual({
      winnerId: 2,
      fBeatsS: true,
    });
  });

  it('does not flag the override when no S is present', () => {
    expect(resolveTrick([play(1, 'F'), play(2, 'B')])).toEqual({
      winnerId: 2,
      fBeatsS: false,
    });
  });

  it('does not flag the override when no F is present', () => {
    expect(resolveTrick([play(1, 'A'), play(2, 'B')])).toEqual({
      winnerId: 1,
      fBeatsS: false,
    });
  });
});
