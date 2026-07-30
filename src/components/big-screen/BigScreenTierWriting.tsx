import { Box } from '@mui/material';
import type { GameState, Round } from '../../game/types';
import { pastelOnDark } from '../../utils/blob';
import PhaseIntroBanner from './PhaseIntroBanner';
import PlayerSlot, { PlayerNameLine } from './PlayerSlot';
import { CELL_STAGGER_MS } from './phaseTransition';
import type { PlayerMeta } from './playerMeta';

// Phase 2: each player writes the tier list for the category their neighbour
// picked. Layout matches the cat-pick screen: 1/6-width player cells with a
// floating central banner. When all submissions are in, the banner slides up
// to clear the way for card-play.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const SLOTS = 6;

interface Props {
  gameState: GameState;
  round: Round;
  meta: Record<number, PlayerMeta>;
}

export default function BigScreenTierWriting({ gameState, round, meta }: Props) {
  const total = gameState.seating.length;
  const readyCount = gameState.seating.filter(
    (pid) => round.perPlayer[pid]?.tierListWritten !== null,
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
          const submitted = round.perPlayer[pid]?.tierListWritten !== null;
          return <WriteCell key={pid} meta={m} submitted={submitted} cellIndex={idx} />;
        })}
      </Box>

      <PhaseIntroBanner
        title="Fill the tier list"
        subtitle="Rank your own favourites in the category your neighbour picked for you."
      />

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
  submitted: boolean;
  cellIndex: number;
}

function WriteCell({ meta, submitted, cellIndex }: CellProps) {
  return (
    <PlayerSlot
      meta={meta}
      ready={submitted}
      enterDelayMs={cellIndex * CELL_STAGGER_MS}
      top={<PlayerNameLine name={meta.name} />}
      bottom={<StatusLine ready={submitted} colorHex={meta.colorHex} label={submitted ? 'Done' : 'Writing'} />}
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
              animation: 'writeThink 1.1s ease-in-out infinite',
              '@keyframes writeThink': {
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
