import { Box, Typography } from '@mui/material';
import type { TierRoomState } from '../hooks/useFirebaseRoom';
import type { GameState } from '../game/types';
import { buildPlayerMeta } from './big-screen/playerMeta';
import PhoneHeader from './phone/PhoneHeader';
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
  let headerProps: { hearts?: number; category?: string | null } = {};

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
          {
            const myCat = round.perPlayer[myId]?.categoryAssigned;
            headerProps = {
              hearts: gameState.hearts[myId] ?? 0,
              category: myCat ? `${myCat.emoji} ${myCat.name}` : null,
            };
          }
          break;
        default:
          body = <PhoneWaiting />;
      }
    }
  } else if (gameState.phase === 'game-end-reveal' || gameState.phase === 'final-score') {
    body = <PhoneEndGame gameState={gameState} myId={myId} meta={meta} />;
    headerProps = { hearts: gameState.hearts[myId] ?? 0 };
  } else {
    body = <PhoneWaiting />;
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PhoneHeader me={me} roomId={roomState.roomId} {...headerProps} />
      {body}
    </Box>
  );
}
