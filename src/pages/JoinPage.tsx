import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isLikelyMobileHost } from 'react-gameroom';
import { Box, Stack, TextField } from '@mui/material';
import { roomExists } from '../hooks/useFirebaseRoom';
import Logo from '../components/Logo';
import ShinyButton from '../components/ShinyButton';
import HostWarning from '../components/HostWarning';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';
const NEUTRAL_BG =
  'radial-gradient(120% 70% at 50% -10%, #17172e 0%, #0a0a14 60%) fixed';

type Role = 'host' | 'player' | null;

// Resume-by-code entry (reached from the homepage "Resume game"): type a room
// code, then open the big screen (host) or hop in as a player. Mirrors
// colorlition's JoinPage flow, in tierlist's brand.
export default function JoinPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Role>(null);
  const [pendingHostCode, setPendingHostCode] = useState<string | null>(null);

  const trimmed = code.trim().toUpperCase();
  const disabled = submitting !== null || trimmed.length === 0;

  const resolve = useCallback(
    async (role: Exclude<Role, null>) => {
      setError(null);
      setSubmitting(role);
      const exists = await roomExists(trimmed);
      setSubmitting(null);
      if (!exists) {
        setError(t('codeEntry.notFound'));
        return false;
      }
      return true;
    },
    [trimmed, t],
  );

  const handleHost = useCallback(async () => {
    if (!trimmed || disabled) return;
    if (!(await resolve('host'))) return;
    if (isLikelyMobileHost()) {
      setPendingHostCode(trimmed);
      return;
    }
    navigate(`/room/${trimmed}`);
  }, [trimmed, disabled, resolve, navigate]);

  const handlePlayer = useCallback(async () => {
    if (!trimmed || submitting !== null) return;
    if (!(await resolve('player'))) return;
    navigate(`/room/${trimmed}/player`);
  }, [trimmed, submitting, resolve, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: CARD_FONT,
        background: NEUTRAL_BG,
        px: 3,
        py: 4,
      }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 400, justifyContent: 'center' }}>
        <Logo size={30} />

        <Box>
          <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, fontSize: '2rem', lineHeight: 1.05 }}>
            {t('codeEntry.title')}
          </Box>
          <Box sx={{ color: 'text.secondary', mt: 0.75 }}>{t('codeEntry.subtitle')}</Box>
        </Box>

        <TextField
          placeholder={t('codeEntry.codePlaceholder')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleHost();
            }
          }}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 8, autoCapitalize: 'characters', autoComplete: 'off' } }}
          sx={{
            '& .MuiInputBase-root': {
              minHeight: 64,
              bgcolor: 'rgba(0,0,0,0.25)',
              fontFamily: CARD_FONT,
              fontWeight: 900,
              fontSize: '1.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
              '&.Mui-focused fieldset': { borderColor: '#3ce0ff', borderWidth: 2 },
            },
            '& .MuiInputBase-input': { py: 0, textAlign: 'center' },
            '& .MuiInputBase-input::placeholder': { letterSpacing: '0.2em', opacity: 0.35 },
          }}
        />

        {error && (
          <Box sx={{ color: 'error.main', fontSize: '0.9rem', textAlign: 'center' }}>{error}</Box>
        )}

        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <ShinyButton accent="#ffce1c" variant="primary" fullWidth disabled={disabled} onClick={handleHost}>
            <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, fontSize: '1.05rem', letterSpacing: 0.5, py: 0.5 }}>
              {submitting === 'host' ? t('codeEntry.hostBusy') : t('codeEntry.host')}
            </Box>
          </ShinyButton>
          <Box
            component="button"
            type="button"
            onClick={handlePlayer}
            disabled={disabled}
            sx={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: CARD_FONT,
              fontWeight: 700,
              fontSize: '0.98rem',
              color: 'text.secondary',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              '&:hover': { color: 'text.primary' },
              '&:disabled': { opacity: 0.5, cursor: 'default' },
            }}
          >
            {submitting === 'player' ? t('codeEntry.playerBusy') : t('codeEntry.player')}
          </Box>
        </Stack>
      </Stack>

      <HostWarning
        open={pendingHostCode !== null}
        onConfirm={() => {
          const c = pendingHostCode;
          setPendingHostCode(null);
          if (c) navigate(`/room/${c}`);
        }}
        onCancel={() => setPendingHostCode(null)}
      />
    </Box>
  );
}
