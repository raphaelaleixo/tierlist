/**
 * useGameState — subscribes to rooms/{id}/game in Firebase RTDB.
 *
 * Returns:
 *   - gameState: the current GameState (or null while loading / not yet initialised)
 *   - loading:   true until the first snapshot arrives (or until roomId is set)
 *   - error:     subscription error, if any
 *
 * Mutations go through writeGameState (full-state write) — used by both
 * the big-screen driver (auto-transitions) and phones (action submissions).
 */
import { useEffect, useState } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../firebase';
import type { GameState } from '../game/types';
import { deserializeGameState } from '../game/deserialize';

export function useGameState(roomId: string | undefined) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotArrived, setSnapshotArrived] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const gameRef = ref(database, `rooms/${roomId}/game`);
    return onValue(
      gameRef,
      (snapshot) => {
        setGameState(deserializeGameState(snapshot.val()));
        setError(null);
        setSnapshotArrived(true);
      },
      (err) => {
        setError(err.message);
        setSnapshotArrived(true);
      },
    );
  }, [roomId]);

  const loading = !!roomId && !snapshotArrived;
  return { gameState, loading, error };
}

export async function writeGameState(roomId: string, state: GameState): Promise<void> {
  await set(ref(database, `rooms/${roomId}/game`), state);
}
