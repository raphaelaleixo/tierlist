import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ref, set } from 'firebase/database';
import { createInitialRoom, isLikelyMobileHost } from 'react-gameroom';
import { Box, Link } from '@mui/material';
import { database } from '../firebase';
import type { PlayerSlotData } from '../game/types';
import Logo from '../components/Logo';
import HomeTierBoard from '../components/HomeTierBoard';
import PageFooter from '../components/PageFooter';
import ShinyButton from '../components/ShinyButton';
import HostWarning from '../components/HostWarning';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hostWarningOpen, setHostWarningOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function createRoomAndNavigate() {
    setCreating(true);
    const room = createInitialRoom<PlayerSlotData>({
      minPlayers: 3,
      maxPlayers: 6,
      requireFull: false,
    });
    await set(ref(database, `rooms/${room.roomId}/state`), room);
    navigate(`/room/${room.roomId}`);
  }

  function handleNewGame() {
    if (isLikelyMobileHost()) {
      setHostWarningOpen(true);
      return;
    }
    void createRoomAndNavigate();
  }

  return (
    <Box
      sx={{
        // Fill exactly one viewport — the whole home fits without scrolling.
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: CARD_FONT,
        background:
          'radial-gradient(130% 90% at 15% -10%, #17172e 0%, #0a0a14 55%) fixed',
        px: { xs: 3, sm: 5 },
        py: { xs: 2.5, sm: 3 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 720,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Logo size={60} />

          <Box
            component="p"
            sx={{
              m: 0,
              fontSize: { xs: '1.05rem', sm: '1.3rem' },
              lineHeight: 1.5,
              color: 'text.secondary',
              maxWidth: '34ch',
            }}
          >
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 800 }}>
              {t('home.taglineLead')}
            </Box>{' '}
            {t('home.taglineDetail')}
          </Box>

          <HomeTierBoard />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, sm: 2.5 },
              flexWrap: 'wrap',
              pt: 0.5,
            }}
          >
            <ShinyButton
              accent="#ffce1c"
              variant="primary"
              onClick={handleNewGame}
              disabled={creating}
            >
              <Box
                sx={{
                  fontFamily: CARD_FONT,
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  letterSpacing: 0.5,
                  px: 2.5,
                  py: 0.5,
                }}
              >
                {t('home.newGame')}
              </Box>
            </ShinyButton>
            <Link
              component={RouterLink}
              to="/join"
              underline="hover"
              sx={{ color: 'text.secondary', fontWeight: 700 }}
            >
              {t('home.resumeGame')}
            </Link>
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.25)' }}>
              ·
            </Box>
            <Link
              component={RouterLink}
              to="/how-to-play"
              underline="hover"
              sx={{ color: 'text.secondary', fontWeight: 700 }}
            >
              {t('home.howToPlay')}
            </Link>
          </Box>
        </Box>

        <PageFooter />
      </Box>

      <HostWarning
        open={hostWarningOpen}
        onConfirm={() => {
          setHostWarningOpen(false);
          void createRoomAndNavigate();
        }}
        onCancel={() => setHostWarningOpen(false)}
      />
    </Box>
  );
}
