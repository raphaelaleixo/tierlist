import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Box, Typography } from '@mui/material';
import type { Play, Round } from '../../game/types';
import { writerOf } from '../../game/lifecycle';
import TierCard from '../TierCard';
import OpenMojiIcon from '../OpenMojiIcon';
import { pastelOnDark } from '../../utils/blob';
import PlayerSlot, { PlayerNameLine } from './PlayerSlot';
import type { PlayerMeta } from './playerMeta';

// Keep in sync with the `tierCardDropIn` keyframe duration in TierCard.
const DROP_IN_MS = 600;

// One cell in the big-screen player grid (column 1). Top: the player's
// currently-played card (or a "thinking…" indicator when it's their turn).
// Below: name, colour dot, and 🔥 points.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';


interface PlayerCellProps {
  pid: number;
  meta: PlayerMeta;
  round: Round;
  seating: number[];
  points: number;
  currentPlay: Play | undefined;
  isCurrentTurn: boolean;
  isWinnerOfTrick: boolean;
  /** True while the winner spotlight phase is active (card nudges + WINNER overlay). */
  winnerSpotlight: boolean;
  /** Short explanation of why this trick was won (e.g., "S was the highest tier"). */
  winReason: string;
  hasPlayedCurrentTrick: boolean;
  allMeta: Record<number, PlayerMeta>;
  /** This cell's index in the player row (0..n-1) — used to compute the X
   *  displacement during the dismiss tuck animation. */
  cellIndex: number;
  /** Index of the winning cell (so losing cards know where to tuck to). */
  winnerIndex: number;
  /** When true, plays the dismiss animation: losing cards tuck under the
   *  winner, then everything slides down off the screen. */
  dismissing: boolean;
  /** Tuck (phase 1) + slide (phase 2) durations from the parent. */
  dismissDurations: { tuck: number; slide: number };
}

