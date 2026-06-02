import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayerScreen } from 'react-gameroom';
import { Box, CircularProgress, Container, GlobalStyles, Stack, Typography } from '@mui/material';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { useGameState } from '../hooks/useGameState';
import PhoneGame from '../components/PhoneGame';
import AppHeader from '../components/AppHeader';
import { PLAYER_COLOR_HEX } from '../theme/theme';

// PlayerScreen renders `<div className>{header}{body}</div>`. We make that
// div a full-height flex column so the AppHeader (header) takes its natural
// height and the phase body (renderStarted / renderReady) fills the rest —
// which is what lets the phases' `min-height: 100%` resolve against a
// definite height instead of collapsing to content (the "black space below"
// bug). `100dvh` tracks the visible area on mobile.
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
      '@supports (height: 100dvh)': {
        '.tl-player-screen': { height: '100dvh' },
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
      <Container sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!roomState) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{t('lobby.roomNotFound')}</Typography>
        <Typography color="text.secondary">{t('lobby.roomNotFoundSubtitle')}</Typography>
      </Container>
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
        renderHeader={() => (
          <AppHeader roomCode={roomState.roomId} roomState={roomState} />
        )}
        renderReady={() => (
          <Container
            maxWidth="xs"
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Stack spacing={3} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  bgcolor: colorHex,
                  boxShadow: `0 0 32px ${colorHex}99`,
                }}
              />
              <Typography variant="h4" sx={{ color: colorHex }}>
                {t('player.ready')}
              </Typography>
              <Typography color="text.secondary">{t('player.waiting')}</Typography>
            </Stack>
          </Container>
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
