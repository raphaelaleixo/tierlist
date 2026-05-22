import { Container, Typography } from '@mui/material';
import type { TierRoomState } from '../hooks/useFirebaseRoom';
import { useGameStateDriver } from '../hooks/useGameStateDriver';
import type { GameState } from '../game/types';
import BigScreenCategoryPick from './big-screen/BigScreenCategoryPick';
import BigScreenTierWriting from './big-screen/BigScreenTierWriting';
import BigScreenCardPlay from './big-screen/BigScreenCardPlay';
import BigScreenEndReveal from './big-screen/BigScreenEndReveal';
import BigScreenFinalScore from './big-screen/BigScreenFinalScore';
import { buildPlayerMeta } from './big-screen/playerMeta';

interface Props {
  roomId: string;
  roomState: TierRoomState;
  gameState: GameState;
  /** When true, this client drives auto-transitions. Only the big screen should. */
  drive?: boolean;
}

export default function BigScreenGame({ roomId, roomState, gameState, drive = false }: Props) {
  useGameStateDriver(drive ? roomId : undefined, drive ? gameState : null);
  const meta = buildPlayerMeta(roomState);

  if (gameState.phase === 'game-end-reveal') {
    return <BigScreenEndReveal gameState={gameState} meta={meta} />;
  }
  if (gameState.phase === 'final-score') {
    return <BigScreenFinalScore gameState={gameState} meta={meta} />;
  }

  // phase === 'in-round'
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
      return <BigScreenCardPlay gameState={gameState} round={round} meta={meta} />;
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
}
