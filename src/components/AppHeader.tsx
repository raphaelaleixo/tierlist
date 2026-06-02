import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { RoomInfoModal, useFullscreen } from 'react-gameroom';
import type { RoomState } from 'react-gameroom';
import ShinyButton from './ShinyButton';

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
  const { isFullscreen, isSupported: fullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen();

  return (
    <Box
      component="header"
      sx={{
        // Fixed height so the header is identical across phone + big-screen
        // surfaces and the body's `flex: 1` math is stable.
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
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
          <ShinyButton size="small" onClick={() => setShowInfo(true)}>
            {roomCode}
          </ShinyButton>
        )}
        {showFullscreen && fullscreenSupported && (
          <ShinyButton
            size="small"
            onClick={toggleFullscreen}
            ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen
              ? <FullscreenExitIcon sx={{ fontSize: '1.1rem' }} />
              : <FullscreenIcon sx={{ fontSize: '1.1rem' }} />}
          </ShinyButton>
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
