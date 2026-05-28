import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GameState, HandCard } from '../../game/types';
import {
  currentTurnPlayerId,
  isCurrentTrickComplete,
  playCard,
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

  // Local-only hand order. The deal randomises the order in game state, but
  // we let the player rearrange their own hand by long-press + drag. The
  // reordered list is keyed by cardId; cards added/removed (e.g. when the
  // round changes) get reconciled in the effect below.
  const [orderedIds, setOrderedIds] = useState<string[]>(() => myHand.map((c) => c.id));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderedIds((prev) => {
      const handIds = new Set(myHand.map((c) => c.id));
      const kept = prev.filter((id) => handIds.has(id));
      const known = new Set(kept);
      const appended = myHand.filter((c) => !known.has(c.id)).map((c) => c.id);
      const next = [...kept, ...appended];
      // Avoid useless renders when nothing actually changed.
      return next.length === prev.length && next.every((id, i) => id === prev[i]) ? prev : next;
    });
  }, [myHand]);

  // Build the rendered hand by following the local order, with any
  // un-ordered cards (shouldn't happen post-effect, but safe) tacked on.
  const orderedHand = useMemo(() => {
    const byId = new Map(myHand.map((c) => [c.id, c]));
    const out: HandCard[] = [];
    for (const id of orderedIds) {
      const c = byId.get(id);
      if (c) out.push(c);
    }
    for (const c of myHand) {
      if (!orderedIds.includes(c.id)) out.push(c);
    }
    return out;
  }, [myHand, orderedIds]);

  // Sensor split: mouse activates immediately on a small drag distance
  // (normal click-and-drag); touch requires a deliberate long-press
  // (held still ~500 ms) so a quick horizontal swipe still scrolls the
  // carousel natively.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 10 } }),
  );

  // Without this, dnd-kit visualises the dragged card wherever your pointer
  // goes — including off the edge of the carousel. Clamp the card's
  // transform to the carousel's visible bounds so it "sticks" at the edge
  // while auto-scroll brings more cards into view.
  const clampDragToCarousel: Modifier = ({
    transform,
    draggingNodeRect,
    scrollableAncestorRects,
  }) => {
    const scroller = scrollableAncestorRects[0];
    if (!draggingNodeRect || !scroller) return transform;
    const minX = scroller.left - draggingNodeRect.left;
    const maxX = scroller.right - draggingNodeRect.right;
    return {
      ...transform,
      x: Math.max(minX, Math.min(maxX, transform.x)),
      y: 0,
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedIds((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

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
          {/* Header: round / trick + fire-point count */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Round {round.number} · Trick {round.currentTrickIndex + 1}/5
            </Box>
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

          {/* Status banner */}
          <Box sx={{ textAlign: 'center', minHeight: '1.6rem' }}>
            <Box
              sx={{
                fontWeight: 900,
                fontSize: '1.25rem',
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
          </Box>
        </Stack>
      </Container>

      {/* Hand — full-width horizontal scroll-snap. NOT constrained by the
          Container above, so neighbours peek properly on desktop-mock too
          (where the Container caps at ~444 px). Long-press a card to pick
          it up and drag; quick tap selects; quick swipe scrolls. */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[clampDragToCarousel]}
        onDragStart={() => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.(15);
          }
        }}
        onDragEnd={handleDragEnd}
        autoScroll={{ acceleration: 5, threshold: { x: 0.15, y: 0 } }}
      >
        <SortableContext items={orderedIds} strategy={horizontalListSortingStrategy}>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              overflowY: 'hidden',
              overscrollBehaviorX: 'contain',
              scrollSnapType: 'x mandatory',
              px: 'calc((100% - 60%) / 2)',
              scrollPaddingInline: 'calc((100% - 60%) / 2)',
              gap: 1.5,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              py: 1,
            }}
          >
            {orderedHand.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                isSelected={card.id === selectedCardId}
                isPlayable={
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
        </SortableContext>
      </DndContext>

      {/* CTA — back inside the constrained Container. */}
      <Container maxWidth="xs" sx={{ pb: 2 }}>
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
            {selectedCard ? `Play ${selectedCard.item}` : isMyTurn ? 'Pick a card' : 'Waiting'}
          </Box>
        </ShinyButton>
      </Container>
    </Box>
  );
}

// ─── Sortable hand card ──────────────────────────────────────────────────

interface SortableCardProps {
  card: HandCard;
  isSelected: boolean;
  isPlayable: boolean;
  onTap: () => void;
  category: { emoji: string; name: string } | null;
  writerName: string;
  holderColor: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'magenta';
  myColor: string;
}

function SortableCard({
  card,
  isSelected,
  isPlayable,
  onTap,
  category,
  writerName,
  holderColor,
  myColor,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    // Slow the neighbour cards' shuffle so reordering feels deliberate.
    transition: { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  });

  const draggableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: card.played ? 0.25 : isDragging ? 0.85 : 1,
    filter: isDragging
      ? `drop-shadow(0 14px 22px rgba(0,0,0,0.5))`
      : isSelected
        ? `drop-shadow(0 8px 18px ${myColor})`
        : 'none',
    zIndex: isDragging ? 5 : 'auto',
    transitionProperty: 'transform, filter, opacity',
  } as const;

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isDragging) return;
        onTap();
      }}
      sx={{
        flex: '0 0 60%',
        aspectRatio: '5/7',
        scrollSnapAlign: 'center',
        position: 'relative',
        cursor: isPlayable ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        // `pan-x` lets the carousel scroll natively when the player swipes
        // quickly; dnd-kit's TouchSensor takes over only after the 500 ms
        // long-press, at which point it preventDefaults touchmove and
        // suppresses the scroll for the duration of the drag.
        touchAction: 'pan-x',
        ...(isSelected && !isDragging ? { translate: '0 -8px', scale: '1.03' } : {}),
        ...draggableStyle,
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
