import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ref, set } from 'firebase/database';
import {
  createInitialRoom,
  HostDeviceWarningModal,
  isLikelyMobileHost,
} from 'react-gameroom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { database } from '../firebase';
import type { PlayerSlotData } from '../game/types';

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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{ color: 'primary.main', mb: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}
        >
          {t('home.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 5 }}>
          {t('home.subtitle')}
        </Typography>
        <Stack spacing={2}>
          <Button
            onClick={handleNewGame}
            variant="contained"
            size="large"
            disabled={creating}
          >
            {t('home.newGame')}
          </Button>
          <Button component={RouterLink} to="/join" variant="outlined" size="large">
            {t('home.resumeGame')}
          </Button>
          <Button component={RouterLink} to="/how-to-play" variant="text" size="large">
            {t('home.howToPlay')}
          </Button>
        </Stack>
      </Box>

      <HostDeviceWarningModal
        open={hostWarningOpen}
        onConfirm={() => {
          setHostWarningOpen(false);
          void createRoomAndNavigate();
        }}
        onCancel={() => setHostWarningOpen(false)}
      />
    </Container>
  );
}
