import { Box, Container, Stack, Typography } from '@mui/material';
import type { GameState } from '../../game/types';
import FirePoints from '../FirePoints';
import PlayerColorDot from './PlayerColorDot';
import type { PlayerMeta } from './playerMeta';

interface Props {
  gameState: GameState;
  meta: Record<number, PlayerMeta>;
}

export default function BigScreenFinalScore({ gameState, meta }: Props) {
  const sorted = [...gameState.seating].sort(
    (a, b) => (gameState.hearts[b] ?? 0) - (gameState.hearts[a] ?? 0),
  );
  const topScore = gameState.hearts[sorted[0]] ?? 0;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              color: 'primary.main',
              animation: 'blink 1.2s steps(2,end) infinite',
              '@keyframes blink': { '50%': { opacity: 0.4 } },
            }}
          >
            GAME OVER
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {sorted.map((pid, idx) => {
            const m = meta[pid];
            if (!m) return null;
            const hearts = gameState.hearts[pid] ?? 0;
            const isWinner = hearts === topScore && topScore > 0;
            return (
              <Box
                key={pid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: isWinner ? m.colorHex : 'rgba(255,255,255,0.08)',
                  boxShadow: isWinner ? `0 0 24px ${m.colorHex}66` : 'none',
                }}
              >
                <Typography
                  sx={{
                    width: 36,
                    color: 'text.secondary',
                    fontFamily: '"Pixelify Sans", monospace',
                  }}
                >
                  {idx + 1}
                </Typography>
                <PlayerColorDot colorHex={m.colorHex} size={28} />
                <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '1.2rem' }}>{m.name}</Typography>
                <Typography
                  sx={{
                    color: 'error.main',
                    fontFamily: '"Pixelify Sans", monospace',
                    fontSize: '1rem',
                  }}
                >
                  <FirePoints points={hearts} invert size="1rem" />
                </Typography>
                {isWinner && (
                  <Typography
                    variant="overline"
                    sx={{
                      ml: 2,
                      color: m.colorHex,
                      fontFamily: '"Pixelify Sans", monospace',
                    }}
                  >
                    WIN
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}
