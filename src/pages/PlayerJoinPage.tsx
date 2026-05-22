import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findFirstEmptySlot, joinPlayer, PlayerSlotsGrid } from 'react-gameroom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { PLAYER_COLORS, type PlayerColor } from '../game/types';
import { PLAYER_COLOR_HEX } from '../theme/theme';

export default function PlayerJoinPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { roomState, loading, updateRoom } = useFirebaseRoom(id);
  const [name, setName] = useState('');
  const [color, setColor] = useState<PlayerColor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takenColors = useMemo<Set<PlayerColor>>(() => {
    if (!roomState) return new Set();
    return new Set(
      roomState.players
        .filter((p) => p.status !== 'empty' && p.data?.color)
        .map((p) => p.data!.color),
    );
  }, [roomState]);

  if (loading) {
    return (
      <Container sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!roomState) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{t('lobby.roomNotFound')}</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>{t('lobby.roomNotFoundSubtitle')}</Typography>
        <Button variant="contained" component={RouterLink} to="/">{t('lobby.backHome')}</Button>
      </Container>
    );
  }

  if (roomState.status === 'started') {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>{t('join.alreadyStartedTitle')}</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{t('join.alreadyStartedSubtitle')}</Typography>
        <PlayerSlotsGrid
          players={roomState.players}
          filterEmpty
          buildSlotHref={(playerId) => `/room/${id}/player/${playerId}`}
        />
      </Container>
    );
  }

  async function handleJoin() {
    if (!name.trim() || !color || !roomState) return;
    setError(null);

    if (takenColors.has(color)) {
      setError(t('join.colorTaken'));
      setColor(null);
      return;
    }

    const slot = findFirstEmptySlot(roomState.players);
    if (!slot) {
      setError(t('join.roomFull'));
      return;
    }

    setSubmitting(true);
    try {
      await updateRoom(joinPlayer(roomState, slot.id, name.trim(), { color }));
      navigate(`/room/${id}/player/${slot.id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  const canSubmit = !!name.trim() && !!color && !submitting;

  return (
    <Container maxWidth="xs" sx={{ py: 5 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            ROOM
          </Typography>
          <Typography variant="h4" sx={{ color: 'primary.main', letterSpacing: 4 }}>
            {roomState.roomId}
          </Typography>
        </Box>

        <TextField
          label={t('join.nameLabel')}
          placeholder={t('join.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 16, autoCapitalize: 'words' } }}
        />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            {t('join.pickColor')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
            {PLAYER_COLORS.map((c) => {
              const taken = takenColors.has(c);
              const selected = color === c;
              return (
                <Box
                  key={c}
                  role="button"
                  aria-label={c}
                  aria-pressed={selected}
                  aria-disabled={taken}
                  onClick={() => !taken && setColor(c)}
                  sx={{
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    bgcolor: PLAYER_COLOR_HEX[c],
                    opacity: taken ? 0.15 : 1,
                    cursor: taken ? 'not-allowed' : 'pointer',
                    border: '3px solid',
                    borderColor: selected ? '#fff' : 'transparent',
                    boxShadow: selected ? `0 0 16px ${PLAYER_COLOR_HEX[c]}` : 'none',
                    transition: 'transform 120ms, border-color 120ms, box-shadow 120ms',
                    transform: selected ? 'scale(1.08)' : 'scale(1)',
                    position: 'relative',
                    '&::after': taken
                      ? {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background:
                            'linear-gradient(45deg, transparent calc(50% - 1.5px), #fff calc(50% - 1.5px), #fff calc(50% + 1.5px), transparent calc(50% + 1.5px))',
                          opacity: 0.6,
                        }
                      : undefined,
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {error}
          </Typography>
        )}

        <Button variant="contained" size="large" disabled={!canSubmit} onClick={handleJoin}>
          {submitting ? t('join.submitting') : t('join.submit')}
        </Button>
      </Stack>
    </Container>
  );
}
