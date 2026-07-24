import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { TierRoomState } from '../hooks/useFirebaseRoom';
import type { GameState } from '../game/types';
import { buildPlayerMeta } from './big-screen/playerMeta';
import PhoneCategoryPick from './phone/PhoneCategoryPick';
import PhoneTierWriting from './phone/PhoneTierWriting';
import PhoneCardPlay from './phone/PhoneCardPlay';
import PhoneEndGame from './phone/PhoneEndGame';
import PhoneWaiting from './phone/PhoneWaiting';

interface Props {
  roomId: string;
  roomState: TierRoomState;
  gameState: GameState;
  myId: number;
}

export default function PhoneGame({ roomId, roomState, gameState, myId }: Props) {
  const meta = buildPlayerMeta(roomState);
  const me = meta[myId];

  if (!me) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">Your seat could not be found.</Typography>
      </Box>
    );
  }

  let body: React.ReactNode = null;

  if (gameState.phase === 'in-round') {
    const round = gameState.rounds[gameState.currentRoundIndex];
    if (!round) {
      body = <PhoneWaiting title="LOADING" />;
    } else {
      switch (round.phase) {
        case 'category-pick':
          body = <PhoneCategoryPick roomId={roomId} gameState={gameState} myId={myId} meta={meta} />;
          break;
        case 'tier-writing':
          body = <PhoneTierWriting roomId={roomId} gameState={gameState} myId={myId} meta={meta} />;
          break;
        case 'card-play':
          body = <PhoneCardPlay roomId={roomId} gameState={gameState} myId={myId} meta={meta} />;
          break;
        default:
          body = <PhoneWaiting />;
      }
    }
  } else if (gameState.phase === 'game-end-reveal' || gameState.phase === 'final-score') {
    body = <PhoneEndGame gameState={gameState} myId={myId} meta={meta} />;
  } else {
    body = <PhoneWaiting />;
  }

  // Phase key — changes whenever the visible body should swap. Drives the
  // PhonePhaseTransition orchestrator so each phase swap plays a
  // slide-up exit + slide-from-bottom enter on the body.
  const phaseKey = (() => {
    if (gameState.phase === 'game-end-reveal' || gameState.phase === 'final-score') {
      return 'end-game';
    }
    if (gameState.phase === 'in-round') {
      const round = gameState.rounds[gameState.currentRoundIndex];
      if (!round) return 'loading';
      return `r${round.number}-${round.phase}`;
    }
    return 'waiting';
  })();

  // PhoneGame is the phase body only — the AppHeader is now rendered by the
  // caller (PlayerPage via PlayerScreen's renderHeader; the mock above the
  // dev toolbar). We fill the parent as a flex:1 column so a phase's outer
  // `min-height: 100%` resolves against a definite height. Callers must
  // mount us inside a flex column with a definite height.
  return <PhonePhaseTransition phaseKey={phaseKey} body={body} />;
}

// Phone-side analogue of BigScreenGame's PhaseTransition. The phone has a
// single body (no row of cells), so the WHOLE body slides up as it exits
// and the new body slides in from below — no per-cell stagger needed.
// Sequential: incoming only mounts after outgoing finishes, matching the
// big-screen behaviour.
const PHONE_EXIT_MS = 380;
const PHONE_ENTER_MS = 440;

function PhonePhaseTransition({ phaseKey, body }: { phaseKey: string; body: ReactNode }) {
  const [outgoing, setOutgoing] = useState<{ key: string; body: ReactNode } | null>(null);
  const lastKeyRef = useRef(phaseKey);
  const lastBodyRef = useRef<ReactNode>(body);

  useLayoutEffect(() => {
    if (lastKeyRef.current !== phaseKey) {
      setOutgoing({ key: lastKeyRef.current, body: lastBodyRef.current });
      lastKeyRef.current = phaseKey;
    }
    lastBodyRef.current = body;
  }, [phaseKey, body]);

  useEffect(() => {
    if (!outgoing) return;
    const t = window.setTimeout(() => setOutgoing(null), PHONE_EXIT_MS + 60);
    return () => clearTimeout(t);
  }, [outgoing]);

  return (
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {outgoing ? (
        <Box
          key={outgoing.key}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
            animation: `phoneExit ${PHONE_EXIT_MS}ms cubic-bezier(0.5, 0, 0.75, 0) forwards`,
            '@keyframes phoneExit': {
              from: { transform: 'translateY(0)', opacity: 1 },
              to: { transform: 'translateY(-100%)', opacity: 0 },
            },
          }}
        >
          {outgoing.body}
        </Box>
      ) : (
        <Box
          key={phaseKey}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            animation: `phoneEnter ${PHONE_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) backwards`,
            '@keyframes phoneEnter': {
              from: { transform: 'translateY(100%)', opacity: 0 },
              to: { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          {body}
        </Box>
      )}
    </Box>
  );
}
