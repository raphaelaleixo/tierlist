import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayerScreen } from 'react-gameroom';
import { Box, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { useGameState } from '../hooks/useGameState';
import PhoneGame from '../components/PhoneGame';
import { PLAYER_COLOR_HEX } from '../theme/theme';

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
    <PlayerScreen
      roomState={roomState}
      playerId={playerId}
      renderReady={() => (
        <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
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
            <Container sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Container>
          );
        }
        return (
          <PhoneGame roomId={id!} roomState={roomState} gameState={gameState} myId={playerId} />
        );
      }}
    />
  );
}
