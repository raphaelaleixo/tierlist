import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { RoomInfoModal, useFullscreen, buildJoinUrl } from 'react-gameroom';
import type { RoomState } from 'react-gameroom';
import ShinyButton from './ShinyButton';
import Logo from './Logo';

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

// react-gameroom's RoomInfoModal renders an unstyled native <dialog> and ships
// no CSS. Following the house pattern (see colorlition's BigScreenView), we
// wrap it and theme the dialog + its data-room-info-* hooks via scoped sx.
const roomInfoModalSx = {
  '& > dialog': {
    position: 'relative',
    width: 'min(90vw, 340px)',
    boxSizing: 'border-box',
    p: '28px 24px 24px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    bgcolor: 'background.paper',
    color: 'text.primary',
    fontFamily: CARD_FONT,
    textAlign: 'center',
    boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)',
    '&::backdrop': {
      background: 'rgba(5,5,12,0.65)',
      backdropFilter: 'blur(3px)',
    },
    '& h3': {
      m: '0 0 4px',
      fontFamily: CARD_FONT,
      fontWeight: 800,
      fontSize: '1.35rem',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'text.primary',
    },
    '& [data-room-info-qr]': {
      display: 'inline-block',
      p: '12px',
      m: '18px auto',
      bgcolor: '#fff',
      borderRadius: '14px',
      lineHeight: 0,
    },
    // Hide the per-seat link list — this modal is just "scan to join" (QR +
    // code). RoomInfoModal has no prop to omit it yet, so we suppress it via
    // its data hook. (Proper fix = a `seats` prop in react-gameroom.)
    '& [data-room-info-links]': { display: 'none' },
    '& [data-room-info-close]': {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 32,
      height: 32,
      display: 'grid',
      placeItems: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: 'text.secondary',
      fontSize: '1.1rem',
      lineHeight: 1,
      cursor: 'pointer',
      transition: 'color 140ms ease, background 140ms ease',
      '&:hover': { color: 'text.primary', bgcolor: 'rgba(255,255,255,0.08)' },
    },
  },
};

export default function AppHeader({ roomCode, roomState, showFullscreen }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const { isFullscreen, isSupported: fullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen();

  return (
    <>
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
          // Establish a stacking context so the body's absolutely-positioned
          // phase wrappers slide *behind* the header during transitions
          // instead of painting over it.
          position: 'relative',
          zIndex: 10,
          bgcolor: 'background.default',
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          aria-label="Tierlist — home"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'text.primary',
          }}
        >
          <Logo size={28} />
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
      </Box>

      {roomState && (
        <Box sx={roomInfoModalSx}>
          <RoomInfoModal
            roomState={roomState}
            open={showInfo}
            onClose={() => setShowInfo(false)}
            // Always encode the /player join URL (not buildRejoinUrl's /players)
            // — /room/:id/player resolves join vs rejoin from room status itself
            // (see PlayerJoinPage). Matches colorlition's BigScreenView.
            qrUrl={buildJoinUrl(roomState.roomId)}
            labels={{ roomHeading: 'Room' }}
          />
        </Box>
      )}
    </>
  );
}
