import { useContext, useEffect, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { pastelOnDark } from '../../utils/blob';
import { CELL_EXIT_DURATION_MS, PhaseExitContext } from './phaseTransition';
import type { PlayerMeta } from './playerMeta';

// Shared cell shell used by cat-pick, tier-writing, and card-play. All three
// screens share the same outer chrome:
//
//   - 1/6 of viewport width (set by the parent row's child selector)
//   - Full-height grid (1fr | auto | 1fr) so the middle slot stays centred
//   - Player-tinted vertical gradient
//   - A dark veil (::before) that fades out when `ready` becomes true,
//     animating from "thinking" → "done" smoothly
//   - `containerType: inline-size` so children can size in cqi
//
// The three row slots are provided as children via the `top`, `middle`, and
// `bottom` props. Card-play passes a card area for the middle; the picking
// phases leave it empty.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export interface PlayerSlotProps {
  meta: PlayerMeta;
  /** Drives the dark veil — true = bright (ready/submitted), false = dim. */
  ready: boolean;
  top: ReactNode;
  middle?: ReactNode;
  bottom: ReactNode;
  /** Extra content rendered as a sibling of the row slots (typically
   *  absolutely-positioned overlays — e.g. the WINNER banner on card-play). */
  children?: ReactNode;
  /** Staggered enter delay (ms). Cell slides up from below with this delay
   *  on mount so a row of cells cascades in. Used by the phase-transition
   *  effect — the banner masks open while cells settle into place. */
  enterDelayMs?: number;
}

// Enter / exit animations shared across all big-screen player cells.
// `backwards` fill on enter keeps the cell at the `from` state during the
// stagger delay so it doesn't flash visible early. `forwards` fill on exit
// holds the cell in the off-screen `to` state until it unmounts.
const CELL_ANIM_KEYFRAMES = {
  '@keyframes cellEnter': {
    from: { transform: 'translateY(60%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  '@keyframes cellExit': {
    from: { transform: 'translateY(0)', opacity: 1 },
    to: { transform: 'translateY(-110%)', opacity: 0 },
  },
} as const;

export default function PlayerSlot({ meta, ready, top, middle, bottom, children, enterDelayMs = 0 }: PlayerSlotProps) {
  const isExiting = useContext(PhaseExitContext);
  // Start each cell at "ready" on mount so a freshly entered phase visibly
  // animates the dark veil in (or out). Without this, switching from
  // cat-pick (all ready) to tier-writing (none submitted) would snap dark
  // instead of fading.
  const [displayReady, setDisplayReady] = useState(true);
  useEffect(() => {
    if (ready) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayReady(true);
      return;
    }
    setDisplayReady(true);
    const t = window.setTimeout(() => setDisplayReady(false), 30);
    return () => clearTimeout(t);
  }, [ready]);

  // Content (status / points / category subtitle) fades in on mount alongside
  // the veil so it doesn't pop into place suddenly.
  const [contentVisible, setContentVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setContentVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      sx={{
        minWidth: 0,
        height: '100%',
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: '1fr auto 1fr',
        gridTemplateColumns: '1fr',
        justifyItems: 'center',
        gap: '2cqi',
        fontFamily: CARD_FONT,
        py: '2cqi',
        px: '1.5cqi',
        background: `linear-gradient(to bottom, ${pastelOnDark(meta.colorHex, 0.35)} 0%, ${pastelOnDark(meta.colorHex, 0.18)} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)',
          opacity: displayReady ? 0 : 1,
          transition: 'opacity 500ms ease',
          pointerEvents: 'none',
        },
        containerType: 'inline-size',
        position: 'relative',
        animation: isExiting
          ? `cellExit ${CELL_EXIT_DURATION_MS}ms cubic-bezier(0.5, 0, 0.75, 0) forwards`
          : 'cellEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        animationDelay: `${enterDelayMs}ms`,
        ...CELL_ANIM_KEYFRAMES,
      }}
    >
      <Box sx={{ alignSelf: 'start', width: '100%' }}>{top}</Box>
      <Box sx={{ width: '100%' }}>{middle}</Box>
      <Box
        sx={{
          alignSelf: 'end',
          width: '100%',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 500ms ease',
        }}
      >
        {bottom}
      </Box>
      {children}
    </Box>
  );
}

// Standard player-name line — same look on every screen.
export function PlayerNameLine({ name }: { name: string }) {
  return (
    <Box
      sx={{
        fontWeight: 900,
        fontSize: '14cqi',
        textAlign: 'center',
        lineHeight: 1.1,
        textTransform: 'uppercase',
        color: 'text.primary',
        fontFamily: CARD_FONT,
      }}
    >
      {name}
    </Box>
  );
}
