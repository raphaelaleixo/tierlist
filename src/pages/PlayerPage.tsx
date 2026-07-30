import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayerScreen } from 'react-gameroom';
import { Box, CircularProgress, GlobalStyles, Stack } from '@mui/material';
import Logo from '../components/Logo';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { useGameState } from '../hooks/useGameState';
import PhoneGame from '../components/PhoneGame';
import AppHeader from '../components/AppHeader';
import { PLAYER_COLOR_HEX } from '../theme/theme';
import { pastelOnDark } from '../utils/blob';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

// PlayerScreen renders `<div className>{header}{body}</div>`. We make that
// div a full-height flex column so the AppHeader (header) takes its natural
// height and the phase body (renderStarted / renderReady) fills the rest —
// which is what lets the phases' `min-height: 100%` resolve against a
// definite height instead of collapsing to content (the "black space below"
// bug). `100svh` is the toolbar-visible height, so the shell never clips.
//
// `max-width` caps the whole phone experience at MUI's `Container
// maxWidth="xs"` (444px) and centres it, so on a wide desktop the player
// view renders at phone proportions instead of stretching the card
// carousel (whose cards are 60% of their parent width) across the viewport.
// This matches MockPlayerPhone, which caps the same way.
const PHONE_MAX_WIDTH = 444;
const playerScreenStyles = (
  <GlobalStyles
    styles={{
      '.tl-player-screen': {
        height: '100vh',
        maxWidth: PHONE_MAX_WIDTH,
        marginInline: 'auto',
        display: 'flex',
        flexDirection: 'column',
      },
      // `svh`, not `dvh`: `dvh` tracks the CURRENT viewport, so when Safari's
      // toolbar slides back into view the box shrinks and clips its content.
      // `svh` is the toolbar-visible height — it always fits, at the cost of
      // some dead space while the toolbar is hidden. Right trade for a fixed
      // app shell that must never clip.
      '@supports (height: 100svh)': {
        '.tl-player-screen': { height: '100svh' },
      },
    }}
  />
);

export default function PlayerPage() {
  const { id, playerId: playerIdStr } = useParams<{ id: string; playerId: string }>();
  const playerId = Number(playerIdStr);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { roomState, loading } = useFirebaseRoom(id);
  const { gameState, loading: gameLoading } = useGameState(id);

  useEffect(() => {
    if (loading || !roomState) return;
    const slot = roomState.players.find((p) => p.id === playerId);
    if (Number.isNaN(playerId) || !slot || slot.status === 'empty') {
      navigate(`/room/${id}/player`, { replace: true });
    }
  }, [loading, roomState, playerId, id, navigate]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!roomState) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
          px: 3,
          fontFamily: CARD_FONT,
          background: 'radial-gradient(120% 70% at 50% -10%, #17172e 0%, #0a0a14 60%)',
        }}
      >
        <Logo size={30} />
        <Box sx={{ fontFamily: CARD_FONT, fontWeight: 900, fontSize: '1.6rem', mt: 1 }}>
          {t('lobby.roomNotFound')}
        </Box>
        <Box sx={{ color: 'text.secondary', maxWidth: '34ch' }}>{t('lobby.roomNotFoundSubtitle')}</Box>
      </Box>
    );
  }

  const slot = roomState.players.find((p) => p.id === playerId);
  const color = slot?.data?.color;
  const colorHex = color ? PLAYER_COLOR_HEX[color] : '#3a3a52';

  return (
    <>
      {playerScreenStyles}
      <PlayerScreen
        className="tl-player-screen"
        roomState={roomState}
        playerId={playerId}
        // Render OUR chrome through the header slot so it shows consistently
        // across every player state (joining / ready / started).
        // Players are already seated — the room-code chip + rejoin/QR modal are
        // a big-screen/host tool, so the player header is just the brand.
        renderHeader={() => <AppHeader />}
        renderReady={() => (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 3,
              // Colour-tinted glow — continuity with the join screen.
              background: `radial-gradient(120% 60% at 50% 0%, ${pastelOnDark(colorHex, 0.32)} 0%, transparent 60%)`,
            }}
          >
            <Stack spacing={2.5} sx={{ alignItems: 'stretch', width: '100%', maxWidth: 340 }}>
              {/* Identity card — the "locked content" of this wait, mirroring
                  the join preview and the post-submit category card. */}
              <Box
                sx={{
                  borderRadius: '18px',
                  px: 3,
                  py: 3,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: `linear-gradient(to bottom, ${pastelOnDark(colorHex, 0.42)} 0%, ${pastelOnDark(colorHex, 0.16)} 100%)`,
                }}
              >
                <Box
                  sx={{
                    fontFamily: CARD_FONT,
                    fontWeight: 900,
                    fontSize: '2rem',
                    lineHeight: 1.05,
                    textTransform: 'uppercase',
                    wordBreak: 'break-word',
                    color: 'text.primary',
                  }}
                >
                  {slot?.name}
                </Box>
                <Box
                  sx={{
                    mt: 0.75,
                    fontFamily: CARD_FONT,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {t('player.youreIn')}
                </Box>
              </Box>

              {/* Waiting idiom — blinking uppercase label. */}
              <Box
                sx={{
                  fontFamily: CARD_FONT,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)',
                  animation: 'lockBlink 1.4s ease-in-out infinite',
                  '@keyframes lockBlink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.45 },
                  },
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
              >
                {t('lobby.waitingForPlayers')}
              </Box>
            </Stack>
          </Box>
        )}
        renderStarted={() => {
          if (gameLoading || !gameState) {
            return (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            );
          }
          return (
            // flex:1 child of the PlayerScreen flex column — gives PhoneGame a
            // definite height to fill (viewport minus header).
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <PhoneGame roomId={id!} roomState={roomState} gameState={gameState} myId={playerId} />
            </Box>
          );
        }}
      />
    </>
  );
}
