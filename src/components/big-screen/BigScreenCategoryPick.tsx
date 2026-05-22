import { Box, Container, Stack, Typography } from '@mui/material';
import type { GameState, Round } from '../../game/types';
import { allCategoriesSubmitted, assignerOf } from '../../game/lifecycle';
import PlayerColorDot from './PlayerColorDot';
import type { PlayerMeta } from './playerMeta';

interface Props {
  gameState: GameState;
  round: Round;
  meta: Record<number, PlayerMeta>;
}

export default function BigScreenCategoryPick({ gameState, round, meta }: Props) {
  const allIn = allCategoriesSubmitted(round);
  const submittedCount = Object.values(round.perPlayer).filter((p) => p.categoryAssigned !== null).length;
  const total = gameState.seating.length;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            ROUND {round.number} · PHASE 1
          </Typography>
          <Typography variant="h3" sx={{ color: 'primary.main', mt: 1 }}>
            PICK A CATEGORY
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.95rem' }}>
            Each player picks a category for the neighbour to their{' '}
            <strong>{round.passDirection.toUpperCase()}</strong>.
          </Typography>
        </Box>

        {!allIn && (
          <>
            <Stack spacing={1.5}>
              {gameState.seating.map((pid) => {
                const m = meta[pid];
                if (!m) return null;
                const picked = round.perPlayer[pid]?.categoryAssigned !== null;
                return (
                  <Box
                    key={pid}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: 3,
                      py: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '2px solid',
                      borderColor: picked ? m.colorHex : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <PlayerColorDot colorHex={m.colorHex} size={28} pulse={!picked} />
                    <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '1.2rem' }}>
                      {m.name}
                    </Typography>
                    <Typography
                      variant="overline"
                      sx={{ color: picked ? m.colorHex : 'text.secondary' }}
                    >
                      {picked ? 'READY' : 'PICKING…'}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
            <Typography variant="overline" color="text.secondary" sx={{ textAlign: 'center' }}>
              {submittedCount} / {total} PICKED
            </Typography>
          </>
        )}

        {allIn && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                color: 'primary.main',
                mb: 4,
                animation: 'blink 1s steps(2,end) infinite',
                '@keyframes blink': { '50%': { opacity: 0.25 } },
              }}
            >
              READY!
            </Typography>
            <Stack spacing={1.5} sx={{ maxWidth: 720, mx: 'auto' }}>
              {gameState.seating.map((pid) => {
                const m = meta[pid];
                if (!m) return null;
                const assignerId = assignerOf(gameState.seating, pid, round.passDirection);
                const category = round.perPlayer[assignerId]?.categoryAssigned;
                const assignerMeta = meta[assignerId];
                return (
                  <Box
                    key={pid}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: 3,
                      py: 2,
                      bgcolor: 'background.paper',
                      borderLeft: '4px solid',
                      borderColor: m.colorHex,
                    }}
                  >
                    <PlayerColorDot colorHex={m.colorHex} size={20} />
                    <Typography sx={{ fontWeight: 700, minWidth: 110 }}>{m.name}</Typography>
                    <Typography color="text.secondary">tiers</Typography>
                    <Typography sx={{ flex: 1, color: m.colorHex, fontWeight: 600 }}>
                      {category ? `${category.emoji} ${category.name}` : '—'}
                    </Typography>
                    <Typography variant="overline" color="text.secondary">
                      from {assignerMeta?.name ?? `P${assignerId}`}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
