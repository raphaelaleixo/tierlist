/**
 * useGameStateDriver — big-screen-only auto-transition effects.
 *
 * The big-screen page (RoomPage) is the single client allowed to advance the
 * game state, because some transitions (dealHands → shuffle) are not idempotent
 * across multiple clients. Phones never call this hook.
 *
 * Watches the current gameState and, when conditions are met, writes the next
 * state back to Firebase. Includes timing delays so the UI has windows to
 * animate trick reveals and end-of-round transitions.
 */
import { useEffect } from 'react';
import {
  allCategoriesSubmitted,
  allTierListsSubmitted,
  startTierWriting,
  dealHands,
  startCardPlay,
  isCurrentTrickComplete,
  resolveCurrentTrick,
  advanceAfterTrick,
  isRoundComplete,
  startRound2,
  endGame,
} from '../game/lifecycle';
import type { GameState } from '../game/types';
import { writeGameState } from './useGameState';

// Tunable delays so the big screen can play its animations. Pass B will likely
// add a dedicated "revealing" intermediate state; for now the driver just waits.
const CATEGORY_REVEAL_DELAY_MS = 3000; // window for "all categories in" reveal beat
const TRICK_REVEAL_DELAY_MS = 2400;    // window for per-card flip cinema
const POST_RESOLVE_DELAY_MS = 1500;    // window for winner highlight + heart pop
const ROUND_END_DELAY_MS = 2500;       // window for end-of-round transition

export function useGameStateDriver(
  roomId: string | undefined,
  gameState: GameState | null,
): void {
  useEffect(() => {
    if (!roomId || !gameState) return;
    if (gameState.phase !== 'in-round') return;

    const round = gameState.rounds[gameState.currentRoundIndex]!;

    // ─── Phase 1 done → tier-writing (with a beat for the reveal) ────────
    if (round.phase === 'category-pick' && allCategoriesSubmitted(round)) {
      const t = setTimeout(() => {
        void writeGameState(roomId, startTierWriting(gameState));
      }, CATEGORY_REVEAL_DELAY_MS);
      return () => clearTimeout(t);
    }

    // ─── Phase 2 done → deal + card-play ─────────────────────────────────
    if (round.phase === 'tier-writing' && allTierListsSubmitted(round)) {
      const dealt = dealHands(gameState);
      void writeGameState(roomId, startCardPlay(dealt));
      return;
    }

    // ─── Phase 3: trick lifecycle ────────────────────────────────────────
    if (round.phase === 'card-play' && isCurrentTrickComplete(gameState)) {
      const trick = round.tricks[round.currentTrickIndex];
      if (trick.winnerId === null) {
        // All played, not yet resolved — wait for reveal animation, then resolve
        const t = setTimeout(() => {
          void writeGameState(roomId, resolveCurrentTrick(gameState));
        }, TRICK_REVEAL_DELAY_MS);
        return () => clearTimeout(t);
      }
      // Resolved → either advance to next trick or end the round
      const isLastTrick = round.currentTrickIndex === 4;
      if (!isLastTrick) {
        const t = setTimeout(() => {
          void writeGameState(roomId, advanceAfterTrick(gameState));
        }, POST_RESOLVE_DELAY_MS);
        return () => clearTimeout(t);
      }
      // Last trick resolved → round complete; either start R2 or end the game
      if (isRoundComplete(gameState)) {
        const t = setTimeout(() => {
          if (gameState.currentRoundIndex === 0) {
            void writeGameState(roomId, startRound2(gameState));
          } else {
            void writeGameState(roomId, endGame(gameState));
          }
        }, ROUND_END_DELAY_MS);
        return () => clearTimeout(t);
      }
    }
  }, [roomId, gameState]);
}
