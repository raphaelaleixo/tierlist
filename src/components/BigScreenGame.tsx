import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Container, Typography } from '@mui/material';
import type { TierRoomState } from '../hooks/useFirebaseRoom';
import { useGameStateDriver } from '../hooks/useGameStateDriver';
import type { GameState } from '../game/types';
import AppHeader from './AppHeader';
import BigScreenCategoryPick from './big-screen/BigScreenCategoryPick';
import BigScreenTierWriting from './big-screen/BigScreenTierWriting';
import BigScreenCardPlay from './big-screen/BigScreenCardPlay';
import BigScreenEndReveal from './big-screen/BigScreenEndReveal';
import { buildPlayerMeta } from './big-screen/playerMeta';
import { PhaseExitContext, PHASE_EXIT_TOTAL_MS } from './big-screen/phaseTransition';

interface Props {
  roomId: string;
  roomState: TierRoomState;
  gameState: GameState;
  /** When true, this client drives auto-transitions. Only the big screen should. */
  drive?: boolean;
  /** Mock-only: clicking a resolved trick will play the dismiss animation
   *  then invoke this callback (parent decides how to advance state). */
  onDismiss?: () => void;
}

export default function BigScreenGame({ roomId, roomState, gameState, drive = false, onDismiss }: Props) {
  useGameStateDriver(drive ? roomId : undefined, drive ? gameState : null);
  const meta = buildPlayerMeta(roomState);

  // Phase key — changes whenever the visible body should swap. Used as the
  // React key on the body wrapper so a phase change unmounts the old layout
  // and mounts a fresh one (with a fadeIn). Each phase's own PhaseIntroBanner
  // covers the swap with the title beat, so the visible effect is: banner
  // masks open with the new title → underneath, the new phase has faded
  // in → banner masks closed → new phase visible.
  const phaseKey = (() => {
    if (gameState.phase === 'game-end-reveal' || gameState.phase === 'final-score') {
      return 'end-game';
    }
    const round = gameState.rounds[gameState.currentRoundIndex];
    if (!round) return 'no-round';
    return `r${round.number}-${round.phase}`;
  })();

  const body = (() => {
    // The end-of-game screen shows both rankings (via the bottom 🔥 ×N slot
    // per player) and every tier list, so a single BigScreenEndReveal covers
    // both end-game phases.
    if (gameState.phase === 'game-end-reveal' || gameState.phase === 'final-score') {
      return <BigScreenEndReveal gameState={gameState} meta={meta} />;
    }
    const round = gameState.rounds[gameState.currentRoundIndex];
    if (!round) {
      return (
        <Container sx={{ py: 6 }}>
          <Typography color="text.secondary">No active round.</Typography>
        </Container>
      );
    }
    switch (round.phase) {
      case 'category-pick':
        return <BigScreenCategoryPick gameState={gameState} round={round} meta={meta} />;
      case 'tier-writing':
        return <BigScreenTierWriting gameState={gameState} round={round} meta={meta} />;
      case 'card-play':
        return (
          <BigScreenCardPlay
            gameState={gameState}
            round={round}
            meta={meta}
            onDismiss={onDismiss}
          />
        );
      case 'round-end':
        return (
          <Container sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: 'primary.main' }}>
              ROUND {round.number} COMPLETE
            </Typography>
          </Container>
        );
      default:
        return null;
    }
  })();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader roomCode={roomId} roomState={roomState} showFullscreen />
      <PhaseTransition phaseKey={phaseKey} body={body} />
    </Box>
  );
}

// Keeps the outgoing phase mounted (under PhaseExitContext = true) for
// PHASE_EXIT_TOTAL_MS so its player cells can play their staggered
// slide-to-top exit. The new phase fades in over the same window; the
// PhaseIntroBanner inside it covers the overlap.
function PhaseTransition({ phaseKey, body }: { phaseKey: string; body: ReactNode }) {
  const [outgoing, setOutgoing] = useState<{ key: string; body: ReactNode } | null>(null);
  const lastKeyRef = useRef(phaseKey);
  const lastBodyRef = useRef<ReactNode>(body);

  // Snapshot the previous body the moment phaseKey changes, before paint.
  // The setOutgoing call is gated by the lastKeyRef check, so the effect is
  // safe to run every render — the dep list is just the lint-required deps.
  useLayoutEffect(() => {
    if (lastKeyRef.current !== phaseKey) {
      setOutgoing({ key: lastKeyRef.current, body: lastBodyRef.current });
      lastKeyRef.current = phaseKey;
    }
    lastBodyRef.current = body;
  }, [phaseKey, body]);

  // Unmount the outgoing tree once the exit window has elapsed.
  useEffect(() => {
    if (!outgoing) return;
    const t = window.setTimeout(() => setOutgoing(null), PHASE_EXIT_TOTAL_MS);
    return () => clearTimeout(t);
  }, [outgoing]);

  // While the outgoing phase is still exiting, hide the incoming body from
  // sight so its banner / cell-cascade doesn't fire underneath the cells
  // that are sliding off-screen. The incoming body is still mounted (its
  // own banner timers / fade-in run their course), just visually hidden;
  // once outgoing unmounts we drop the cover and the incoming reveal plays
  // cleanly on its own.
  return (
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {outgoing && (
        <Box
          key={outgoing.key}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <PhaseExitContext.Provider value>{outgoing.body}</PhaseExitContext.Provider>
        </Box>
      )}
      {!outgoing && (
        <Box
          key={phaseKey}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            animation: 'phaseFadeIn 500ms ease-out both',
            '@keyframes phaseFadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          {body}
        </Box>
      )}
    </Box>
  );
}
