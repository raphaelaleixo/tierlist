import { Box, Typography } from '@mui/material';
import type { Play, Round } from '../../game/types';
import { writerOf } from '../../game/lifecycle';
import TierCard from '../TierCard';
import FirePoints from '../FirePoints';
import PlayerColorDot from './PlayerColorDot';
import type { PlayerMeta } from './playerMeta';

// One cell in the big-screen player grid (column 1). Top: the player's
// currently-played card (or a "thinking…" indicator when it's their turn).
// Below: name, colour dot, and 🔥 points.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const CARD_W = 152;

interface PlayerCellProps {
  pid: number;
  meta: PlayerMeta;
  round: Round;
  seating: number[];
  points: number;
  currentPlay: Play | undefined;
  isCurrentTurn: boolean;
  isWinnerOfTrick: boolean;
  hasPlayedCurrentTrick: boolean;
  allMeta: Record<number, PlayerMeta>;
}

export default function PlayerCell({
  pid,
  meta,
  round,
  seating,
  points,
  currentPlay,
  isCurrentTurn,
  isWinnerOfTrick,
  hasPlayedCurrentTrick,
  allMeta,
}: PlayerCellProps) {
  const card = currentPlay
    ? round.perPlayer[pid]?.hand?.find((c) => c.id === currentPlay.cardId)
    : undefined;
  const category = round.perPlayer[pid]?.categoryAssigned;
  const writerId = writerOf(seating, pid, round.passDirection);
  const writer = allMeta[writerId];
  // Reserved for future visual cues we may want from these props:
  void isWinnerOfTrick;
  void hasPlayedCurrentTrick;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
        width: CARD_W + 24,
        fontFamily: CARD_FONT,
        p: 1.75,
        border: '2px dashed rgba(255,255,255,0.14)',
        borderRadius: '16px',
      }}
    >
      {/* Top: played card OR thinking indicator (when their turn) OR blank slot */}
      {currentPlay && card && category && writer ? (
        <TierCard
          emoji={category.emoji}
          category={category.name}
          writerName={writer.name}
          holderColor={meta.color}
          item={card.item}
          tier={card.tier}
          revealed={currentPlay.revealed}
          width={CARD_W}
          variant="dark"
        />
      ) : (
        <SlotPlaceholder width={CARD_W} thinking={isCurrentTurn} colorHex={meta.colorHex} />
      )}

      {/* Info strip */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayerColorDot colorHex={meta.colorHex} size={14} pulse={isCurrentTurn} />
          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', fontFamily: CARD_FONT }}>
            {meta.name}
          </Typography>
        </Box>

        <FirePoints points={points} invert size="0.9rem" />
      </Box>
    </Box>
  );
}

function SlotPlaceholder({ width, thinking, colorHex }: { width: number; thinking: boolean; colorHex: string }) {
  return (
    <Box
      sx={{
        width,
        aspectRatio: '5/7',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {thinking && (
        <Typography
          sx={{
            fontFamily: CARD_FONT,
            fontSize: '1.1rem',
            color: colorHex,
            fontStyle: 'italic',
            animation: 'thinkPulse 1.1s ease-in-out infinite',
            '@keyframes thinkPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.45 },
            },
          }}
        >
          thinking…
        </Typography>
      )}
    </Box>
  );
}
