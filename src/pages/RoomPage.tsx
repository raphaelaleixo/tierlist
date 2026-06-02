import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RoomQRCode,
  startGame,
  useRoomState,
  buildJoinUrl,
} from 'react-gameroom';
import { Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { useGameState, writeGameState } from '../hooks/useGameState';
import { createInitialGameState } from '../game/lifecycle';
import BigScreenGame from '../components/BigScreenGame';
import AppHeader from '../components/AppHeader';
import ShinyButton from '../components/ShinyButton';
import { PLAYER_COLOR_HEX } from '../theme/theme';
import { pastelOnDark } from '../utils/blob';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

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
  // QR code can't take a CSS unit — recompute its pixel size from window
  // width so it tracks the rest of the vw sizing. Called unconditionally
  // before any early returns to satisfy rules-of-hooks.
  const qrSize = useViewportSize(0.13, 160, 480);

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

  // ── Lobby ──────────────────────────────────────────────────────────────
  // Order: AppHeader → player row → QR hero (flex 1, fills the middle) →
  // CTA. Empty slots stay dim until a player joins. Sizes are
  // viewport-relative (vw) so the lobby scales proportionally on whatever
  // screen it's projected to.
  const maxSlots = roomState.config.maxPlayers;
  const filledSlots = roomState.players;
  const emptyCount = Math.max(0, maxSlots - filledSlots.length);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: CARD_FONT }}>
      <AppHeader roomCode={roomState.roomId} roomState={roomState} showFullscreen />

      {/* Player row — same 1/N geometry as the game phases. */}
      <Box
        sx={{
          height: '12vw',
          display: 'flex',
          '& > *': {
            flex: `0 0 calc(100% / ${maxSlots})`,
            maxWidth: `calc(100% / ${maxSlots})`,
          },
        }}
      >
        {filledSlots.map((slot, i) => {
          const colorHex = slot.data?.color ? PLAYER_COLOR_HEX[slot.data.color] : null;
          const isReady = slot.status === 'ready';
          const label = slot.name ?? `Player ${slot.id}`;
          return (
            <LobbyPlayerCell
              key={`p-${slot.id}`}
              index={i}
              label={label}
              status={isReady ? t('lobby.ready') : ''}
              colorHex={isReady ? colorHex : null}
            />
          );
        })}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <LobbyPlayerCell
            key={`empty-${i}`}
            index={filledSlots.length + i}
            label={`Player ${filledSlots.length + i + 1}`}
            status={t('lobby.empty')}
            colorHex={null}
          />
        ))}
      </Box>

      {/* Hero: QR on the left, room code + scan hint on the right, vertically
          centred as a pair. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3vw',
          py: 4,
          px: 2,
        }}
      >
        <Box
          sx={{
            p: '1vw',
            bgcolor: '#fff',
            borderRadius: '0.8vw',
            boxShadow: '0 1.2vw 2.8vw rgba(0,0,0,0.35)',
          }}
        >
          <RoomQRCode
            roomId={roomState.roomId}
            url={buildJoinUrl(roomState.roomId)}
            size={qrSize}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '1.5vw',
          }}
        >
          {/* "ROOM" overline + the code, stacked tight as one unit. */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.3vw',
            }}
          >
            <Box
              sx={{
                fontWeight: 700,
                fontSize: '0.85vw',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {t('lobby.roomLabel')}
            </Box>
            <Box
              sx={{
                fontWeight: 900,
                fontSize: '4vw',
                lineHeight: 1,
                color: 'text.primary',
                textAlign: 'left',
              }}
            >
              {roomState.roomId}
            </Box>
          </Box>

          <Box
            sx={{
              fontWeight: 700,
              fontSize: '0.95vw',
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '32vw',
              textAlign: 'left',
            }}
          >
            {t('lobby.scanHint')}
          </Box>
        </Box>
      </Box>

      {/* CTA footer */}
      <Box
        sx={{
          py: 3,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <ShinyButton
          accent="#ffce1c"
          variant="primary"
          disabled={!derived.canStart}
          onClick={() => void updateRoom(startGame(roomState))}
        >
          <Box
            sx={{
              fontFamily: CARD_FONT,
              fontWeight: 900,
              fontSize: '1.7vw',
              letterSpacing: 3,
              px: '2.5vw',
              py: '0.6vw',
            }}
          >
            {t('lobby.start')}
          </Box>
        </ShinyButton>
        <Box
          sx={{
            fontWeight: 700,
            fontSize: '0.9vw',
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {t('lobby.playerCount', {
            count: derived.readyCount,
            max: roomState.config.maxPlayers,
            min: roomState.config.minPlayers,
          })}
        </Box>
      </Box>
    </Box>
  );
}

// Recompute on window resize so the QR code (which takes a pixel `size`
// prop, not a CSS unit) tracks the vw sizing on the rest of the lobby.
function useViewportSize(ratio: number, min: number, max: number): number {
  const compute = () =>
    Math.max(min, Math.min(max, Math.round(window.innerWidth * ratio)));
  const [size, setSize] = useState(() =>
    typeof window === 'undefined' ? min : compute(),
  );
  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // `compute` closes over the ratio/min/max passed at mount; callers should
    // not change them mid-life, so we deliberately keep the deps empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return size;
}

interface LobbyPlayerCellProps {
  index: number;
  label: string;
  status: string;
  /** When non-null, the cell is "lit" with the player's gradient. */
  colorHex: string | null;
}

function LobbyPlayerCell({ index, label, status, colorHex }: LobbyPlayerCellProps) {
  const lit = colorHex !== null;
  // Empty cells alternate two subtle shades so the row reads as a striped
  // tray of available seats. Filled cells override with the player gradient.
  const zebra = index % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.22)';
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        display: 'grid',
        gridTemplateRows: '1fr auto',
        gap: '2cqi',
        pt: '4.5cqi',
        pb: '6cqi',
        px: '3cqi',
        background: lit
          ? `linear-gradient(to bottom, ${pastelOnDark(colorHex, 0.4)} 0%, ${pastelOnDark(colorHex, 0.18)} 100%)`
          : zebra,
        containerType: 'inline-size',
        // Dark veil over unlit cells — same mechanic as the game phases.
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.6))',
          opacity: lit ? 0 : 1,
          transition: 'opacity 500ms ease',
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          alignSelf: 'center',
          textAlign: 'center',
          fontFamily: CARD_FONT,
          fontWeight: 900,
          fontSize: '18cqi',
          textTransform: 'uppercase',
          lineHeight: 1,
          color: 'text.primary',
          opacity: lit ? 1 : 0.55,
        }}
      >
        {label}
      </Box>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          fontFamily: CARD_FONT,
          fontWeight: 700,
          fontSize: '9cqi',
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: lit && colorHex ? colorHex : 'rgba(255,255,255,0.4)',
        }}
      >
        {status}
      </Box>
    </Box>
  );
}
