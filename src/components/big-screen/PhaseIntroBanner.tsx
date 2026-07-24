import { useContext, useEffect, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { PhaseExitContext } from './phaseTransition';

// Reusable big-screen phase-intro banner. Pattern (extracted from the
// original BigScreenCategoryPick banner):
//
//   t+0       — banner is mounted, fully masked (clip-path closed); not yet
//               visible. Lets the underlying phase fade in unobscured.
//   +openDelay  banner opens via clip-path → covers the screen centre-out.
//   +hold      title beat — pulse, sit, breathe.
//   +closeMs   banner closes again (clip-path collapses to centre) revealing
//               whatever the phase is rendering underneath.
//
// Each phase mounts one of these with its own title. The animation cleans
// up automatically when the phase unmounts (timers cleared in the effect
// teardown).

interface Props {
  title: string;
  subtitle?: ReactNode;
  /** Color the title pulses to / from. Defaults to a gold (#ffce1c). */
  accentColor?: string;
  /** Milliseconds to wait after mount before the banner masks open. */
  openDelayMs?: number;
  /** Milliseconds the banner stays fully open before masking closed. */
  holdMs?: number;
}

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export default function PhaseIntroBanner({
  title,
  subtitle,
  accentColor = '#ffce1c',
  openDelayMs = 200,
  holdMs = 1500,
}: Props) {
  // When the banner is rendered inside an outgoing-phase tree (the
  // PhaseTransition orchestrator wraps the snapshotted body in
  // PhaseExitContext.Provider), the player cells play their slide-to-top
  // exit. We don't want this banner to re-run its intro for the OLD phase
  // while the new phase's banner is queued up — render nothing.
  const isExitingHost = useContext(PhaseExitContext);

  // 'pre' → fully masked (invisible).
  // 'open' → fully revealed (covers centre band of the screen).
  // 'closed' → masked again; banner is now invisible and behind interaction.
  const [stage, setStage] = useState<'pre' | 'open' | 'closed'>('pre');

  useEffect(() => {
    if (isExitingHost) return;
    const openT = window.setTimeout(() => setStage('open'), openDelayMs);
    const closeT = window.setTimeout(() => setStage('closed'), openDelayMs + holdMs);
    return () => {
      clearTimeout(openT);
      clearTimeout(closeT);
    };
  }, [openDelayMs, holdMs, isExitingHost]);

  if (isExitingHost) return null;

  const isOpen = stage === 'open';

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        // Open: full reveal. Pre / Closed: collapsed at the centre so the
        // banner takes no visible width.
        clipPath: isOpen ? 'inset(0 0 0 0)' : 'inset(0 50% 0 50%)',
        transition: 'clip-path 500ms cubic-bezier(0.22, 1, 0.36, 1)',
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
        zIndex: 50,
      }}
    >
      <Box
        sx={{
          fontWeight: 900,
          fontSize: { xs: '2.5rem', md: '4rem' },
          textTransform: 'uppercase',
          lineHeight: 1,
          animation: 'phaseIntroPulse 700ms ease-in-out infinite alternate',
          '@keyframes phaseIntroPulse': {
            from: { color: accentColor },
            to: { color: '#fff5b0' },
          },
        }}
      >
        {title}
      </Box>
      {subtitle && (
        <Box
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.2,
          }}
        >
          {subtitle}
        </Box>
      )}
    </Box>
  );
}
