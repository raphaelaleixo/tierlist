import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { GameState, Play, Round } from '../../game/types';
import { currentTurnPlayerId } from '../../game/lifecycle';
import PlayerCell from './PlayerCell';
import type { PlayerMeta } from './playerMeta';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface Props {
  gameState: GameState;
  round: Round;
  meta: Record<number, PlayerMeta>;
  /** When provided, clicking the screen after a winner is resolved plays the
   *  dismiss animation (cards tuck under winner, then slide off) and calls
   *  this callback so the parent can advance the state. */
  onDismiss?: () => void;
}

const DISMISS_TUCK_MS = 350;
const DISMISS_SLIDE_MS = 450;
// Exported so the driver can wait exactly this long after a dismiss is
// requested before committing the trick advance (cards finish sliding off).
export const DISMISS_TOTAL_MS = DISMISS_TUCK_MS + DISMISS_SLIDE_MS;

export default function BigScreenCardPlay({ gameState, round, meta, onDismiss }: Props) {
  const trick = round.tricks[round.currentTrickIndex];
  const turnPlayerId = currentTurnPlayerId(gameState);

  const currentPlayByPlayer = new Map<number, Play>();
  for (const p of trick.plays) currentPlayByPlayer.set(p.playerId, p);

  // Dismissal drives the exit animation (losing cards tuck under the winner,
  // then slide off). Two trigger paths:
  //   • Live game: any player taps "Continue" on their phone, which sets
  //     `trick.dismissRequested` in shared state — we derive `dismissing`
  //     straight from that flag.
  //   • Mock: click anywhere on the big screen (local state), since there's
  //     no phone wired up.
  const [dismissingLocal, setDismissingLocal] = useState(false);
  const dismissing = onDismiss ? dismissingLocal : !!trick.dismissRequested;
  const canDismiss = !!onDismiss && trick.winnerId !== null && !dismissingLocal;
  const handleDismissClick = () => {
    if (!canDismiss) return;
    setDismissingLocal(true);
    window.setTimeout(() => {
      onDismiss?.();
      setDismissingLocal(false);
    }, DISMISS_TOTAL_MS);
  };

  const winnerIndex = trick.winnerId !== null
    ? gameState.seating.indexOf(trick.winnerId)
    : -1;

  // Winner spotlight timeline — when a trick gets resolved (winnerId set):
  //   t+1000ms: WINNER overlay fades in over the winner's info strip + card pulses
  //   t+1400ms: winner's fire-count visually updates (covered by overlay)
  //   t+4400ms: overlay fades out, new lit fire visible
  const [winnerSpotlight, setWinnerSpotlight] = useState(false);
  const [pointsLit, setPointsLit] = useState(true);
  const lastWinnerRef = useRef<number | null>(null);
  useEffect(() => {
    const wid = trick.winnerId;
    if (wid === lastWinnerRef.current) return;
    lastWinnerRef.current = wid;
    if (wid === null) {
      // Reset per-trick UI state when the trick advances — a legitimate sync
      // from the resolved-trick prop, not a cascading render.
      /* eslint-disable react-hooks/set-state-in-effect */
      setWinnerSpotlight(false);
      setPointsLit(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    setPointsLit(false);
    // Spotlight stays on until the trick is dismissed. Points get marked lit
    // shortly after the spotlight appears so the new fire is already visible
    // under the overlay if it ever clears.
    const showT = window.setTimeout(() => setWinnerSpotlight(true), 1000);
    const litT = window.setTimeout(() => setPointsLit(true), 1400);
    return () => {
      clearTimeout(showT);
      clearTimeout(litT);
    };
  }, [trick.winnerId]);

  // The spotlight overlay should slide away the moment dismissal begins (the
  // cards tuck/slide underneath it), so derive its visibility rather than
  // toggling it imperatively from each dismiss path.
  const showSpotlight = winnerSpotlight && !dismissing;

  // While the winner overlay is covering them, show the OLD heart count
  // (subtract the freshly-awarded trick point). When `pointsLit` flips true
  // the overlay is hiding it; when overlay fades, the new count is revealed.
  const displayHearts: Record<number, number> = {};
  for (const pid of gameState.seating) {
    let h = gameState.hearts[pid] ?? 0;
    if (!pointsLit && trick.winnerId === pid) h = Math.max(0, h - 1);
    displayHearts[pid] = h;
  }

  // Short explanation of why the winner won — shown under "Winner" in the
  // overlay. Three flavours: F-bomb, tied (earliest in turn order), highest tier.
  const winReason: string = (() => {
    if (trick.winnerId === null) return '';
    if (trick.fBeatsS) return 'F tier beats S';
    const tiers = new Map<number, string>();
    for (const p of trick.plays) {
      const c = round.perPlayer[p.playerId]?.hand?.find((x) => x.id === p.cardId);
      if (c) tiers.set(p.playerId, c.tier);
    }
    const winningTier = tiers.get(trick.winnerId);
    if (!winningTier) return '';
    const sameTierCount = Array.from(tiers.values()).filter((t) => t === winningTier).length;
    if (sameTierCount > 1) return 'Tied tiers, first player wins';
    return `${winningTier} was the highest tier`;
  })();

  // Single row of cells; each cell is always 1/6 of the row width so cards
  // stay the same size regardless of player count (3..6 players). Applied as
  // a child selector on the row (flex-basis + shrink:0) so we don't have to
  // pipe a CSS variable through MUI sx.
  const SLOTS = 6;

  return (
    <Box
      onClick={handleDismissClick}
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CARD_FONT,
        cursor: canDismiss ? 'pointer' : 'default',
      }}
    >
      {/* Player row — full height; cells are sized to always 1/6 of width. */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          minHeight: 0,
          '& > *': {
            flex: `0 0 calc(100% / ${SLOTS})`,
            maxWidth: `calc(100% / ${SLOTS})`,
          },
        }}
      >
        {gameState.seating.map((pid, idx) => {
          const playerMeta = meta[pid];
          if (!playerMeta) return null;
          const play = currentPlayByPlayer.get(pid);
          return (
            <PlayerCell
              key={pid}
              pid={pid}
              meta={playerMeta}
              round={round}
              seating={gameState.seating}
              points={displayHearts[pid]}
              currentPlay={play}
              isCurrentTurn={turnPlayerId === pid}
              isWinnerOfTrick={trick.winnerId === pid}
              winnerSpotlight={showSpotlight}
              winReason={winReason}
              hasPlayedCurrentTrick={currentPlayByPlayer.has(pid)}
              allMeta={meta}
              cellIndex={idx}
              winnerIndex={winnerIndex}
              dismissing={dismissing}
              dismissDurations={{ tuck: DISMISS_TUCK_MS, slide: DISMISS_SLIDE_MS }}
            />
          );
        })}
      </Box>

      {/* Footer bar — round / trick info pinned to bottom. */}
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
        Round {round.number} / Trick {round.currentTrickIndex + 1}
      </Box>
    </Box>
  );
}
