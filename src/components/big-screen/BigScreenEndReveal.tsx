import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { TIERS, type GameState, type HandCard, type Round, type Tier } from '../../game/types';
import { showFinalScore } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import type { PlayerMeta } from './playerMeta';
import PlayerColorDot from './PlayerColorDot';

interface Props {
  gameState: GameState;
  meta: Record<number, PlayerMeta>;
}

// Reconstruct the full tier list (including the mystery card) for a player in a given round.
// The hand was authored by writerOf(playerId), so we read items from the hand and pair by tier.
function reconstructTierListFromHand(round: Round, playerId: number): Partial<Record<Tier, { item: string; played: boolean; mystery: boolean }>> {
  const out: Partial<Record<Tier, { item: string; played: boolean; mystery: boolean }>> = {};
  const hand = round.perPlayer[playerId]?.hand;
  if (!hand) return out;
  for (const card of hand as HandCard[]) {
    out[card.tier] = { item: card.item, played: card.played, mystery: !card.played };
  }
  return out;
}

export default function BigScreenEndReveal({ gameState, meta }: Props) {
  const { id: roomId } = useParams<{ id: string }>();

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            GAME OVER
          </Typography>
          <Typography variant="h3" sx={{ color: 'primary.main', mt: 1 }}>
            THE REVEAL
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Every tier list, both rounds — including the unplayed mystery card.
          </Typography>
        </Box>

        <Stack spacing={3}>
          {gameState.seating.map((pid) => {
            const m = meta[pid];
            if (!m) return null;
            return (
              <Box
                key={pid}
                sx={{
                  p: 3,
                  bgcolor: 'background.paper',
                  borderLeft: '6px solid',
                  borderColor: m.colorHex,
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <PlayerColorDot colorHex={m.colorHex} size={28} />
                  <Typography variant="h5" sx={{ color: m.colorHex }}>
                    {m.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {gameState.rounds.map((round, ri) => {
                    if (!round) return null;
                    const list = reconstructTierListFromHand(round, pid);
                    const category = round.perPlayer[pid]?.categoryAssigned;
                    return (
                      <Box key={ri} sx={{ minWidth: 260 }}>
                        <Typography variant="overline" color="text.secondary">
                          ROUND {round.number} · {category ? `${category.emoji} ${category.name}` : '—'}
                        </Typography>
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {TIERS.map((t) => {
                            const cell = list[t];
                            return (
                              <Box
                                key={t}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  p: 1,
                                  bgcolor: cell?.mystery ? `${m.colorHex}33` : 'transparent',
                                  border: cell?.mystery ? `1px dashed ${m.colorHex}` : '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 0.5,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontFamily: '"Pixelify Sans", monospace',
                                    fontSize: '1rem',
                                    color: m.colorHex,
                                    width: 24,
                                    textAlign: 'center',
                                  }}
                                >
                                  {t}
                                </Typography>
                                <Typography sx={{ flex: 1, fontWeight: cell?.mystery ? 700 : 400 }}>
                                  {cell?.item ?? '—'}
                                </Typography>
                                {cell?.mystery && (
                                  <Typography variant="overline" sx={{ color: m.colorHex }}>
                                    MYSTERY
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => roomId && void writeGameState(roomId, showFinalScore(gameState))}
          >
            SEE FINAL SCORE
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
