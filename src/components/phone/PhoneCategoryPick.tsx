import { useMemo, useState } from 'react';
import { Box, Button, Chip, Container, Stack, TextField, Typography } from '@mui/material';
import type { CategoryChoice, GameState } from '../../game/types';
import { submitCategory, writerOf } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import { DEFAULT_CATEGORY_EMOJI, pickRandomSuggestions } from '../../data/categorySuggestions';
import type { PlayerMeta } from '../big-screen/playerMeta';
import PhoneWaiting from './PhoneWaiting';

interface Props {
  roomId: string;
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

export default function PhoneCategoryPick({ roomId, gameState, myId, meta }: Props) {
  const round = gameState.rounds[gameState.currentRoundIndex]!;
  const myEntry = round.perPlayer[myId];
  const already = myEntry?.categoryAssigned ?? null;
  const recipientId = writerOf(gameState.seating, myId, round.passDirection);
  const recipientName = meta[recipientId]?.name ?? `Player ${recipientId}`;

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const suggestions = useMemo(() => pickRandomSuggestions(3), []);

  if (already !== null) {
    return (
      <PhoneWaiting
        title="LOCKED IN"
        subtitle={`You picked “${already.emoji} ${already.name}” for ${recipientName}.`}
      />
    );
  }

  async function handleSubmit(choice: CategoryChoice) {
    if (!choice.name.trim()) return;
    setSubmitting(true);
    try {
      await writeGameState(
        roomId,
        submitCategory(gameState, myId, { name: choice.name.trim(), emoji: choice.emoji }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            ROUND {round.number} · PHASE 1
          </Typography>
          <Typography variant="h5" sx={{ color: 'primary.main', mt: 1 }}>
            PICK A CATEGORY
          </Typography>
          <Typography sx={{ mt: 1 }}>
            for <strong style={{ color: meta[recipientId]?.colorHex }}>{recipientName}</strong>{' '}
            to tier (they'll play your hand).
          </Typography>
        </Box>

        <TextField
          label="Category"
          placeholder="e.g. Animals, 90s movies, snacks…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 40 } }}
        />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Or pick a suggestion
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((s) => (
              <Chip
                key={s.name}
                label={`${s.emoji} ${s.name}`}
                onClick={() => void handleSubmit(s)}
                disabled={submitting}
                sx={{
                  fontSize: '0.85rem',
                  border: '1px solid rgba(255,255,255,0.18)',
                  bgcolor: 'transparent',
                  color: 'text.primary',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Button
          variant="contained"
          size="large"
          disabled={!text.trim() || submitting}
          onClick={() => void handleSubmit({ name: text, emoji: DEFAULT_CATEGORY_EMOJI })}
        >
          LOCK IT IN
        </Button>
      </Stack>
    </Container>
  );
}
