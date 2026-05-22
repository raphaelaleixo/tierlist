import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RoomQRCode,
  startGame,
  useRoomState,
  buildJoinUrl,
} from 'react-gameroom';
import { Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { useGameState, writeGameState } from '../hooks/useGameState';
import { createInitialGameState } from '../game/lifecycle';
import BigScreenGame from '../components/BigScreenGame';
import { PLAYER_COLOR_HEX } from '../theme/theme';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { roomState, loading, updateRoom } = useFirebaseRoom(id);
  const { gameState, loading: gameLoading } = useGameState(id);
  const derived = useRoomState(
    roomState ?? {
      roomId: '',
      status: 'lobby',
      players: [],
      config: { minPlayers: 3, maxPlayers: 6, requireFull: false },
    },
  );

  // Initialize GameState exactly once when the room transitions to "started".
  // RoomPage (big-screen) is the only client allowed to do this — phones can't
  // race because they don't run this effect.
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (!id || !roomState || roomState.status !== 'started') return;
    if (gameLoading || gameState !== null) return;
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    const seating = roomState.players
      .filter((p) => p.status === 'ready')
      .map((p) => p.id);
    if (seating.length < roomState.config.minPlayers) return;
    const firstPlayerId = seating[Math.floor(Math.random() * seating.length)];
    void writeGameState(id, createInitialGameState(seating, firstPlayerId));
  }, [id, roomState, gameState, gameLoading]);

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
        <Typography variant="h4" sx={{ mb: 2 }}>{t('lobby.roomNotFound')}</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {t('lobby.roomNotFoundSubtitle')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>{t('lobby.backHome')}</Button>
      </Container>
    );
  }

  if (roomState.status === 'started') {
    if (gameLoading || !gameState) {
      return (
        <Container sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      );
    }
    return <BigScreenGame roomId={id!} roomState={roomState} gameState={gameState} drive />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={5}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            TIERLIST · ROOM
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, color: 'primary.main', letterSpacing: 4 }}>
            {roomState.roomId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 5, alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                p: 2,
                bgcolor: '#fff',
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              <RoomQRCode roomId={roomState.roomId} url={buildJoinUrl(roomState.roomId)} size={220} />
            </Box>
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 260, mx: 'auto', fontSize: '0.85rem' }}>
              {t('lobby.scanHint')}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Stack spacing={1.5}>
              {roomState.players.map((slot) => {
                const color = slot.data?.color ? PLAYER_COLOR_HEX[slot.data.color] : '#3a3a52';
                const isReady = slot.status === 'ready';
                return (
                  <Box
                    key={slot.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      px: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '2px solid',
                      borderColor: isReady ? color : 'rgba(255,255,255,0.08)',
                      transition: 'border-color 200ms',
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: isReady ? color : 'transparent',
                        border: '2px solid',
                        borderColor: isReady ? color : 'rgba(255,255,255,0.2)',
                        boxShadow: isReady ? `0 0 12px ${color}66` : 'none',
                      }}
                    />
                    <Typography sx={{ flex: 1, fontWeight: 600 }}>
                      {isReady ? slot.name ?? `Player ${slot.id}` : t('lobby.empty')}
                    </Typography>
                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      P{slot.id}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('lobby.playerCount', {
              count: derived.readyCount,
              max: roomState.config.maxPlayers,
              min: roomState.config.minPlayers,
            })}
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={!derived.canStart}
            onClick={() => void updateRoom(startGame(roomState))}
            sx={{ minWidth: 220 }}
          >
            {t('lobby.start')}
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
