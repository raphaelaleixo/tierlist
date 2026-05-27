import { useEffect, useMemo, useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { createInitialRoom, joinPlayer } from 'react-gameroom';
import type {
  CategoryChoice,
  GameState,
  PlayerColor,
  PlayerSlotData,
  TierList,
} from '../game/types';
import {
  createInitialGameState,
  submitCategory,
  startTierWriting,
  submitTierList,
  dealHands,
  startCardPlay,
  playCard,
  resolveCurrentTrick,
  advanceAfterTrick,
  startRound2,
  endGame,
  showFinalScore,
} from '../game/lifecycle';
import BigScreenGame from '../components/BigScreenGame';
import type { TierRoomState } from '../hooks/useFirebaseRoom';

const IDENTITY_SHUFFLE = <T,>(arr: T[]): T[] => [...arr];

interface RosterEntry {
  id: number;
  name: string;
  color: PlayerColor;
  r1: { category: CategoryChoice; items: string[] };
  r2: { category: CategoryChoice; items: string[] };
}

// 6-player roster. Bootstrap functions take the first N entries for an N-player game.
const ROSTER: RosterEntry[] = [
  { id: 1, name: 'Alice', color: 'red',
    r1: { category: { name: 'Animals',         emoji: '🐾' }, items: ['Cat', 'Dog', 'Hamster', 'Snake', 'Spider', 'Cockroach'] },
    r2: { category: { name: 'Bands',           emoji: '🎸' }, items: ['Beatles', 'Queen', 'ABBA', 'Coldplay', 'Nickelback', 'Creed'] } },
  { id: 2, name: 'Bob', color: 'cyan',
    r1: { category: { name: 'TV shows',        emoji: '📺' }, items: ['The Wire', 'Lost', 'Breaking Bad', 'The Office', 'Glee', 'Big Bang'] },
    r2: { category: { name: 'Pizza toppings',  emoji: '🍕' }, items: ['Pepperoni', 'Mushroom', 'Olive', 'Ham', 'Onion', 'Pineapple'] } },
  { id: 3, name: 'Carol', color: 'yellow',
    r1: { category: { name: '90s movies',      emoji: '📼' }, items: ['Fight Club', 'Pulp Fiction', 'Matrix', 'Titanic', 'Twister', 'Wild Wild West'] },
    r2: { category: { name: 'Cereals',         emoji: '🥣' }, items: ['Cheerios', 'Frosted Flakes', 'Lucky Charms', 'Corn Pops', 'Raisin Bran', 'All-Bran'] } },
  { id: 4, name: 'Dan', color: 'magenta',
    r1: { category: { name: 'Snacks',          emoji: '🍿' }, items: ['Cheetos', 'Doritos', 'Pringles', 'Lays', 'Twinkies', 'Black licorice'] },
    r2: { category: { name: 'Cars',            emoji: '🚗' }, items: ['Mustang', 'Civic', 'Beetle', 'Corolla', 'Hummer', 'PT Cruiser'] } },
  { id: 5, name: 'Ed', color: 'green',
    r1: { category: { name: 'Books',           emoji: '📚' }, items: ['1984', "The Hitchhiker's Guide to the Galaxy", 'The Hobbit', 'Twilight', 'Atlas Shrugged', 'The Da Vinci Code'] },
    r2: { category: { name: 'Sandwiches',      emoji: '🥪' }, items: ['BLT', 'Reuben', 'Cuban', 'Club', 'Tuna melt', 'PB&J'] } },
  { id: 6, name: 'Fay', color: 'orange',
    r1: { category: { name: 'Coffee drinks',   emoji: '☕' }, items: ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Frappuccino', 'Decaf'] },
    r2: { category: { name: 'Board games',     emoji: '🎲' }, items: ['Catan', 'Wingspan', 'Codenames', 'Monopoly', 'Risk', 'Sorry'] } },
];

function buildMockRoom(count: number): TierRoomState {
  let r = createInitialRoom<PlayerSlotData>({ minPlayers: 3, maxPlayers: 6, requireFull: false });
  r = { ...r, roomId: 'MOCK1' };
  for (const entry of ROSTER.slice(0, count)) {
    r = joinPlayer(r, entry.id, entry.name, { color: entry.color });
  }
  return { ...r, status: 'started' };
}

const makeList = (items: string[]): TierList => ({
  S: items[0], A: items[1], B: items[2], C: items[3], D: items[4], F: items[5],
});

// R1 pass=left: each player writes for their RIGHT neighbour's category.
// R2 pass=right: each player writes for their LEFT neighbour's category.
function bootstrapToCardPlay(count: number): GameState {
  const roster = ROSTER.slice(0, count);
  const seating = roster.map((r) => r.id);
  let s = createInitialGameState(seating, 1);
  for (const e of roster) s = submitCategory(s, e.id, e.r1.category);
  s = startTierWriting(s);
  // Player i (1-indexed) writes the items of player at index (i % count) = right neighbour.
  for (let i = 0; i < count; i++) {
    const writer = roster[i];
    const rightIdx = (i + 1) % count;
    s = submitTierList(s, writer.id, makeList(roster[rightIdx].r1.items));
  }
  s = dealHands(s, IDENTITY_SHUFFLE);
  s = startCardPlay(s);
  return s;
}

function bootstrapToEndReveal(count: number): GameState {
  const roster = ROSTER.slice(0, count);
  let s = bootstrapToCardPlay(count);
  // Play 5 tricks of R1
  for (let i = 0; i < 5; i++) {
    for (const e of roster) {
      const next = s.rounds[0].perPlayer[e.id].hand!.find((c) => !c.played)!;
      s = playCard(s, e.id, next.id);
    }
    s = resolveCurrentTrick(s);
    if (i < 4) s = advanceAfterTrick(s);
  }
  s = startRound2(s);
  for (const e of roster) s = submitCategory(s, e.id, e.r2.category);
  s = startTierWriting(s);
  // R2 pass=right: writer i writes for their LEFT neighbour (index (i-1+count)%count).
  for (let i = 0; i < count; i++) {
    const writer = roster[i];
    const leftIdx = (i - 1 + count) % count;
    s = submitTierList(s, writer.id, makeList(roster[leftIdx].r2.items));
  }
  s = dealHands(s, IDENTITY_SHUFFLE);
  s = startCardPlay(s);
  for (let i = 0; i < 5; i++) {
    for (const e of roster) {
      const next = s.rounds[1]!.perPlayer[e.id].hand!.find((c) => !c.played)!;
      s = playCard(s, e.id, next.id);
    }
    s = resolveCurrentTrick(s);
    if (i < 4) s = advanceAfterTrick(s);
  }
  return endGame(s);
}

type FixtureKey =
  | 'cat-pick-mid'
  | 'cat-pick-all'
  | 'tier-writing-mid'
  | 'card-play-progressive'
  | 'card-play-pending'
  | 'card-play-resolved-upset'
  | 'card-play-late-round'
  | 'end-reveal'
  | 'final-score';

// Build the full card-play state with one card played per player (each in a
// distinct tier). The card IDs are stable for the lifetime of this state, so
// we can slice it for the progressive demo without triggering remounts.
function buildFullProgressiveCardPlay(count: number): GameState {
  let s = bootstrapToCardPlay(count);
  const roster = ROSTER.slice(0, count);
  const tierByIndex: Array<'S' | 'A' | 'F' | 'B' | 'C' | 'D'> = ['S', 'A', 'F', 'B', 'C', 'D'];
  for (let i = 0; i < count; i++) {
    const tier = tierByIndex[i];
    const card = s.rounds[0].perPlayer[roster[i].id].hand!.find((c) => c.tier === tier)!;
    s = playCard(s, roster[i].id, card.id);
  }
  return s;
}

// Truncate a full card-play state so only the first `played` plays remain.
// Stable card IDs from `base` ensure already-mounted TierCards keep their key.
function sliceProgressiveCardPlay(base: GameState, played: number): GameState {
  const round = base.rounds[0]!;
  const trick = round.tricks[round.currentTrickIndex];
  const truncatedPlays = trick.plays.slice(0, played);
  const stillPlayed = new Set(truncatedPlays.map((p) => p.cardId));

  const newPerPlayer: typeof round.perPlayer = {};
  for (const [pid, ps] of Object.entries(round.perPlayer)) {
    newPerPlayer[Number(pid)] = {
      ...ps,
      hand: ps.hand?.map((c) => ({ ...c, played: stillPlayed.has(c.id) })) ?? null,
    };
  }

  return {
    ...base,
    rounds: [
      {
        ...round,
        perPlayer: newPerPlayer,
        tricks: [{ ...trick, plays: truncatedPlays }],
      },
    ],
  };
}

const FIXTURES: Record<FixtureKey, { label: string; build: (count: number) => GameState }> = {
  'cat-pick-mid': {
    label: 'Cat-pick · 2 in',
    build: (count) => {
      const roster = ROSTER.slice(0, count);
      let s = createInitialGameState(roster.map((r) => r.id), 1);
      const halfway = Math.min(2, count - 1);
      for (let i = 0; i < halfway; i++) s = submitCategory(s, roster[i].id, roster[i].r1.category);
      return s;
    },
  },
  'cat-pick-all': {
    label: 'Cat-pick · all in',
    build: (count) => {
      const roster = ROSTER.slice(0, count);
      let s = createInitialGameState(roster.map((r) => r.id), 1);
      for (const e of roster) s = submitCategory(s, e.id, e.r1.category);
      return s;
    },
  },
  'tier-writing-mid': {
    label: 'Tier-writing · partial',
    build: (count) => {
      const roster = ROSTER.slice(0, count);
      let s = createInitialGameState(roster.map((r) => r.id), 1);
      for (const e of roster) s = submitCategory(s, e.id, e.r1.category);
      s = startTierWriting(s);
      // Half of players have submitted their tier list (using the correct right-neighbour rotation).
      const half = Math.ceil(count / 2);
      for (let i = 0; i < half; i++) {
        const rightIdx = (i + 1) % count;
        s = submitTierList(s, roster[i].id, makeList(roster[rightIdx].r1.items));
      }
      return s;
    },
  },
  'card-play-progressive': {
    label: 'Card-play · animated drop-in',
    // Initial state shown if this fixture is selected; the component overrides
    // it with the sliced progressive state on each tick.
    build: (count) => sliceProgressiveCardPlay(buildFullProgressiveCardPlay(count), 0),
  },
  'card-play-pending': {
    label: 'Card-play · 2 played',
    build: (count) => {
      let s = bootstrapToCardPlay(count);
      const roster = ROSTER.slice(0, count);
      const tiersToPlay: Array<'S' | 'A'> = ['S', 'A'];
      const toPlay = Math.min(tiersToPlay.length, count);
      for (let i = 0; i < toPlay; i++) {
        const card = s.rounds[0].perPlayer[roster[i].id].hand!.find((c) => c.tier === tiersToPlay[i])!;
        s = playCard(s, roster[i].id, card.id);
      }
      return s;
    },
  },
  'card-play-resolved-upset': {
    label: 'Card-play · F-BOMB',
    build: (count) => {
      let s = bootstrapToCardPlay(count);
      const roster = ROSTER.slice(0, count);
      // Force a trick with both S and F so the override fires. Tier-per-player:
      const tierForIndex: Array<'S' | 'A' | 'F' | 'B' | 'C' | 'D'> = ['S', 'A', 'F', 'B', 'C', 'D'];
      for (let i = 0; i < count; i++) {
        const tier = tierForIndex[i];
        const card = s.rounds[0].perPlayer[roster[i].id].hand!.find((c) => c.tier === tier)!;
        s = playCard(s, roster[i].id, card.id);
      }
      return resolveCurrentTrick(s);
    },
  },
  'card-play-late-round': {
    label: 'Card-play · trick 5 (full board)',
    build: (count) => {
      let s = bootstrapToCardPlay(count);
      const roster = ROSTER.slice(0, count);
      // Play through the first 4 tricks completely so the live tier list fills
      // up with 4 × playerCount cards before we land on trick 5.
      // We pick varied tiers per trick to spread cards across all six rows.
      const tierForTrickPlayer: Array<Array<'S' | 'A' | 'F' | 'B' | 'C' | 'D'>> = [
        ['S', 'A', 'B', 'C', 'D', 'F'],
        ['A', 'B', 'C', 'D', 'F', 'S'],
        ['B', 'C', 'D', 'F', 'S', 'A'],
        ['F', 'S', 'A', 'B', 'C', 'D'],
      ];
      for (let t = 0; t < 4; t++) {
        for (let i = 0; i < count; i++) {
          const tier = tierForTrickPlayer[t][i];
          const card = s.rounds[0].perPlayer[roster[i].id].hand!.find(
            (c) => c.tier === tier && !c.played,
          )!;
          s = playCard(s, roster[i].id, card.id);
        }
        s = resolveCurrentTrick(s);
        s = advanceAfterTrick(s);
      }
      // Trick 5: two players have played so far.
      const toPlay = Math.min(2, count);
      for (let i = 0; i < toPlay; i++) {
        const remaining = s.rounds[0].perPlayer[roster[i].id].hand!.find((c) => !c.played)!;
        s = playCard(s, roster[i].id, remaining.id);
      }
      return s;
    },
  },
  'end-reveal': {
    label: 'End reveal',
    build: (count) => bootstrapToEndReveal(count),
  },
  'final-score': {
    label: 'Final score',
    build: (count) => showFinalScore(bootstrapToEndReveal(count)),
  },
};

const PLAYER_COUNTS = [3, 4, 5, 6] as const;

export default function MockBigScreen() {
  const [fixtureKey, setFixtureKey] = useState<FixtureKey>('card-play-pending');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [devOpen, setDevOpen] = useState<boolean>(false);

  // `\` toggles the dev overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '\\') {
        // Ignore when typing in an input.
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setDevOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const room = useMemo(() => buildMockRoom(playerCount), [playerCount]);

  // Progressive-demo: when the fixture is "card-play-progressive":
  //   1. Play one card every ~900ms (drop-in animation).
  //   2. After all cards are down, wait ~1500ms then resolve the trick
  //      (banners slide up → tiers revealed).
  // The base state is memoised so card IDs stay stable across ticks —
  // already-mounted TierCards keep their key and don't re-animate.
  const [progressivePlayed, setProgressivePlayed] = useState(0);
  const [progressiveRevealed, setProgressiveRevealed] = useState(false);
  // Incremented on dismiss to re-run the progressive demo from the top.
  const [progressiveLoopTick, setProgressiveLoopTick] = useState(0);
  const progressiveBase = useMemo(
    () => buildFullProgressiveCardPlay(playerCount),
    [playerCount],
  );
  useEffect(() => {
    if (fixtureKey !== 'card-play-progressive') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgressivePlayed(0);
      setProgressiveRevealed(false);
      return;
    }
    setProgressivePlayed(0);
    setProgressiveRevealed(false);
    const timers: number[] = [];
    for (let i = 1; i <= playerCount; i++) {
      timers.push(window.setTimeout(() => setProgressivePlayed(i), 900 * i));
    }
    // Reveal beat: 1500ms after the last card lands.
    timers.push(
      window.setTimeout(() => setProgressiveRevealed(true), 900 * playerCount + 1500),
    );
    return () => timers.forEach(clearTimeout);
  }, [fixtureKey, playerCount, progressiveLoopTick]);

  const gameState = useMemo(() => {
    if (fixtureKey === 'card-play-progressive') {
      let state = sliceProgressiveCardPlay(progressiveBase, progressivePlayed);
      if (progressiveRevealed && progressivePlayed === playerCount) {
        state = resolveCurrentTrick(state);
      }
      return state;
    }
    return FIXTURES[fixtureKey].build(playerCount);
  }, [fixtureKey, playerCount, progressivePlayed, progressiveRevealed, progressiveBase]);

  // Mock dismiss: clicking a resolved trick loops the progressive demo back
  // to "no cards played" so the entry + winner + exit animations play again.
  // The reset must be synchronous (not from a useEffect) so the next render
  // already shows the cleared gameState — otherwise the cards flash back
  // into place between the animation finishing and the demo restarting.
  const handleDismiss = fixtureKey === 'card-play-progressive'
    ? () => {
        setProgressivePlayed(0);
        setProgressiveRevealed(false);
        setProgressiveLoopTick((n) => n + 1);
      }
    : undefined;

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      <BigScreenGame
        roomId={room.roomId}
        roomState={room}
        gameState={gameState}
        onDismiss={handleDismiss}
      />

      {/* Discoverability hint when dev panel is closed */}
      {!devOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 12,
            right: 16,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
            fontSize: '0.7rem',
            letterSpacing: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          press <kbd style={{ padding: '0 4px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3 }}>\</kbd> for dev
        </Box>
      )}

      {/* Dev overlay */}
      {devOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            bgcolor: 'rgba(10,10,20,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(4px)',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: 'rgba(255,255,255,0.6)', pl: 1, letterSpacing: 2 }}
          >
            DEV · {room.roomId}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>PLAYERS</Typography>
            <ToggleButtonGroup
              value={playerCount}
              exclusive
              size="small"
              onChange={(_, v) => v !== null && setPlayerCount(v)}
            >
              {PLAYER_COUNTS.map((n) => (
                <ToggleButton key={n} value={n} sx={{ fontSize: '0.7rem', px: 1.5 }}>
                  {n}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>FIXTURE</Typography>
            <ToggleButtonGroup
              value={fixtureKey}
              exclusive
              size="small"
              onChange={(_, v) => v && setFixtureKey(v)}
              sx={{ flexWrap: 'wrap' }}
            >
              {(Object.entries(FIXTURES) as [FixtureKey, { label: string }][]).map(([k, v]) => (
                <ToggleButton key={k} value={k} sx={{ fontSize: '0.65rem' }}>
                  {v.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Typography
            sx={{
              marginLeft: 'auto',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
              fontSize: '0.7rem',
              pr: 1,
            }}
          >
            <kbd style={{ padding: '0 4px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3 }}>\</kbd> to close
          </Typography>
        </Box>
      )}
    </Box>
  );
}
