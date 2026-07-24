import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findFirstEmptySlot, joinPlayer, type RoomState } from 'react-gameroom';
import {
  Box,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { PLAYER_COLORS, type PlayerColor, type PlayerSlotData } from '../game/types';
import { PLAYER_COLOR_HEX } from '../theme/theme';
import { pastelOnDark } from '../utils/blob';
import Logo from '../components/Logo';
import ShinyButton from '../components/ShinyButton';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

// Neutral dark brand ground shared by the player-route message/edge screens.
const NEUTRAL_BG =
  'radial-gradient(120% 70% at 50% -10%, #17172e 0%, #0a0a14 60%) fixed';
function phoneScreen() {
  return {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: CARD_FONT,
    background: NEUTRAL_BG,
    px: 3,
    py: 4,
  };
}

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
      <Box sx={{ ...phoneScreen(), alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!roomState) {
    return (
      <Box sx={{ ...phoneScreen(), alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2.5 }}>
        <Logo size={30} />
        <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, fontSize: '1.6rem', mt: 1 }}>
          {t('lobby.roomNotFound')}
        </Box>
        <Box sx={{ color: 'text.secondary', maxWidth: '34ch' }}>{t('lobby.roomNotFoundSubtitle')}</Box>
        <ShinyButton accent="#3ce0ff" variant="primary" onClick={() => navigate('/')}>
          <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, px: 2, py: 0.5 }}>{t('lobby.backHome')}</Box>
        </ShinyButton>
      </Box>
    );
  }

  if (roomState.status === 'started') {
    return <RejoinView id={id!} roomState={roomState} />;
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

  const selectedHex = color ? PLAYER_COLOR_HEX[color] : null;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: CARD_FONT,
        background: selectedHex
          ? `radial-gradient(120% 70% at 50% -10%, ${pastelOnDark(selectedHex, 0.5)} 0%, #0a0a14 60%) fixed`
          : 'radial-gradient(120% 70% at 50% -10%, #17172e 0%, #0a0a14 60%) fixed',
        transition: 'background 400ms ease',
        px: 3,
        py: 4,
      }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
        {/* Top bar: brand + room chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={24} />
          <Box
            sx={{
              fontFamily: CARD_FONT,
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px',
              px: 1.25,
              py: 0.5,
            }}
          >
            {t('join.roomChip', 'Room')} · {roomState.roomId}
          </Box>
        </Box>

        {/* Live identity preview — exactly how you'll appear in the lobby. */}
        <Box
          sx={{
            borderRadius: '18px',
            minHeight: 136,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            px: 2.5,
            py: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: selectedHex ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.1)',
            background: selectedHex
              ? `linear-gradient(to bottom, ${pastelOnDark(selectedHex, 0.42)} 0%, ${pastelOnDark(selectedHex, 0.16)} 100%)`
              : 'rgba(255,255,255,0.04)',
            transition: 'background 300ms ease, border-color 300ms ease',
          }}
        >
          <Box
            sx={{
              fontFamily: CARD_FONT,
              fontWeight: 900,
              fontSize: '2.1rem',
              lineHeight: 1.05,
              textTransform: 'uppercase',
              textAlign: 'center',
              wordBreak: 'break-word',
              color: name.trim() ? 'text.primary' : 'rgba(255,255,255,0.32)',
            }}
          >
            {name.trim() || t('join.namePlaceholder')}
          </Box>
          <Box
            sx={{
              fontFamily: CARD_FONT,
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: selectedHex ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
            }}
          >
            {selectedHex ? t('join.thisIsYou', "That's you") : t('join.pickColorHint', 'Pick your colour')}
          </Box>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{ display: 'block', mb: 1.25, color: 'text.secondary', letterSpacing: '0.18em' }}
          >
            {t('join.nameLabel')}
          </Typography>
          <TextField
            placeholder={t('join.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { maxLength: 16, autoCapitalize: 'words' } }}
            sx={{
              // Match the app's input convention (see PhoneCategoryPick): a dark
              // pill, uppercase Bricolage, focus border in the chosen colour.
              '& .MuiInputBase-root': {
                minHeight: 56,
                bgcolor: 'rgba(0,0,0,0.25)',
                fontFamily: CARD_FONT,
                fontWeight: 700,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                '&:hover fieldset': {
                  borderColor: selectedHex ? pastelOnDark(selectedHex, 0.6) : 'rgba(255,255,255,0.32)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: selectedHex ?? 'rgba(255,255,255,0.5)',
                  borderWidth: 2,
                },
              },
              '& .MuiInputBase-input': { py: 0, textTransform: 'uppercase' },
              '& .MuiInputBase-input::placeholder': { textTransform: 'uppercase' },
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={{ display: 'block', mb: 1.25, color: 'text.secondary', letterSpacing: '0.18em' }}
          >
            {t('join.pickColor')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.25 }}>
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
                    borderRadius: '30% 70% 62% 38% / 42% 40% 60% 58%',
                    bgcolor: PLAYER_COLOR_HEX[c],
                    opacity: taken ? 0.15 : 1,
                    cursor: taken ? 'not-allowed' : 'pointer',
                    border: '3px solid',
                    borderColor: selected ? '#fff' : 'transparent',
                    boxShadow: selected ? `0 0 18px ${PLAYER_COLOR_HEX[c]}` : 'none',
                    transition: 'transform 140ms, border-color 140ms, box-shadow 140ms, border-radius 200ms',
                    transform: selected ? 'scale(1.12)' : 'scale(1)',
                    position: 'relative',
                    '&::after': taken
                      ? {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'inherit',
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

        <ShinyButton
          accent={selectedHex ?? '#5a5a70'}
          variant="primary"
          disabled={!canSubmit}
          onClick={handleJoin}
        >
          <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, fontSize: '1.05rem', letterSpacing: 1, py: 0.5 }}>
            {submitting ? t('join.submitting') : t('join.submit')}
          </Box>
        </ShinyButton>
      </Stack>
    </Box>
  );
}

