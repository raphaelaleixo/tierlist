import { useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import type { GameState, HandCard } from '../../game/types';
import {
  currentTurnPlayerId,
  isCurrentTrickComplete,
  playCard,
  requestTrickDismiss,
  writerOf,
} from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import { pastelOnDark } from '../../utils/blob';
import OpenMojiIcon from '../OpenMojiIcon';
import TierCard from '../TierCard';
import ShinyButton from '../ShinyButton';
import PlayerNameChip from '../PlayerNameChip';
import type { PlayerMeta } from '../big-screen/playerMeta';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

// Fixed card width (px) so the hand looks the same on every phone, regardless
// of viewport width. The carousel centres cards and pads its ends by half the
// leftover width so the first/last card can still sit centred.
const CARD_WIDTH = 230;

interface Props {
  roomId: string;
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

export default function PhoneCardPlay({ roomId, gameState, myId, meta }: Props) {
  const round = gameState.rounds[gameState.currentRoundIndex]!;
  const myHand = round.perPlayer[myId]?.hand ?? [];
  const myCategory = round.perPlayer[myId]?.categoryAssigned ?? null;
  const me = meta[myId];
  const myColor = me?.colorHex ?? '#888';
  const myHearts = gameState.hearts[myId] ?? 0;

  const trick = round.tricks[round.currentTrickIndex];
  const turnPlayerId = currentTurnPlayerId(gameState);
  const isMyTurn = turnPlayerId === myId;
  const trickComplete = isCurrentTrickComplete(gameState);
  const trickResolved = trick.winnerId !== null;
  const iAlreadyPlayedThisTrick = trick.plays.some((p) => p.playerId === myId);

  // The neighbour who wrote my tier list (and will play in my category on
  // the big screen). Shown in the header as context — "ranked by X".
  const writerId = writerOf(gameState.seating, myId, round.passDirection);
  const writer = meta[writerId];

  // Two-step play: tap a card to select, then tap the CTA to confirm.
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedCard = myHand.find((c) => c.id === selectedCardId && !c.played);
  const canPlay =
    isMyTurn && !trickComplete && !iAlreadyPlayedThisTrick && !!selectedCard && !submitting;

  async function handlePlay() {
    if (!selectedCard || !canPlay) return;
    setSubmitting(true);
    try {
      await writeGameState(roomId, playCard(gameState, myId, selectedCard.id));
      setSelectedCardId(null);
    } finally {
      setSubmitting(false);
    }
  }

  // Any player can advance a resolved trick. The write is idempotent (first
  // tap flips the flag; the big screen plays its cleanup and the driver
  // commits the advance), so concurrent taps are harmless.
  const dismissRequested = !!trick.dismissRequested;
  async function handleDismiss() {
    if (!trickResolved || dismissRequested) return;
    await writeGameState(roomId, requestTrickDismiss(gameState));
  }

  // Status banner copy + colour.
  const status = computeStatus({
    trickResolved,
    trickComplete,
    isMyTurn,
    iAlreadyPlayedThisTrick,
    trickWinnerId: trick.winnerId,
    myId,
    meta,
    turnPlayerId,
  });

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
      {/* Top section — text + status, constrained to xs width. */}
      <Container maxWidth="xs" sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {/* Header: fire-point count. Round + turn now live in the black
              footer bar at the bottom (mimicking the big screen). */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <OpenMojiIcon emoji="🔥" variant="color" size="1.3rem" />
              <Box sx={{ fontWeight: 900, fontSize: '1.1rem' }}>×{myHearts}</Box>
            </Box>
          </Box>

          {/* Category as title (matches the tier-writing aesthetic) */}
          <Box sx={{ textAlign: 'center' }}>
            {myCategory && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <OpenMojiIcon
                  emoji={myCategory.emoji}
                  variant="black"
                  invert
                  size="3rem"
                />
              </Box>
            )}
            <Box
              sx={{
                fontWeight: 900,
                fontSize: '1.7rem',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {myCategory?.name ?? '—'}
            </Box>
            {writer && (
              <Box
                sx={{
                  mt: 0.75,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.75)',
                  textTransform: 'uppercase',
                }}
              >
                ranked by <PlayerNameChip name={writer.name} colorHex={writer.colorHex} />
              </Box>
            )}
          </Box>
        </Stack>
      </Container>

      {/* Hand — full-width horizontal scroll-snap. NOT constrained by the
          Container above, so neighbours peek properly on the desktop mock
          (where the Container caps at ~444 px). Tap a card to select it. */}
      <Box
        sx={{
          // Cards are a fixed size, so the carousel just hugs their height
          // instead of stretching to fill the column (no flex: 1).
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          scrollSnapType: 'x mandatory',
          px: `max(0px, calc((100% - ${CARD_WIDTH}px) / 2))`,
          scrollPaddingInline: `max(0px, calc((100% - ${CARD_WIDTH}px) / 2))`,
          gap: 1.5,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          py: 4.5,
        }}
      >
        {myHand.map((card) => (
          <HandCardView
            key={card.id}
            card={card}
            isSelected={card.id === selectedCardId}
            isSelectable={
              !card.played && isMyTurn && !trickComplete && !iAlreadyPlayedThisTrick
            }
            onTap={() => {
              if (!card.played && isMyTurn && !trickComplete && !iAlreadyPlayedThisTrick) {
                setSelectedCardId((id) => (id === card.id ? null : card.id));
              }
            }}
            category={myCategory}
            writerName={writer?.name ?? ''}
            holderColor={me?.color ?? 'red'}
            myColor={myColor}
          />
        ))}
      </Box>

      {/* CTA — back inside the constrained Container. Once the trick is
          resolved the CTA becomes a shared "Continue" that any player can tap
          to dismiss the result and advance. `mt: auto` pins the CTA + footer
          to the bottom of the column (the carousel no longer stretches). */}
      <Container maxWidth="xs" sx={{ pb: 2, mt: 'auto' }}>
        {trickResolved ? (
          <ShinyButton
            accent={myColor}
            variant="primary"
            fullWidth
            disabled={dismissRequested}
            onClick={() => void handleDismiss()}
          >
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {dismissRequested ? 'Continuing…' : 'Continue'}
            </Box>
          </ShinyButton>
        ) : (
          <ShinyButton
            accent={myColor}
            variant="primary"
            fullWidth
            disabled={!canPlay}
            onClick={() => void handlePlay()}
          >
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {selectedCard ? 'Play' : isMyTurn ? 'Pick a card' : 'Waiting'}
            </Box>
          </ShinyButton>
        )}
      </Container>

      {/* Black footer bar — turn / result on top, round indicator below,
          stacked and centred, mimicking the big screen's bottom strip. */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.25,
          px: 2.5,
          pt: 1.25,
          // `env()` resolves to 0 without `viewport-fit=cover` in index.html,
          // so both halves are needed for either to matter.
          pb: 'calc(10px + env(safe-area-inset-bottom))',
          bgcolor: '#0a0a12',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box
          sx={{
            fontSize: '0.95rem',
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: status.color,
            ...(status.pulse && {
              animation: 'turnPulse 700ms ease-in-out infinite alternate',
              '@keyframes turnPulse': {
                from: { color: '#ffce1c' },
                to: { color: '#fff5b0' },
              },
            }),
          }}
        >
          {status.title}
        </Box>
        <Box
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Round {round.number} · Trick {round.currentTrickIndex + 1}/5
        </Box>
      </Box>
    </Box>
  );
}

// ─── Hand card ──────────────────────────────────────────────────

interface HandCardViewProps {
  card: HandCard;
  isSelected: boolean;
  isSelectable: boolean;
  onTap: () => void;
  category: { emoji: string; name: string } | null;
  writerName: string;
  holderColor: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'magenta';
  myColor: string;
}

function HandCardView({
  card,
  isSelected,
  isSelectable,
  onTap,
  category,
  writerName,
  holderColor,
  myColor,
}: HandCardViewProps) {
  const cardStyle = {
    opacity: card.played ? 0.25 : 1,
    filter: isSelected ? `drop-shadow(0 8px 18px ${myColor})` : 'none',
    transitionProperty: 'filter, opacity, translate, scale',
    transitionDuration: '200ms',
  } as const;

  return (
    <Box
      onClick={onTap}
      sx={{
        flex: `0 0 ${CARD_WIDTH}px`,
        aspectRatio: '5/7',
        scrollSnapAlign: 'center',
        position: 'relative',
        cursor: isSelectable ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        ...(isSelected ? { translate: '0 -8px', scale: '1.03' } : {}),
        ...cardStyle,
      }}
    >
      <TierCard
        emoji={category?.emoji ?? '📋'}
        category={category?.name ?? ''}
        writerName={writerName}
        holderColor={holderColor}
        item={card.item}
        tier={card.tier}
        revealed={false}
        heightBound
        variant="dark"
      />
    </Box>
  );
}

// ─── Status helper ────────────────────────────────────────────────────────

interface StatusArgs {
  trickResolved: boolean;
  trickComplete: boolean;
  isMyTurn: boolean;
  iAlreadyPlayedThisTrick: boolean;
  trickWinnerId: number | null;
  myId: number;
  meta: Record<number, PlayerMeta>;
  turnPlayerId: number | null;
}

function computeStatus(args: StatusArgs): { title: string; color: string; pulse: boolean } {
  const { trickResolved, trickComplete, isMyTurn, iAlreadyPlayedThisTrick, trickWinnerId, myId, meta, turnPlayerId } = args;
  if (trickResolved && trickWinnerId !== null) {
    if (trickWinnerId === myId) {
      return { title: 'You won the trick', color: '#ffce1c', pulse: false };
    }
    const winnerName = meta[trickWinnerId]?.name ?? `Player ${trickWinnerId}`;
    return { title: `${winnerName} won`, color: 'rgba(255,255,255,0.85)', pulse: false };
  }
  if (trickComplete) {
    return { title: 'Revealing…', color: 'rgba(255,255,255,0.85)', pulse: false };
  }
  if (isMyTurn) {
    return { title: 'Your turn', color: '#ffce1c', pulse: true };
  }
  if (iAlreadyPlayedThisTrick) {
    return { title: 'Played — waiting', color: 'rgba(255,255,255,0.6)', pulse: false };
  }
  const next = turnPlayerId !== null ? meta[turnPlayerId]?.name ?? '' : '';
  return {
    title: next ? `${next}'s turn` : 'Waiting…',
    color: 'rgba(255,255,255,0.6)',
    pulse: false,
  };
}
