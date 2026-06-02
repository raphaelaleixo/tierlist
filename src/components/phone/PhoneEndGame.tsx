import { Box, Container, Stack } from '@mui/material';
import type { GameState } from '../../game/types';
import { pastelOnDark } from '../../utils/blob';
import OpenMojiIcon from '../OpenMojiIcon';
import type { PlayerMeta } from '../big-screen/playerMeta';

// Phone view for both end-game phases. The flow is:
//   1. 'final-score'      — rankings on the big screen; the phone shows the
//                           player their result (win / lose, fire-point count).
//   2. 'game-end-reveal'  — every tier list on the big screen; the phone is
//                           passive ("look at the big screen") with the
//                           player's hearts still visible for context.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface Props {
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

export default function PhoneEndGame({ gameState, myId, meta }: Props) {
  const me = meta[myId];
  const myColor = me?.colorHex ?? '#888';
  const myHearts = gameState.hearts[myId] ?? 0;
  const topScore = Math.max(0, ...Object.values(gameState.hearts));
  const isWinner = myHearts === topScore && myHearts > 0;
  const reveal = gameState.phase === 'game-end-reveal';

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: `linear-gradient(to bottom, ${pastelOnDark(myColor, 0.35)} 0%, ${pastelOnDark(myColor, 0.12)} 100%)`,
        fontFamily: CARD_FONT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth="xs"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Stack spacing={2.5} sx={{ alignItems: 'center', width: '100%' }}>
          {/* Phase label */}
          <Box
            sx={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {reveal ? 'The reveal' : 'Final score'}
          </Box>

          {/* Headline */}
          <Box
            sx={{
              fontWeight: 900,
              fontSize: '2.6rem',
              lineHeight: 1,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: isWinner ? myColor : 'text.primary',
              ...(isWinner && !reveal && {
                animation: 'winPulse 1.4s ease-in-out infinite alternate',
                '@keyframes winPulse': {
                  from: { color: myColor },
                  to: { color: '#fff' },
                },
              }),
            }}
          >
            {isWinner ? 'You win!' : 'Game over'}
          </Box>

          {/* Hearts */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2.5,
              py: 1.25,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <OpenMojiIcon emoji="🔥" variant="color" size="1.6rem" />
            <Box sx={{ fontWeight: 900, fontSize: '1.6rem', lineHeight: 1 }}>×{myHearts}</Box>
            <Box
              sx={{
                ml: 1,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {myHearts === 1 ? 'point' : 'points'}
            </Box>
          </Box>

          {/* Watch hint */}
          <Box
            sx={{
              mt: 1.5,
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {reveal ? 'Look at the big screen' : 'See the standings on the big screen'}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
