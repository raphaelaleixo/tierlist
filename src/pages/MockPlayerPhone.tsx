import { useMemo, useState } from 'react';
import { Box, Container, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { createInitialRoom, joinPlayer } from 'react-gameroom';
import type { GameState, PlayerSlotData, TierList } from '../game/types';
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
import PhoneGame from '../components/PhoneGame';
import type { TierRoomState } from '../hooks/useFirebaseRoom';

const IDENTITY_SHUFFLE = <T,>(arr: T[]): T[] => [...arr];

function buildMockRoom(): TierRoomState {
  let r = createInitialRoom<PlayerSlotData>({ minPlayers: 3, maxPlayers: 6, requireFull: false });
  r = { ...r, roomId: 'MOCKP' };
  r = joinPlayer(r, 1, 'Alice', { color: 'red' });
  r = joinPlayer(r, 2, 'Bob', { color: 'cyan' });
  r = joinPlayer(r, 3, 'Carol', { color: 'yellow' });
  r = joinPlayer(r, 4, 'Dan', { color: 'magenta' });
  return { ...r, status: 'started' };
}

const makeList = (items: [string, string, string, string, string, string]): TierList => ({
  S: items[0], A: items[1], B: items[2], C: items[3], D: items[4], F: items[5],
});

const SEATING = [1, 2, 3, 4];

function bootstrapToCardPlay(): GameState {
  let s = createInitialGameState(SEATING, 1);
  s = submitCategory(s, 1, { name: 'Animals', emoji: '🐾' });
  s = submitCategory(s, 2, { name: 'TV shows', emoji: '📺' });
  s = submitCategory(s, 3, { name: '90s movies', emoji: '📼' });
  s = submitCategory(s, 4, { name: 'Snacks', emoji: '🍿' });
  s = startTierWriting(s);
  // R1 pass=left: each player WRITES for the category their right neighbour picked.
  //   Alice (1) writes TV       (Bob picked TV for her)
  //   Bob   (2) writes Movies   (Carol picked 90s for him)
  //   Carol (3) writes Snacks   (Dan picked Snacks for her)
  //   Dan   (4) writes Animals  (Alice picked Animals for him)
  s = submitTierList(s, 1, makeList(['The Wire', 'Lost', 'Breaking Bad', 'The Office', 'Glee', 'Big Bang']));
  s = submitTierList(s, 2, makeList(['Fight Club', 'Pulp Fiction', 'Matrix', 'Titanic', 'Twister', 'Wild Wild West']));
  s = submitTierList(s, 3, makeList(['Cheetos', 'Doritos', 'Pringles', 'Lays', 'Twinkies', 'Black licorice']));
  s = submitTierList(s, 4, makeList(['Cat', 'Dog', 'Hamster', 'Snake', 'Spider', 'Cockroach']));
  s = dealHands(s, IDENTITY_SHUFFLE);
  s = startCardPlay(s);
  return s;
}

function fullToEndGame(): GameState {
  let s = bootstrapToCardPlay();
  for (let i = 0; i < 5; i++) {
    for (const pid of SEATING) {
      const next = s.rounds[0].perPlayer[pid].hand!.find((c) => !c.played)!;
      s = playCard(s, pid, next.id);
    }
    s = resolveCurrentTrick(s);
    if (i < 4) s = advanceAfterTrick(s);
  }
  s = startRound2(s);
  s = submitCategory(s, 1, { name: 'Bands', emoji: '🎸' });
  s = submitCategory(s, 2, { name: 'Pizza toppings', emoji: '🍕' });
  s = submitCategory(s, 3, { name: 'Cereals', emoji: '🥣' });
  s = submitCategory(s, 4, { name: 'Cars', emoji: '🚗' });
  s = startTierWriting(s);
  // R2 pass=right: each player WRITES for the category their LEFT neighbour picked.
  //   Alice (1) writes Cars     (Dan picked Cars for her)
  //   Bob   (2) writes Bands    (Alice picked Bands for him)
  //   Carol (3) writes Pizza    (Bob picked Pizza for her)
  //   Dan   (4) writes Cereals  (Carol picked Cereals for him)
  s = submitTierList(s, 1, makeList(['Mustang', 'Civic', 'Beetle', 'Corolla', 'Hummer', 'PT Cruiser']));
  s = submitTierList(s, 2, makeList(['Beatles', 'Queen', 'ABBA', 'Coldplay', 'Nickelback', 'Creed']));
  s = submitTierList(s, 3, makeList(['Pepperoni', 'Mushroom', 'Olive', 'Ham', 'Onion', 'Pineapple']));
  s = submitTierList(s, 4, makeList(['Cheerios', 'Frosted Flakes', 'Lucky Charms', 'Corn Pops', 'Raisin Bran', 'All-Bran']));
  s = dealHands(s, IDENTITY_SHUFFLE);
  s = startCardPlay(s);
  for (let i = 0; i < 5; i++) {
    for (const pid of SEATING) {
      const next = s.rounds[1]!.perPlayer[pid].hand!.find((c) => !c.played)!;
      s = playCard(s, pid, next.id);
    }
    s = resolveCurrentTrick(s);
    if (i < 4) s = advanceAfterTrick(s);
  }
  return endGame(s);
}

type FixtureKey =
  | 'cat-pick-mid'
  | 'tier-writing-fresh'
  | 'card-play-pending'
  | 'card-play-resolved-upset'
  | 'end-reveal'
  | 'final-score';

const FIXTURES: Record<FixtureKey, { label: string; build: () => GameState }> = {
  'cat-pick-mid': {
    label: 'Cat-pick · 2 in',
    build: () => {
      let s = createInitialGameState(SEATING, 1);
      s = submitCategory(s, 1, { name: 'Animals', emoji: '🐾' });
      s = submitCategory(s, 2, { name: 'TV shows', emoji: '📺' });
      return s;
    },
  },
  'tier-writing-fresh': {
    label: 'Tier-writing · fresh',
    build: () => {
      let s = createInitialGameState(SEATING, 1);
      s = submitCategory(s, 1, { name: 'Animals', emoji: '🐾' });
      s = submitCategory(s, 2, { name: 'TV shows', emoji: '📺' });
      s = submitCategory(s, 3, { name: '90s movies', emoji: '📼' });
      s = submitCategory(s, 4, { name: 'Snacks', emoji: '🍿' });
      return startTierWriting(s);
    },
  },
  'card-play-pending': {
    label: 'Card-play · 2/4 played',
    build: () => {
      let s = bootstrapToCardPlay();
      s = playCard(s, 1, s.rounds[0].perPlayer[1].hand!.find((c) => c.tier === 'S')!.id);
      s = playCard(s, 2, s.rounds[0].perPlayer[2].hand!.find((c) => c.tier === 'A')!.id);
      return s;
    },
  },
  'card-play-resolved-upset': {
    label: 'Card-play · UPSET',
    build: () => {
      let s = bootstrapToCardPlay();
      s = playCard(s, 1, s.rounds[0].perPlayer[1].hand!.find((c) => c.tier === 'S')!.id);
      s = playCard(s, 2, s.rounds[0].perPlayer[2].hand!.find((c) => c.tier === 'A')!.id);
      s = playCard(s, 3, s.rounds[0].perPlayer[3].hand!.find((c) => c.tier === 'F')!.id);
      s = playCard(s, 4, s.rounds[0].perPlayer[4].hand!.find((c) => c.tier === 'B')!.id);
      return resolveCurrentTrick(s);
    },
  },
  'end-reveal': { label: 'End reveal', build: () => fullToEndGame() },
  'final-score': { label: 'Final score', build: () => showFinalScore(fullToEndGame()) },
};

export default function MockPlayerPhone() {
  const [fixtureKey, setFixtureKey] = useState<FixtureKey>('cat-pick-mid');
  const [seatId, setSeatId] = useState<number>(1);
  const room = useMemo(() => buildMockRoom(), []);
  const gameState = useMemo(() => FIXTURES[fixtureKey].build(), [fixtureKey]);

  return (
    <Box
      sx={{
        // Flex column so the dev toolbar takes its natural height and the
        // wrapped PhoneGame fills the rest of the viewport — no overflow.
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: '0 0 auto',
          zIndex: 10,
          bgcolor: 'rgba(10,10,20,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          p: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="overline" color="text.secondary" sx={{ pl: 1 }}>
          MOCK PHONE · {room.roomId}
        </Typography>
        <ToggleButtonGroup
          value={seatId}
          exclusive
          size="small"
          onChange={(_, v) => v !== null && setSeatId(v)}
        >
          {SEATING.map((pid) => (
            <ToggleButton key={pid} value={pid} sx={{ fontSize: '0.6rem', px: 1.5 }}>
              {room.players.find((p) => p.id === pid)?.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={fixtureKey}
          exclusive
          size="small"
          onChange={(_, v) => v && setFixtureKey(v)}
          sx={{ flexWrap: 'wrap' }}
        >
          {(Object.entries(FIXTURES) as [FixtureKey, { label: string }][]).map(([k, v]) => (
            <ToggleButton key={k} value={k} sx={{ fontSize: '0.6rem' }}>
              {v.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Container
        disableGutters
        maxWidth="xs"
        sx={{ mx: 'auto', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <PhoneGame roomId={room.roomId} roomState={room} gameState={gameState} myId={seatId} />
      </Container>
    </Box>
  );
}
