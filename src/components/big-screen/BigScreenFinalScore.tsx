import { Box, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import type { GameState } from '../../game/types';
import { showTierReveal } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import { pastelOnDark } from '../../utils/blob';
import OpenMojiIcon from '../OpenMojiIcon';
import ShinyButton from '../ShinyButton';
import type { PlayerMeta } from './playerMeta';

// Shown FIRST in the end-game flow (after the last trick of round 2):
// rankings + winner spotlight, with a CTA that advances to the tier-list
// reveal (BigScreenEndReveal).

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface Props {
  gameState: GameState;
  meta: Record<number, PlayerMeta>;
}

export default function BigScreenFinalScore({ gameState, meta }: Props) {
  const { id: roomId } = useParams<{ id: string }>();

  const sorted = [...gameState.seating].sort(
    (a, b) => (gameState.hearts[b] ?? 0) - (gameState.hearts[a] ?? 0),
  );
  const topScore = gameState.hearts[sorted[0]] ?? 0;
  const winners = sorted.filter((pid) => (gameState.hearts[pid] ?? 0) === topScore && topScore > 0);
  const winnerId = winners.length === 1 ? winners[0] : null;
  const winner = winnerId !== null ? meta[winnerId] : null;
  const winnerHearts = winnerId !== null ? gameState.hearts[winnerId] ?? 0 : 0;
  const others = sorted.filter((pid) => pid !== winnerId);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CARD_FONT,
        // Subtle winner-tinted backdrop when there's a sole winner; otherwise
        // a neutral dark gradient. Keeps the page rooted to the player's
        // colour without competing with the spotlight card.
        background: winner
          ? `radial-gradient(ellipse at top, ${pastelOnDark(winner.colorHex, 0.18)} 0%, rgba(10,10,18,0) 60%)`
          : 'transparent',
      }}
    >
      {/* "GAME OVER" headline */}
      <Box sx={{ textAlign: 'center', pt: 5, px: 3 }}>
        <Box
          sx={{
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          The dust settles
        </Box>
        <Box
          sx={{
            mt: 1,
            fontWeight: 900,
            fontSize: { xs: '3rem', md: '5.5rem' },
            lineHeight: 1,
            letterSpacing: 6,
            textTransform: 'uppercase',
            animation: 'gameOverPulse 1.6s ease-in-out infinite alternate',
            '@keyframes gameOverPulse': {
              from: { color: '#fff' },
              to: { color: winner ? winner.colorHex : '#ffce1c' },
            },
          }}
        >
          Game Over
        </Box>
      </Box>

      {/* Spotlight + ranks */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          px: 3,
          py: 4,
        }}
      >
        {/* Winner spotlight (only when a single player tops the leaderboard).
            When there's a tie, the headline pulses neutral and everyone is
            listed in the rank stack — no single "winner" treatment. */}
        {winner && (
          <Box
            sx={{
              minWidth: { xs: '90%', md: 520 },
              maxWidth: 720,
              px: 4,
              py: 3.5,
              borderRadius: 3,
              background: `linear-gradient(to bottom, ${pastelOnDark(winner.colorHex, 0.45)} 0%, ${pastelOnDark(winner.colorHex, 0.22)} 100%)`,
              border: `2px solid ${winner.colorHex}`,
              boxShadow: `0 0 64px ${winner.colorHex}55, 0 18px 40px rgba(0,0,0,0.45)`,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              columnGap: 3,
            }}
          >
            <Box
              sx={{
                fontSize: '3.5rem',
                lineHeight: 1,
                filter: `drop-shadow(0 4px 12px ${winner.colorHex}cc)`,
              }}
            >
              <OpenMojiIcon emoji="🏆" variant="color" size="3.5rem" />
            </Box>
            <Box>
              <Box
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Winner
              </Box>
              <Box
                sx={{
                  mt: 0.5,
                  fontWeight: 900,
                  fontSize: { xs: '2.4rem', md: '3.4rem' },
                  lineHeight: 1,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: winner.colorHex,
                }}
              >
                {winner.name}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <OpenMojiIcon emoji="🔥" variant="color" size="2.5rem" />
              <Box
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.4rem', md: '3rem' },
                  lineHeight: 1,
                  color: 'text.primary',
                }}
              >
                ×{winnerHearts}
              </Box>
            </Box>
          </Box>
        )}

        {/* Rank list — everyone else (or everyone, in a tie). */}
        <Stack
          spacing={1.25}
          sx={{
            width: '100%',
            maxWidth: 720,
          }}
        >
          {others.map((pid) => {
            const m = meta[pid];
            if (!m) return null;
            const hearts = gameState.hearts[pid] ?? 0;
            const rank = sorted.indexOf(pid) + 1;
            const tiedForFirst = winnerId === null && hearts === topScore && topScore > 0;
            return (
              <Box
                key={pid}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  columnGap: 2.5,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  background: `linear-gradient(to right, ${pastelOnDark(m.colorHex, 0.28)} 0%, ${pastelOnDark(m.colorHex, 0.1)} 100%)`,
                  border: tiedForFirst
                    ? `2px solid ${m.colorHex}`
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: tiedForFirst ? `0 0 24px ${m.colorHex}55` : 'none',
                }}
              >
                <Box
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.4rem',
                    color: 'rgba(255,255,255,0.5)',
                    minWidth: '2.2rem',
                    textAlign: 'center',
                  }}
                >
                  #{rank}
                </Box>
                <Box
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.6rem',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: m.colorHex,
                  }}
                >
                  {m.name}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <OpenMojiIcon emoji="🔥" variant="color" size="1.4rem" />
                  <Box sx={{ fontWeight: 900, fontSize: '1.5rem' }}>×{hearts}</Box>
                </Box>
              </Box>
            );
          })}
        </Stack>

        {/* CTA — advances to the tier-list reveal. */}
        <Box sx={{ mt: 2 }}>
          <ShinyButton
            accent={winner?.colorHex ?? '#ffce1c'}
            variant="primary"
            onClick={() => {
              if (!roomId) return;
              void writeGameState(roomId, showTierReveal(gameState));
            }}
          >
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '1.1rem',
                letterSpacing: 3,
                px: 2,
              }}
            >
              See the tier lists
            </Box>
          </ShinyButton>
        </Box>
      </Box>
    </Box>
  );
}