export default function PlayerCell({
  pid,
  meta,
  round,
  seating,
  points,
  currentPlay,
  isCurrentTurn,
  isWinnerOfTrick,
  winnerSpotlight,
  winReason,
  hasPlayedCurrentTrick,
  allMeta,
  cellIndex,
  winnerIndex,
  dismissing,
  dismissDurations,
}: PlayerCellProps) {
  const card = currentPlay
    ? round.perPlayer[pid]?.hand?.find((c) => c.id === currentPlay.cardId)
    : undefined;
  const category = round.perPlayer[pid]?.categoryAssigned;
  const cardRotation = currentPlay ? hashRotation(currentPlay.cardId) : 0;
  const writerId = writerOf(seating, pid, round.passDirection);
  const writer = allMeta[writerId];
  const spotlight = winnerSpotlight && isWinnerOfTrick;
  void hasPlayedCurrentTrick;

  // Fade in the "{writer}'s {category}" subtitle alongside the bottom slot
  // (handled by PlayerSlot itself), so the whole cell composes nicely.
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSubtitleVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Keep the "thinking…/waiting" placeholder visible until the dropping
  // card has finished its slide. We mark the entry animation as "in flight"
  // when a play first appears for this cell, then clear it after the slide.
  //
  // `useLayoutEffect` (not `useEffect`) so the `cardLanded → false` flip
  // happens BEFORE the browser paints the render that first sees the new
  // currentPlay. Otherwise there's a one-frame gap where the placeholder
  // is gone but the card has only just started sliding from the top.
  const [cardLanded, setCardLanded] = useState(true);
  const lastPlayIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const newId = currentPlay?.cardId ?? null;
    if (newId === lastPlayIdRef.current) return;
    lastPlayIdRef.current = newId;
    if (newId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCardLanded(true);
      return;
    }
    setCardLanded(false);
    const t = window.setTimeout(() => setCardLanded(true), DROP_IN_MS);
    return () => clearTimeout(t);
  }, [currentPlay?.cardId]);

  const topSlot = (
    <Box sx={{ textAlign: 'center', lineHeight: 1.1, textTransform: 'uppercase' }}>
      <PlayerNameLine name={meta.name} />
      <Box
        sx={{
          fontWeight: 700,
          fontSize: '8cqi',
          color: meta.colorHex,
          mt: '1.5cqi',
          fontFamily: CARD_FONT,
          opacity: subtitleVisible ? 1 : 0,
          transition: 'opacity 500ms ease',
        }}
      >
        {writer?.name ?? ''}'s {category?.name ?? ''}
      </Box>
    </Box>
  );

  const middleSlot = (
    <Box
        style={{
          // dx: horizontal travel toward the winner cell, in vw (cells are
          // 1/6 of viewport). Other cqi-based offsets won't carry across
          // siblings, so vw is correct here.
          '--dismiss-dx': `${(winnerIndex - cellIndex) * (100 / 6)}vw`,
          '--dismiss-tuck': `${dismissDurations.tuck}ms`,
          '--dismiss-slide': `${dismissDurations.slide}ms`,
        } as CSSProperties}
        sx={{
          width: '100%',
          aspectRatio: '5/7',
          position: 'relative',
          // Winner card stays above so losers visually tuck under it.
          zIndex: cellIndex === winnerIndex ? 2 : 1,
          animation: dismissing
            ? `cardDismissTuck var(--dismiss-tuck) cubic-bezier(0.4, 0, 0.6, 1) forwards,
               cardDismissSlide var(--dismiss-slide) cubic-bezier(0.5, 0, 0.75, 0) forwards var(--dismiss-tuck)`
            : 'none',
          '@keyframes cardDismissTuck': {
            '0%':   { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(var(--dismiss-dx), 0)' },
          },
          '@keyframes cardDismissSlide': {
            '0%':   { transform: 'translate(var(--dismiss-dx), 0)' },
            '100%': { transform: 'translate(var(--dismiss-dx), 110vh)' },
          },
        }}
      >
        {/* Placeholder layer — always present, fades out only after the card
            has finished sliding in. Positioned absolute so the card overlays. */}
        {(!currentPlay || !cardLanded) && (
          <Box sx={{ position: 'absolute', inset: 0 }}>
            {/* While the dropping card is in flight we keep the active
                "thinking…" look so the cell doesn't visibly flip to
                "waiting" mid-animation. */}
            <SlotPlaceholder
              thinking={isCurrentTurn || (!!currentPlay && !cardLanded)}
              colorHex={meta.colorHex}
            />
          </Box>
        )}
        {currentPlay && card && category && writer && (
          // Two nested wrappers so the slide and the spin compose correctly:
          //   • Outer (parent): translateY → world-coords vertical slide
          //   • Inner (child):  rotate     → spin within the slid card
          // If they were inverted, the child's translate would be applied in
          // the rotated frame and the card would arc instead of dropping
          // straight down.
          <Box
            key={currentPlay.cardId}
            sx={{
              position: 'absolute',
              inset: 0,
              animation: `cardEntrySlide ${DROP_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
              '@keyframes cardEntrySlide': {
                '0%': { transform: 'translateY(-110vh)', opacity: 0 },
                '10%': { opacity: 1 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              },
            }}
          >
            <Box
              style={{
                // Per-cell rotation via CSS vars so each cell keeps its own
                // angles (a single named keyframe is shared across instances).
                '--rot-start': `${cardRotation + 180}deg`,
                '--rot-end': `${cardRotation}deg`,
                '--rot-nudge-neg': `${-cardRotation}deg`,
                '--rot-spin-end': `${cardRotation + 360}deg`,
              } as CSSProperties}
              sx={{
                width: '100%',
                height: '100%',
                transformOrigin: 'center center',
                // Base resting state — used when neither animation is running.
                transform: 'rotate(var(--rot-end))',
                animation: (dismissing && cellIndex === winnerIndex)
                  ? `cardDismissSpin ${dismissDurations.tuck}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
                  : spotlight
                    ? 'winnerNudge 700ms ease-in-out infinite alternate'
                    : `cardEntryRotate ${DROP_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                '@keyframes cardEntryRotate': {
                  '0%': { transform: 'rotate(var(--rot-start))' },
                  '100%': { transform: 'rotate(var(--rot-end))' },
                },
                // Nudge swings between the card's own natural tilt and its
                // mirror (cardRotation ↔ -cardRotation) so the pendulum
                // straddles the resting position symmetrically.
                '@keyframes winnerNudge': {
                  '0%': { transform: 'rotate(var(--rot-end))' },
                  '100%': { transform: 'rotate(var(--rot-nudge-neg))' },
                },
                // Full 360° spin on dismiss — runs only on the WINNER card
                // during the tuck phase, so it looks like a deliberate beat
                // every time (instead of the accidental spin we'd get when
                // swapping the nudge keyframe for the entry one).
                '@keyframes cardDismissSpin': {
                  '0%':   { transform: 'rotate(var(--rot-end))' },
                  '100%': { transform: 'rotate(var(--rot-spin-end))' },
                },
              }}
            >
              <TierCard
                key={currentPlay.cardId}
                emoji={category.emoji}
                category={category.name}
                writerName={writer.name}
                holderColor={meta.color}
                item={card.item}
                tier={card.tier}
                revealed={currentPlay.revealed}
                heightBound
                variant="dark"
              />
            </Box>
          </Box>
        )}
      </Box>
  );

  const bottomSlot = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '22cqi',
        gap: 0,
        fontFamily: CARD_FONT,
        fontWeight: 800,
        color: 'text.primary',
        lineHeight: 1,
      }}
    >
      {points > 0 ? (
        <>
          <OpenMojiIcon emoji="🔥" variant="color" size="22cqi" />
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '5cqi',
              textBoxTrim: 'trim-both',
              textBoxEdge: 'cap alphabetic',
            }}
          >
            <Box component="span" sx={{ fontSize: '11cqi', fontWeight: 600, opacity: 0.7 }}>×</Box>
            <Box component="span" sx={{ fontSize: '18cqi' }}>{points}</Box>
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
  );

  // Key on the current trick's winnerId so the overlay remounts on every
  // trick advance — keeps the post-exit reset out of the transition system
  // entirely (a fresh element doesn't animate its initial styles).
  const overlayKey = round.tricks[round.currentTrickIndex]?.winnerId ?? 'none';

  return (
    <PlayerSlot
      meta={meta}
      ready
      top={topSlot}
      middle={middleSlot}
      bottom={bottomSlot}
    >
      <WinnerOverlay
        key={overlayKey}
        spotlight={spotlight}
        colorHex={meta.colorHex}
        winReason={winReason}
      />
    </PlayerSlot>
  );
}

interface WinnerOverlayProps {
  spotlight: boolean;
  colorHex: string;
  winReason: string;
}

function WinnerOverlay({ spotlight, colorHex, winReason }: WinnerOverlayProps) {
  // `wasShown` is internal to the overlay's lifetime. The parent re-keys this
  // component on trick advance, so a new trick's overlay always starts at
  // `wasShown = false` (closed clip, in-place transform) with no transitions
  // to animate from the previous state.
  const [wasShown, setWasShown] = useState(false);
  useEffect(() => {
    if (spotlight) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWasShown(true);
    }
  }, [spotlight]);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '58cqi',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <Box
        aria-hidden={!spotlight}
        sx={{
          width: '100%',
          minHeight: '58cqi',
          py: '5cqi',
          px: '5cqi',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          bgcolor: 'rgba(15,15,22,0.95)',
          color: colorHex,
          fontFamily: CARD_FONT,
          textAlign: 'center',
          // Once shown, clip stays open and exits use slide. Before first show,
          // overlay is at translateY(0) but masked closed, so entry is purely
          // a clip-path reveal with no slide.
          clipPath: (spotlight || wasShown) ? 'inset(0 0 0 0)' : 'inset(0 50% 0 50%)',
          transform:
            wasShown && !spotlight ? 'translateY(101%)' : 'translateY(0)',
          transition:
            'clip-path 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <Box
          sx={{
            fontSize: '14cqi',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1,
            animation: 'winnerTextPulse 700ms ease-in-out infinite alternate',
            '@keyframes winnerTextPulse': {
              from: { color: '#ffce1c' },
              to: { color: '#fff5b0' },
            },
          }}
        >
          Winner
        </Box>
        {winReason && (
          <Box
            sx={{
              fontSize: '7cqi',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.2,
            }}
          >
            {winReason}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Deterministic small rotation in degrees from a string seed (card id).
// Range -5°..+5°. Uses FNV-1a so similar seeds ("1-S", "2-S", ...) still
// hash to wildly different rotations.
function hashRotation(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unit = (h >>> 0) / 0xffffffff; // 0..1
  return (unit - 0.5) * 10; // -5..+5
}

function SlotPlaceholder({ thinking, colorHex }: { thinking: boolean; colorHex: string }) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{
          fontFamily: CARD_FONT,
          fontSize: '8cqi',
          color: colorHex,
          opacity: thinking ? 1 : 0.4,
          ...(thinking && {
            animation: 'thinkPulse 1.1s ease-in-out infinite',
            '@keyframes thinkPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.45 },
            },
          }),
        }}
      >
        {thinking ? 'thinking…' : 'waiting'}
      </Typography>
    </Box>
  );
}
