import { Box, Container, Stack, Typography } from '@mui/material';
import type { GameState } from '../../game/types';
import FirePoints from '../FirePoints';
import type { PlayerMeta } from '../big-screen/playerMeta';

interface Props {
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

export default function PhoneEndGame({ gameState, myId, meta }: Props) {
  const me = meta[myId];
  const myHearts = gameState.hearts[myId] ?? 0;
  const topScore = Math.max(...Object.values(gameState.hearts));
  const isWinner = myHearts === topScore && myHearts > 0;

  return (
    <Container maxWidth="xs" sx={{ py: 5, textAlign: 'center' }}>
      <Stack spacing={3}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            animation: gameState.phase === 'final-score' ? 'none' : 'blink 1s steps(2,end) infinite',
            '@keyframes blink': { '50%': { opacity: 0.3 } },
          }}
        >
          {gameState.phase === 'final-score' ? 'FINAL SCORE' : 'REVEAL'}
        </Typography>
        <Typography variant="h4" sx={{ color: me?.colorHex }}>
          {isWinner ? 'YOU WIN!' : 'GAME OVER'}
        </Typography>
        <Box>
          <Typography
            sx={{  color: 'error.main', fontSize: '1.6rem' }}
          >
            <FirePoints points={myHearts} invert size="1.2rem" />
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {myHearts === 1 ? '1 heart won' : `${myHearts} hearts won`}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Look at the big screen.
        </Typography>
      </Stack>
    </Container>
  );
}
