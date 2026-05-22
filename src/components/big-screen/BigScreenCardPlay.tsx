import { Box, Typography } from '@mui/material';
import type { GameState, Play, Round } from '../../game/types';
import { currentTurnPlayerId } from '../../game/lifecycle';
import LiveTierList from './LiveTierList';
import PlayerCell from './PlayerCell';
import type { PlayerMeta } from './playerMeta';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface Props {
  gameState: GameState;
  round: Round;
  meta: Record<number, PlayerMeta>;
}

// Player-grid row breakdown by player count:
//   3 → single row of 3
//   4 → 2 + 2
//   5 → 3 + 2
//   6 → 3 + 3
function playerGridRows(seating: number[]): number[][] {
  const n = seating.length;
  if (n <= 3) return [seating];
  if (n === 4) return [seating.slice(0, 2), seating.slice(2)];
  return [seating.slice(0, 3), seating.slice(3)];
}

export default function BigScreenCardPlay({ gameState, round, meta }: Props) {
  const trick = round.tricks[round.currentTrickIndex];
  const turnPlayerId = currentTurnPlayerId(gameState);
  const rows = playerGridRows(gameState.seating);

  const currentPlayByPlayer = new Map<number, Play>();
  for (const p of trick.plays) currentPlayByPlayer.set(p.playerId, p);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, md: 4 },
        py: 3,
        gap: 3,
        fontFamily: CARD_FONT,
      }}
    >
      {/* Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            ROUND {round.number} · PHASE 3
          </Typography>
          <Typography
            sx={{
              color: 'primary.main',
              fontFamily: CARD_FONT,
              fontSize: '2rem',
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            TRICK {round.currentTrickIndex + 1} / 5
          </Typography>
        </Box>
        {trick.fBeatsS && (
          <Box
            sx={{
              px: 3,
              py: 1.5,
              border: '3px solid',
              borderColor: 'error.main',
              borderRadius: 1,
              bgcolor: 'rgba(10,10,20,0.85)',
              animation: 'upset 0.5s ease-out',
              '@keyframes upset': {
                '0%': { transform: 'scale(0.85)', opacity: 0 },
                '60%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          >
            <Typography
              sx={{
                color: 'error.main',
                letterSpacing: 4,
                fontFamily: CARD_FONT,
                fontSize: '1.6rem',
                fontWeight: 900,
              }}
            >
              F-BOMB!
            </Typography>
            <Typography
              sx={{
                color: 'error.main',
                fontFamily: CARD_FONT,
                fontSize: '0.7rem',
                letterSpacing: 2,
                opacity: 0.85,
              }}
            >
              F BEATS S
            </Typography>
          </Box>
        )}
      </Box>

      {/* Two-column body */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          gap: 4,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
        }}
      >
        {/* Column 1: player grid */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 60%' },
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rows.map((row, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              {row.map((pid) => {
                const playerMeta = meta[pid];
                if (!playerMeta) return null;
                return (
                  <PlayerCell
                    key={pid}
                    pid={pid}
                    meta={playerMeta}
                    round={round}
                    seating={gameState.seating}
                    points={gameState.hearts[pid] ?? 0}
                    currentPlay={currentPlayByPlayer.get(pid)}
                    isCurrentTurn={turnPlayerId === pid}
                    isWinnerOfTrick={trick.winnerId === pid}
                    hasPlayedCurrentTrick={currentPlayByPlayer.has(pid)}
                    allMeta={meta}
                  />
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Column 2: live tier list */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 40%' },
            minWidth: 320,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <LiveTierList round={round} meta={meta} seating={gameState.seating} />
        </Box>
      </Box>
    </Box>
  );
}
