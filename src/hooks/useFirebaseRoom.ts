/**
 * useFirebaseRoom — subscribes to rooms/{id}/state in Firebase RTDB.
 *
 * Returns:
 *   - roomState: deserialized RoomState<PlayerSlotData> (or null while loading / missing)
 *   - loading:   true until the first snapshot arrives
 *   - error:     error message if the room doesn't exist or Firebase fails
 *   - updateRoom: writes a full RoomState back to Firebase
 *
 * Plus standalone helpers:
 *   - roomExists(id)
 *   - findFirstEmptySlotId(id)
 */
import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { deserializeRoom } from 'react-gameroom';
import type { RoomState } from 'react-gameroom';
import { database } from '../firebase';
import type { PlayerSlotData } from '../game/types';

export type TierRoomState = RoomState<PlayerSlotData>;

export function useFirebaseRoom(roomId: string | undefined) {
  const [roomState, setRoomState] = useState<TierRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotArrived, setSnapshotArrived] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const stateRef = ref(database, `rooms/${roomId}/state`);
    return onValue(
      stateRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomState(deserializeRoom<PlayerSlotData>(data));
          setError(null);
        } else {
          setRoomState(null);
          setError('Room not found');
        }
        setSnapshotArrived(true);
      },
      (err) => {
        setError(err.message);
        setSnapshotArrived(true);
      },
    );
  }, [roomId]);

  const loading = !!roomId && !snapshotArrived;

  const updateRoom = useCallback(
    async (newState: TierRoomState) => {
      if (!roomId) return;
      await set(ref(database, `rooms/${roomId}/state`), newState);
    },
    [roomId],
  );

  return { roomState, loading, error, updateRoom };
}

export async function roomExists(roomId: string): Promise<boolean> {
  const snapshot = await get(ref(database, `rooms/${roomId}/state/roomId`));
  return snapshot.exists();
}

export async function findFirstEmptySlotId(roomId: string): Promise<number | null> {
  const snapshot = await get(ref(database, `rooms/${roomId}/state`));
  const val = snapshot.val();
  if (!val) return null;
  const room = deserializeRoom<PlayerSlotData>(val);
  const empty = room.players.find((p) => p.status === 'empty');
  return empty ? empty.id : null;
}
