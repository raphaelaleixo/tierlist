import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import type { GameState, Tier, TierList } from '../../game/types';
import { TIERS } from '../../game/types';
import { assignerOf, writerOf, submitTierList } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import type { PlayerMeta } from '../big-screen/playerMeta';
import PhoneWaiting from './PhoneWaiting';

const RECAP_DURATION_MS = 8000;

interface Props {
  roomId: string;
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

const blankList = (): Record<Tier, string> => ({ S: '', A: '', B: '', C: '', D: '', F: '' });

export default function PhoneTierWriting({ roomId, gameState, myId, meta }: Props) {
  const round = gameState.rounds[gameState.currentRoundIndex]!;
  const myEntry = round.perPlayer[myId];
  const already = myEntry?.tierListWritten ?? null;

  // The neighbour who PICKED a category for me — I'm writing in their category
  const assignerId = assignerOf(gameState.seating, myId, round.passDirection);
  const myCategoryChoice = round.perPlayer[assignerId]?.categoryAssigned ?? null;
  const myCategory = myCategoryChoice
    ? `${myCategoryChoice.emoji} ${myCategoryChoice.name}`
    : '—';
  // The neighbour who will PLAY my tier list (same as assigner — they pick, they play)
  const willPlayId = writerOf(gameState.seating, myId, round.passDirection);
  const willPlayName = meta[willPlayId]?.name ?? `Player ${willPlayId}`;
  const willPlayColor = meta[willPlayId]?.colorHex;

  const [draft, setDraft] = useState<Record<Tier, string>>(blankList);
  const [submitting, setSubmitting] = useState(false);
  const [recapVisible, setRecapVisible] = useState(false);

  useEffect(() => {
    if (!recapVisible) return;
    const t = setTimeout(() => setRecapVisible(false), RECAP_DURATION_MS);
    return () => clearTimeout(t);
  }, [recapVisible]);

  const allFilled = useMemo(() => TIERS.every((t) => draft[t].trim().length > 0), [draft]);

  async function handleSubmit() {
    if (!allFilled) return;
    setSubmitting(true);
    const list: TierList = { S: draft.S.trim(), A: draft.A.trim(), B: draft.B.trim(), C: draft.C.trim(), D: draft.D.trim(), F: draft.F.trim() };
    try {
      await writeGameState(roomId, submitTierList(gameState, myId, list));
      setRecapVisible(true);
    } finally {
      setSubmitting(false);
    }
  }

  // Recap shown if I just submitted locally. After 8s, drop to PhoneWaiting
  // (driver advances phase soon after if all others have submitted).
  if (recapVisible && already) {
    return <RecapView list={already} willPlayName={willPlayName} willPlayColor={willPlayColor} category={myCategory} />;
  }

  // Already submitted (e.g., reload after submit) — just wait.
  if (already !== null) {
    return <PhoneWaiting title="WAITING" subtitle="Tier list locked in. Remember it." />;
  }

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            ROUND {round.number} · PHASE 2
          </Typography>
          <Typography variant="h5" sx={{ color: 'primary.main', mt: 1 }}>
            TIER LIST
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <strong style={{ color: willPlayColor }}>{willPlayName}</strong> will play these in{' '}
            <strong>{myCategory}</strong>.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {TIERS.map((t) => (
            <Box key={t} sx={{ display: 'flex', alignItems: 'stretch', gap: 1.5 }}>
              <Box
                sx={{
                  width: 52,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'rgba(255,255,255,0.16)',
                  borderRadius: 1,
                  fontFamily: '"Pixelify Sans", monospace',
                  fontSize: '1.4rem',
                  color: 'primary.main',
                }}
              >
                {t}
              </Box>
              <TextField
                placeholder={t === 'S' ? 'Favourite' : t === 'F' ? 'Hated' : ''}
                value={draft[t]}
                onChange={(e) => setDraft({ ...draft, [t]: e.target.value })}
                fullWidth
                slotProps={{ htmlInput: { maxLength: 32 } }}
              />
            </Box>
          ))}
        </Stack>

        <Button variant="contained" size="large" disabled={!allFilled || submitting} onClick={() => void handleSubmit()}>
          LOCK IT IN
        </Button>
      </Stack>
    </Container>
  );
}

function RecapView({ list, willPlayName, willPlayColor, category }: { list: TierList; willPlayName: string; willPlayColor?: string; category: string }) {
  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              animation: 'blink 0.8s steps(2,end) infinite',
              '@keyframes blink': { '50%': { opacity: 0.35 } },
            }}
          >
            REMEMBER THIS
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>{category}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            <span style={{ color: willPlayColor }}>{willPlayName}</span> will play these.
          </Typography>
        </Box>
        <Stack spacing={0.75}>
          {TIERS.map((t) => (
            <Box
              key={t}
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 1,
                bgcolor: 'background.paper',
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                borderRadius: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Pixelify Sans", monospace',
                  fontSize: '1.1rem',
                  color: 'primary.main',
                  width: 28,
                  textAlign: 'center',
                }}
              >
                {t}
              </Typography>
              <Typography sx={{ flex: 1, fontWeight: 600 }}>{list[t]}</Typography>
            </Box>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          This screen disappears in a moment.
        </Typography>
      </Stack>
    </Container>
  );
}
