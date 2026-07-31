import { Box } from '@mui/material';
import { useContext } from 'react';
import { TIERS, type GameState, type HandCard, type Round, type Tier } from '../../game/types';
import { writerOf } from '../../game/lifecycle';
import { pastelOnDark } from '../../utils/blob';
import OpenMojiIcon from '../OpenMojiIcon';
import PhaseIntroBanner from './PhaseIntroBanner';
import { CELL_EXIT_DURATION_MS, CELL_STAGGER_MS, PhaseExitContext } from './phaseTransition';
import type { PlayerMeta } from './playerMeta';
import { TIER_COLORS } from '../../theme/theme';

// Shown SECOND in the end-game flow: every tier list for every player across
// both rounds, with the mystery (unplayed) card highlighted. Layout is one
// column per player (1/N width, same geometry as the in-game player row) so
// the reveal sits inside the same visual language as card-play. The game
// ends here — no further CTA.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

// Match the in-game row geometry exactly: cells are always 1/6 of the row
// width and the row is centred, so with fewer than 6 players the cells stay
// the same size and the surplus space falls to the sides (same as
// card-play / tier-writing).
const SLOTS = 6;

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

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

// Rank players by hearts (desc). Ties share the same rank (competition
// ranking: 1, 2, 2, 4). A player with 0 hearts is ranked but isn't a winner.
function buildRanks(
  seating: number[],
  hearts: Record<number, number>,
): { ranks: Map<number, number>; topScore: number } {
  const sorted = [...seating].sort((a, b) => (hearts[b] ?? 0) - (hearts[a] ?? 0));
  const ranks = new Map<number, number>();
  let currentRank = 0;
  let prevHearts: number | null = null;
  sorted.forEach((pid, idx) => {
    const h = hearts[pid] ?? 0;
    if (h !== prevHearts) {
      currentRank = idx + 1;
      prevHearts = h;
    }
    ranks.set(pid, currentRank);
  });
  return { ranks, topScore: hearts[sorted[0]] ?? 0 };
}

export default function BigScreenEndReveal({ gameState, meta }: Props) {
  const { ranks, topScore } = buildRanks(gameState.seating, gameState.hearts);

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
      {/* Player columns — 1/6 width and centred, same row geometry as
          card-play / tier-writing. Cells stay the same size for 3..6 players. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          '& > *': {
            flex: `0 0 calc(100% / ${SLOTS})`,
            maxWidth: `calc(100% / ${SLOTS})`,
          },
        }}
      >
        {gameState.seating.map((pid, idx) => {
          const m = meta[pid];
          if (!m) return null;
          const hearts = gameState.hearts[pid] ?? 0;
          return (
            <PlayerRevealColumn
              key={pid}
              meta={m}
              allMeta={meta}
              rounds={gameState.rounds}
              seating={gameState.seating}
              playerId={pid}
              hearts={hearts}
              rank={ranks.get(pid) ?? 0}
              isWinner={hearts === topScore && topScore > 0}
              enterDelayMs={idx * CELL_STAGGER_MS}
            />
          );
        })}
      </Box>

      {/* Footer strip — same shape as the card-play "Round X / Trick Y"
          footer, just labelled GAME OVER. */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          px: 2,
          py: 1,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontFamily: CARD_FONT,
          color: 'text.primary',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Game over
      </Box>

      <PhaseIntroBanner
        title="Game over"
        subtitle="The dust settles. The lists reveal."
      />
    </Box>
  );
}

interface ColumnProps {
  meta: PlayerMeta;
  allMeta: Record<number, PlayerMeta>;
  rounds: GameState['rounds'];
  seating: number[];
  playerId: number;
  hearts: number;
  rank: number;
  isWinner: boolean;
  enterDelayMs: number;
}

