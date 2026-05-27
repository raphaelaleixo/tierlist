import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { FullscreenToggle, RoomInfoModal } from 'react-gameroom';
import type { RoomState } from 'react-gameroom';

// Global top bar shared across the big screen, phones, and static pages.
// Mirrors the structure used in `react-unmatched/src/components/AppHeader.tsx`:
// wordmark on the left, room code + fullscreen on the right.

interface Props {
  /** When set, renders a clickable room-code chip that opens RoomInfoModal. */
  roomCode?: string;
  /** Room state for the modal's player list / QR code. */
  roomState?: RoomState;
  /** Show the fullscreen toggle (big screen only by default). */
  showFullscreen?: boolean;
}

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export default function AppHeader({ roomCode, roomState, showFullscreen }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontFamily: CARD_FONT,
      }}
    >
      <Box
        component={RouterLink}
        to="/"
        aria-label="Home"
        sx={{
          textDecoration: 'none',
          color: 'text.primary',
          fontFamily: CARD_FONT,
          fontWeight: 900,
          fontSize: '1.1rem',
          letterSpacing: 2,
        }}
      >
        TIERLIST
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {roomCode && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowInfo(true)}
            sx={{
              fontFamily: CARD_FONT,
              fontWeight: 700,
              letterSpacing: 2,
              minWidth: 0,
              px: 1.5,
            }}
          >
            {roomCode}
          </Button>
        )}
        {showFullscreen && (
          <FullscreenToggle
            className="app-header__fullscreen"
            labels={{ enter: 'Fullscreen', exit: 'Exit fullscreen' }}
          />
        )}
      </Box>

      {roomState && (
        <RoomInfoModal
          roomState={roomState}
          open={showInfo}
          onClose={() => setShowInfo(false)}
        />
      )}
    </Box>
  );
}