// Rejoin seat-picker — reached at /room/:id/player once the game has started.
// Each seat is a colour-gradient identity card (same language as the lobby
// cell / ready screen) so a returning player finds their seat by colour + name.
function RejoinView({ id, roomState }: { id: string; roomState: RoomState<PlayerSlotData> }) {
  const { t } = useTranslation();
  const filled = roomState.players.filter((p) => p.status !== 'empty');
  return (
    <Box sx={phoneScreen()}>
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={24} />
          <Box
            sx={{
              fontFamily: CARD_FONT,
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px',
              px: 1.25,
              py: 0.5,
            }}
          >
            {t('join.roomChip')} · {roomState.roomId}
          </Box>
        </Box>

        <Box>
          <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, fontSize: '2rem', lineHeight: 1.05 }}>
            {t('join.rejoinTitle')}
          </Box>
          <Box sx={{ color: 'text.secondary', mt: 0.75 }}>{t('join.rejoinBody')}</Box>
        </Box>

        <Stack spacing={1.5}>
          {filled.map((slot) => {
            const hex = slot.data?.color ? PLAYER_COLOR_HEX[slot.data.color] : null;
            return (
              <Box
                key={slot.id}
                component={RouterLink}
                to={`/room/${id}/player/${slot.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  textDecoration: 'none',
                  color: 'text.primary',
                  borderRadius: '16px',
                  px: 2.5,
                  py: 2,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: hex
                    ? `linear-gradient(to bottom, ${pastelOnDark(hex, 0.42)} 0%, ${pastelOnDark(hex, 0.16)} 100%)`
                    : 'rgba(255,255,255,0.05)',
                  transition: 'transform 120ms ease, filter 120ms ease',
                  '&:hover, &:focus-visible': {
                    transform: 'translateY(-2px)',
                    filter: 'brightness(1.12)',
                    outline: 'none',
                  },
                }}
              >
                <Box>
                  <Box
                    sx={{
                      fontFamily: CARD_FONT,
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {slot.status === 'ready' ? t('lobby.ready') : t('join.submitting')}
                  </Box>
                  <Box
                    sx={{
                      fontFamily: CARD_FONT,
                      fontWeight: 900,
                      fontSize: '1.5rem',
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                      wordBreak: 'break-word',
                    }}
                  >
                    {slot.name ?? `Player ${slot.id}`}
                  </Box>
                </Box>
                <Box sx={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.65)', flex: 'none' }}>→</Box>
              </Box>
            );
          })}
        </Stack>

        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{ color: 'text.secondary', fontWeight: 700, alignSelf: 'flex-start' }}
        >
          ← {t('lobby.backHome')}
        </Link>
      </Stack>
    </Box>
  );
}
