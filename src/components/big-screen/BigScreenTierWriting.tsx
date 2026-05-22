import { Box, Container, Stack, Typography } from '@mui/material';
import type { GameState, Round } from '../../game/types';
import { allTierListsSubmitted, assignerOf, writerOf } from '../../game/lifecycle';
import PlayerColorDot from './PlayerColorDot';
import type { PlayerMeta } from './playerMeta';

interface Props {
  gameState: GameState;
  round: Round;
  meta: Record<number, PlayerMeta>;
}

export default function BigScreenTierWriting({ gameState, round, meta }: Props) {
  const submittedCount = Object.values(round.perPlayer).filter((p) => p.tierListWritten !== null).length;
  const total = gameState.seating.length;
  const allIn = allTierListsSubmitted(round);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            ROUND {round.number} · PHASE 2
          </Typography>
          <Typography variant="h3" sx={{ color: 'primary.main', mt: 1 }}>
            TIER WRITING
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.95rem' }}>
            Write a tier list in the category your neighbour picked for you.
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ maxWidth: 720, mx: 'auto', width: '100%' }}>
          {gameState.seating.map((pid) => {
            const m = meta[pid];
            if (!m) return null;
            // The player who is *writing* a list = the recipient of someone's category.
            // For display "X is writing about Y (for Z)":
            //   Z = the assigner who picked the category for X = assignerOf(X)
            //   Y = perPlayer[Z].categoryAssigned
            //   The list will later go to Z as their hand.
            const assignerId = assignerOf(gameState.seating, pid, round.passDirection);
            const category = round.perPlayer[assignerId]?.categoryAssigned;
            const recipientId = writerOf(gameState.seating, pid, round.passDirection);
            const recipientMeta = meta[recipientId];
            const submitted = round.perPlayer[pid]?.tierListWritten !== null;
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
                  borderLeft: '4px solid',
                  borderColor: submitted ? m.colorHex : 'rgba(255,255,255,0.08)',
                  opacity: submitted ? 0.7 : 1,
                }}
              >
                <PlayerColorDot colorHex={m.colorHex} size={24} pulse={!submitted} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    tiering{' '}
                    <strong style={{ color: m.colorHex }}>
                      {category ? `${category.emoji} ${category.name}` : '—'}
                    </strong>{' '}
                    for {recipientMeta?.name ?? `P${recipientId}`}
                  </Typography>
                </Box>
                <Typography variant="overline" sx={{ color: submitted ? m.colorHex : 'text.secondary' }}>
                  {submitted ? 'SUBMITTED' : 'WRITING…'}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Typography variant="overline" color="text.secondary" sx={{ textAlign: 'center' }}>
          {submittedCount} / {total} SUBMITTED
        </Typography>

        {allIn && (
          <Typography
            variant="h5"
            sx={{
              color: 'primary.main',
              textAlign: 'center',
              animation: 'blink 0.6s steps(2,end) infinite',
              '@keyframes blink': { '50%': { opacity: 0.25 } },
            }}
          >
            DEALING…
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