function PlayerRevealColumn({ meta, allMeta, rounds, seating, playerId, hearts, rank, isWinner, enterDelayMs }: ColumnProps) {
  const isExiting = useContext(PhaseExitContext);
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        // Distribute name / round 1 / round 2 / points across the full column
        // height (space-between) so the two rounds spread out rather than
        // clustering in the centre.
        justifyContent: 'space-between',
        py: '2cqi',
        px: '1.5cqi',
        background: `linear-gradient(to bottom, ${pastelOnDark(meta.colorHex, 0.35)} 0%, ${pastelOnDark(meta.colorHex, 0.18)} 100%)`,
        // Container query lets the inner type / spacing scale with column
        // width — works for 3..6 players without manual breakpoints.
        containerType: 'inline-size',
        position: 'relative',
        // Enter / exit cascade + (winner-only) ongoing brightness pulse,
        // combined as a comma-separated animation list so the winner column
        // still plays its slide-in instead of being overwritten.
        animation: isExiting
          ? `cellExit ${CELL_EXIT_DURATION_MS}ms cubic-bezier(0.5, 0, 0.75, 0) forwards`
          : isWinner
            ? 'cellEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) backwards, winnerPulse 1.6s ease-in-out infinite alternate'
            : 'cellEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        // Per-animation delay list: cellEnter respects its stagger; the
        // winner pulse starts at the same time as the slide-in so it's
        // already breathing when the column settles.
        animationDelay: isWinner && !isExiting ? `${enterDelayMs}ms, ${enterDelayMs}ms` : `${enterDelayMs}ms`,
        '@keyframes cellEnter': {
          from: { transform: 'translateY(60%)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        '@keyframes cellExit': {
          from: { transform: 'translateY(0)', opacity: 1 },
          to: { transform: 'translateY(-110%)', opacity: 0 },
        },
        // Winner column smoothly pulses the entire cell between its resting
        // state and a brighter, more saturated mix of the same player
        // colour. `filter` interpolates smoothly across browsers (unlike
        // background-gradient keyframes which most engines snap), and
        // brightness + saturate pulses the whole cell as one unit. The
        // animation itself is wired into the comma-separated list above so
        // it can co-exist with cellEnter.
        ...(isWinner && {
          '@keyframes winnerPulse': {
            from: { filter: 'brightness(1) saturate(1)' },
            to: { filter: 'brightness(1.5) saturate(1.35)' },
          },
        }),
      }}
    >
      {/* Player name + final position. Position uses an ordinal ("1st",
          "2nd", …) tinted with the player's pastel colour. */}
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            fontWeight: 900,
            fontSize: '14cqi',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            color: 'text.primary',
          }}
        >
          {meta.name}
        </Box>
        <Box
          sx={{
            mt: '0.5cqi',
            fontWeight: 800,
            fontSize: '7cqi',
            lineHeight: 1,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: `color-mix(in srgb, ${meta.colorHex} 60%, white)`,
          }}
        >
          {ordinal(rank)}
        </Box>
      </Box>

      {/* Two rounds rendered as direct children of the column, so they
          distribute together with the name and points via the column's
          space-between. */}
      {rounds.map((round, i) => {
          if (!round) return null;
          const list = reconstructTierList(round, playerId);
          // The hand was authored by the player's pass-direction writer, so
          // the items belong to the WRITER's category — not the column
          // player's own `categoryAssigned`.
          const writerId = writerOf(seating, playerId, round.passDirection);
          const category = round.perPlayer[writerId]?.categoryAssigned;
          const writer = allMeta[writerId];
          return (
            <Box
              key={i}
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Category — round number is gone, the emoji + name carry
                  the round identity on their own. Uses the same grid
                  geometry as a tier row so the icon lines up with the badge
                  column and the name lines up with the item text column.
                  Fixed height so categories with 1-line vs 2-line names
                  don't misalign the tier lists across columns. */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  // Bottom-align the category to its fixed-height box so it sits
                  // close to the tier list while staying aligned across columns
                  // (1-line vs 2-line category names).
                  alignItems: 'end',
                  columnGap: '4cqi',
                  mb: '1.5cqi',
                  height: '22cqi',
                }}
              >
                <Box
                  sx={{
                    width: '12cqi',
                    height: '12cqi',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {category && (
                    <OpenMojiIcon
                      emoji={category.emoji}
                      variant="black"
                      tint={`color-mix(in srgb, ${meta.colorHex} 60%, white)`}
                      size="12cqi"
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    fontWeight: 900,
                    fontSize: '9cqi',
                    lineHeight: 1.05,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: `color-mix(in srgb, ${meta.colorHex} 60%, white)`,
                    // Clamp at 2 lines so the fixed height always holds.
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {category?.name ?? '—'}
                </Box>
              </Box>

              {/* Six tier rows — S/A/B/C/D/F. Every row looks the same; the
                  unplayed (mystery) card is just italicised so it's
                  identifiable without breaking the rhythm of the list. */}
              <Box
                sx={{
                  display: 'grid',
                  // Rows cap at ~16cqi (slightly taller than the 12cqi
                  // badge). The grid sizes to content height so the category
                  // sits flush above the first row.
                  gridTemplateRows: 'repeat(6, minmax(auto, 16cqi))',
                  gap: 0,
                }}
              >
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
                        columnGap: '4cqi',
                      }}
                    >
                      <Box
                        sx={{
                          width: '12cqi',
                          height: '12cqi',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '1.5cqi',
                          bgcolor: tierBg,
                          color: '#1a1a1a',
                          fontWeight: 900,
                          fontSize: '7.5cqi',
                          flexShrink: 0,
                        }}
                      >
                        {t}
                      </Box>
                      <Box
                        sx={{
                          minWidth: 0,
                          fontWeight: 600,
                          fontSize: '8cqi',
                          lineHeight: 1.15,
                          color: 'text.primary',
                          textTransform: 'uppercase',
                          fontStyle: isMystery ? 'italic' : 'normal',
                          // Allow up to 2 wrapped lines, then clamp with an
                          // ellipsis. Avoids stray 3rd lines blowing the row.
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          overflow: 'hidden',
                        }}
                      >
                        {cell?.item ?? '—'}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {/* Attribution — names the writer whose tier list these items
                  came from, shown beneath the list. */}
              {writer && (
                <Box
                  sx={{
                    mt: '3cqi',
                    fontSize: '4.5cqi',
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.6)',
                    textAlign: 'center',
                  }}
                >
                  Written by{' '}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 900,
                      color: `color-mix(in srgb, ${writer.colorHex} 60%, white)`,
                    }}
                  >
                    {writer.name}
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}

      {/* Total points — same place / layout / size as the in-game
          PlayerCell bottom slot (fire 22cqi, '×' at 11cqi/0.7 opacity,
          number at 18cqi). 0 falls back to "no points" in the player's
          muted colour, again matching the in-game cell. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '22cqi',
          fontFamily: CARD_FONT,
          fontWeight: 800,
          color: 'text.primary',
          lineHeight: 1,
        }}
      >
        {hearts > 0 ? (
          <>
            <OpenMojiIcon emoji="🔥" variant="color" size="22cqi" />
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '5cqi',
              }}
            >
              <Box component="span" sx={{ fontSize: '11cqi', fontWeight: 600, opacity: 0.7 }}>×</Box>
              <Box component="span" sx={{ fontSize: '18cqi' }}>{hearts}</Box>
            </Box>
          </>
        ) : (
          <Box
            component="span"
            sx={{
              fontSize: '11cqi',
              fontWeight: 900,
              color: pastelOnDark(meta.colorHex, 0.6),
              textTransform: 'uppercase',
            }}
          >
            no points
          </Box>
        )}
      </Box>
    </Box>
  );
}
