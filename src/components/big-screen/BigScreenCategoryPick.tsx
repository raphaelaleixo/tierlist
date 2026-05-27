import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import type { GameState, Round } from '../../game/types';
import { allCategoriesSubmitted } from '../../game/lifecycle';
import { pastelOnDark } from '../../utils/blob';
import PlayerSlot, { PlayerNameLine } from './PlayerSlot';
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
  const allReady = allCategoriesSubmitted(round);

  // Banner masks open from the middle, but only AFTER the cell darkening
  // has had a moment to play (so the phase transition reads as "cells dim
  // first, then banner reveals").
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

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
        {gameState.seating.map((pid) => {
          const m = meta[pid];
          if (!m) return null;
          const picked = round.perPlayer[pid]?.categoryAssigned !== null;
          return <PickCell key={pid} meta={m} picked={picked} />;
        })}
      </Box>

      {/* Full-width PICK A CATEGORY banner — masks open from the middle on
          mount, and masks closed again once everyone is ready (right before
          the phase transitions). */}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: '50%',
          transform: allReady
            ? 'translateY(calc(-50% - 100vh))'
            : 'translateY(-50%)',
          clipPath: open ? 'inset(0 0 0 0)' : 'inset(0 50% 0 50%)',
          transition:
            'clip-path 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 600ms cubic-bezier(0.5, 0, 0.75, 0)',
          bgcolor: 'rgba(15,15,22,0.92)',
          fontFamily: CARD_FONT,
          py: 4,
          px: 3,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2.5rem', md: '4rem' },
            textTransform: 'uppercase',
            lineHeight: 1,
            animation: 'pickPulse 700ms ease-in-out infinite alternate',
            '@keyframes pickPulse': {
              from: { color: '#ffce1c' },
              to: { color: '#fff5b0' },
            },
          }}
        >
          Pick a category
        </Box>
        <Box
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.2,
          }}
        >
          Each player picks a category for the neighbour to their{' '}
          <Box component="span" sx={{ fontWeight: 800 }}>LEFT</Box>.
        </Box>
      </Box>

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
}

function PickCell({ meta, picked }: CellProps) {
  return (
    <PlayerSlot
      meta={meta}
      ready={picked}
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
