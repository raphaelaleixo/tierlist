import type { TierRoomState } from '../../hooks/useFirebaseRoom';
import type { PlayerColor } from '../../game/types';
import { PLAYER_COLOR_HEX } from '../../theme/theme';

export interface PlayerMeta {
  id: number;
  name: string;
  color: PlayerColor;
  colorHex: string;
}

export function buildPlayerMeta(roomState: TierRoomState): Record<number, PlayerMeta> {
  const meta: Record<number, PlayerMeta> = {};
  for (const slot of roomState.players) {
    if (slot.status === 'ready' && slot.data?.color) {
      meta[slot.id] = {
        id: slot.id,
        name: slot.name ?? `Player ${slot.id}`,
        color: slot.data.color,
        colorHex: PLAYER_COLOR_HEX[slot.data.color],
      };
    }
  }
  return meta;
}
