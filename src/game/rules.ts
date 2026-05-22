/**
 * Pure trick-resolution rules.
 *
 * The trick-winning rule (from rules.md):
 *   1. F-beats-S override: if at least one S AND at least one F are present,
 *      the earliest F in turn order wins.
 *   2. Otherwise lowest TIER_RANK wins; ties → earliest in turn order.
 *   3. All-F (no S): F has no win power, all share rank 99, earliest wins.
 *
 * Inputs are turn-ordered (clockwise from leader), and ties resolve by the
 * lowest array index — which is the earliest player in turn order.
 */

import { TIER_RANK, type Tier } from './types';

export interface ResolvedPlay {
  playerId: number;
  tier: Tier;
}

export interface TrickResult {
  winnerId: number;
  fBeatsS: boolean;  // true → drives the big-screen UPSET! callout
}

export function resolveTrick(plays: ResolvedPlay[]): TrickResult {
  if (plays.length === 0) {
    throw new Error('resolveTrick called with no plays');
  }

  const hasS = plays.some((p) => p.tier === 'S');
  const firstF = plays.find((p) => p.tier === 'F');

  if (hasS && firstF) {
    return { winnerId: firstF.playerId, fBeatsS: true };
  }

  let best = plays[0];
  for (let i = 1; i < plays.length; i++) {
    if (TIER_RANK[plays[i].tier] < TIER_RANK[best.tier]) {
      best = plays[i];
    }
  }
  return { winnerId: best.playerId, fBeatsS: false };
}

export function winnerOfTrick(plays: ResolvedPlay[]): number {
  return resolveTrick(plays).winnerId;
}
