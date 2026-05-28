import { Box, Typography } from '@mui/material';
import type { TierRoomState } from '../hooks/useFirebaseRoom';
import type { GameState } from '../game/types';
import { buildPlayerMeta } from './big-screen/playerMeta';
import AppHeader from './AppHeader';
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

  return (
    <Box
      sx={{
        // CSS Grid makes the layout much easier to reason about:
        //   • row 1 = AppHeader (auto height)
        //   • row 2 = body wrapper (1fr — exact remaining space)
        // Row 2 has a DEFINITE height that percentages can resolve against,
        // so a phase's outer Box can use `min-height: 100%` and actually
        // get "container minus header". When phase content overflows, row 2
        // grows past its 1fr basis (default `min-content: auto`) and the
        // page scrolls — no manual header-height math needed.
        //
        // The OUTER's `min-height: 100%` defers viewport sizing to whichever
        // wrapper mounts PhoneGame. In production PlayerPage wraps it in a
        // 100dvh Box; the mock wraps it in a flex-grow Box so the dev
        // toolbar gets its space first.
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        minHeight: '100%',
      }}
    >
      <AppHeader roomCode={roomState.roomId} roomState={roomState} />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {body}
      </Box>
    </Box>
  );
}
