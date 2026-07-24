import { Box } from '@mui/material';
import type { GameState, Round } from '../../game/types';
import { pastelOnDark } from '../../utils/blob';
import PhaseIntroBanner from './PhaseIntroBanner';
import PlayerSlot, { PlayerNameLine } from './PlayerSlot';
import { CELL_STAGGER_MS } from './phaseTransition';
import type { PlayerMeta } from './playerMeta';

// Phase 1: each player picks a category for the neighbour on their LEFT
// (that neighbour will eventually be the one writing tier lists for this
// player's category). Layout matches the card-play row: 1/6-width cells with
// the player's colour tint. No card yet; just name on top, status on bottom,
// and a central "PICK A CATEGORY" overlay floating over the row.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const SLOTS = 6;

interface Props {
  gameState: GameState;
  round: Round;
  meta: Record<number, PlayerMeta>;
}

export default function BigScreenCategoryPick({ gameState, round, meta }: Props) {
  const total = gameState.seating.length;
  const readyCount = gameState.seating.filter(
    (pid) => round.perPlayer[pid]?.categoryAssigned !== null,
  ).length;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CARD_FONT,
        position: 'relative',
      }}
    >
      {/* Player row */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          minHeight: 0,
          '& > *': {
            flex: `0 0 calc(100% / ${SLOTS})`,
            maxWidth: `calc(100% / ${SLOTS})`,
          },
        }}
      >
        {gameState.seating.map((pid, idx) => {
          const m = meta[pid];
          if (!m) return null;
          const picked = round.perPlayer[pid]?.categoryAssigned !== null;
          return <PickCell key={pid} meta={m} picked={picked} cellIndex={idx} />;
        })}
      </Box>

      <PhaseIntroBanner
        title="Pick a category"
        subtitle={
          <>
            Each player picks a category for the neighbour to their{' '}
            <Box component="span" sx={{ fontWeight: 800 }}>LEFT</Box>.
          </>
        }
      />

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          px: 2,
          py: 1,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'text.primary',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {readyCount} / {total} players ready
      </Box>
    </Box>
  );
}

interface CellProps {
  meta: PlayerMeta;
  picked: boolean;
  cellIndex: number;
}

function PickCell({ meta, picked, cellIndex }: CellProps) {
  return (
    <PlayerSlot
      meta={meta}
      ready={picked}
      enterDelayMs={cellIndex * CELL_STAGGER_MS}
      top={<PlayerNameLine name={meta.name} />}
      bottom={<StatusLine ready={picked} colorHex={meta.colorHex} label={picked ? 'Ready' : 'Thinking'} />}
    />
  );
}

function StatusLine({ ready, colorHex, label }: { ready: boolean; colorHex: string; label: string }) {
  return (
    <Box
      sx={{
        height: '22cqi',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: CARD_FONT,
        fontWeight: 900,
        fontSize: '11cqi',
        color: ready ? colorHex : pastelOnDark(colorHex, 0.6),
        textTransform: 'uppercase',
        ...(ready
          ? {}
          : {
              animation: 'pickThink 1.1s ease-in-out infinite',
              '@keyframes pickThink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.45 },
              },
            }),
      }}
    >
      {label}
    </Box>
  );
}
