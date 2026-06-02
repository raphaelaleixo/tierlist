import { Box } from '@mui/material';
import { TIERS, type GameState, type HandCard, type Round, type Tier } from '../../game/types';
import { pastelOnDark } from '../../utils/blob';
import OpenMojiIcon from '../OpenMojiIcon';
import type { PlayerMeta } from './playerMeta';

// Shown SECOND in the end-game flow: every tier list for every player across
// both rounds, with the mystery (unplayed) card highlighted. Layout is one
// column per player (1/N width, same geometry as the in-game player row) so
// the reveal sits inside the same visual language as card-play. The game
// ends here — no further CTA.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const TIER_COLORS: Record<Tier, string> = {
  S: '#ef3a3a',
  A: '#ff8c1c',
  B: '#ffce1c',
  C: '#3aaf4d',
  D: '#3a7aef',
  F: '#9a3aef',
};

interface Props {
  gameState: GameState;
  meta: Record<number, PlayerMeta>;
}

// Reconstruct a player's tier list (incl. the unplayed mystery card) from
// their hand snapshot for the given round.
function reconstructTierList(
  round: Round,
  playerId: number,
): Partial<Record<Tier, { item: string; mystery: boolean }>> {
  const out: Partial<Record<Tier, { item: string; mystery: boolean }>> = {};
  const hand = round.perPlayer[playerId]?.hand;
  if (!hand) return out;
  for (const card of hand as HandCard[]) {
    out[card.tier] = { item: card.item, mystery: !card.played };
  }
  return out;
}

export default function BigScreenEndReveal({ gameState, meta }: Props) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CARD_FONT,
      }}
    >
      {/* Title strip */}
      <Box
        sx={{
          textAlign: 'center',
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Box
          sx={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          The reveal
        </Box>
        <Box
          sx={{
            mt: 0.25,
            fontWeight: 900,
            fontSize: { xs: '1.4rem', md: '1.8rem' },
            lineHeight: 1,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Every tier list, mystery cards and all
        </Box>
      </Box>

      {/* Player columns — 1/N width, same row geometry as card-play. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'stretch',
          '& > *': {
            flex: `0 0 calc(100% / ${gameState.seating.length})`,
            maxWidth: `calc(100% / ${gameState.seating.length})`,
          },
        }}
      >
        {gameState.seating.map((pid) => {
          const m = meta[pid];
          if (!m) return null;
          return (
            <PlayerRevealColumn
              key={pid}
              meta={m}
              rounds={gameState.rounds}
              playerId={pid}
            />
          );
        })}
      </Box>
    </Box>
  );
}

interface ColumnProps {
  meta: PlayerMeta;
  rounds: GameState['rounds'];
  playerId: number;
}

function PlayerRevealColumn({ meta, rounds, playerId }: ColumnProps) {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5cqi',
        py: '2cqi',
        px: '1.5cqi',
        background: `linear-gradient(to bottom, ${pastelOnDark(meta.colorHex, 0.32)} 0%, ${pastelOnDark(meta.colorHex, 0.14)} 100%)`,
        // Container query lets the inner type / spacing scale with column
        // width — works for 3..6 players without manual breakpoints.
        containerType: 'inline-size',
      }}
    >
      {/* Player name header */}
      <Box
        sx={{
          textAlign: 'center',
          fontWeight: 900,
          fontSize: '9cqi',
          lineHeight: 1.05,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: meta.colorHex,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {meta.name}
      </Box>

      {/* Two rounds, stacked. Each: category title + tier rows. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '2cqi',
        }}
      >
        {rounds.map((round, i) => {
          if (!round) return null;
          const list = reconstructTierList(round, playerId);
          const category = round.perPlayer[playerId]?.categoryAssigned;
          return (
            <Box key={i} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Round + category */}
              <Box sx={{ textAlign: 'center', mb: '1cqi' }}>
                <Box
                  sx={{
                    fontSize: '3.5cqi',
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  Round {round.number}
                </Box>
                <Box
                  sx={{
                    mt: '0.5cqi',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.5cqi',
                  }}
                >
                  {category && (
                    <OpenMojiIcon
                      emoji={category.emoji}
                      variant="black"
                      invert
                      size="5cqi"
                    />
                  )}
                  <Box
                    sx={{
                      fontWeight: 900,
                      fontSize: '5cqi',
                      lineHeight: 1,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {category?.name ?? '—'}
                  </Box>
                </Box>
              </Box>

              {/* Six tier rows — S/A/B/C/D/F. Mystery (unplayed) cell glows. */}
              <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: '0.5cqi' }}>
                {TIERS.map((t) => {
                  const cell = list[t];
                  const tierBg = TIER_COLORS[t];
                  const isMystery = cell?.mystery ?? false;
                  return (
                    <Box
                      key={t}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        alignItems: 'center',
                        columnGap: '1.5cqi',
                        px: '1cqi',
                        borderRadius: '1cqi',
                        bgcolor: isMystery ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)',
                        border: isMystery ? `2px solid ${meta.colorHex}` : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: isMystery ? `0 0 16px ${meta.colorHex}88` : 'none',
                      }}
                    >
                      <Box
                        sx={{
                          width: '6cqi',
                          height: '6cqi',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '1cqi',
                          bgcolor: tierBg,
                          color: '#1a1a1a',
                          fontWeight: 900,
                          fontSize: '4cqi',
                        }}
                      >
                        {t}
                      </Box>
                      <Box
                        sx={{
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1cqi',
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            fontWeight: isMystery ? 900 : 600,
                            fontSize: '4cqi',
                            lineHeight: 1.1,
                            color: isMystery ? meta.colorHex : 'text.primary',
                            textTransform: 'uppercase',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cell?.item ?? '—'}
                        </Box>
                        {isMystery && (
                          <Box
                            sx={{
                              fontSize: '2.5cqi',
                              fontWeight: 700,
                              letterSpacing: 1.5,
                              textTransform: 'uppercase',
                              color: meta.colorHex,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            ★ Mystery
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
