import { Box } from '@mui/material';
import { HostDeviceWarningModal } from 'react-gameroom';

// Themed wrapper around react-gameroom's HostDeviceWarningModal (an unstyled
// native <dialog>). Same house pattern as the RoomInfoModal styling in
// AppHeader: wrap it and target the dialog + its data/element hooks via sx.
// Shared so the homepage and /join get an identical, on-brand modal.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const hostWarningSx = {
  '& > dialog': {
    position: 'relative',
    width: 'min(90vw, 360px)',
    boxSizing: 'border-box',
    p: '28px 24px 22px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    bgcolor: 'background.paper',
    color: 'text.primary',
    fontFamily: CARD_FONT,
    boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)',
    '&::backdrop': {
      background: 'rgba(5,5,12,0.65)',
      backdropFilter: 'blur(3px)',
    },
    '& h3': {
      m: '0 0 10px',
      fontFamily: CARD_FONT,
      fontWeight: 800,
      fontSize: '1.3rem',
      lineHeight: 1.15,
      color: 'text.primary',
    },
    '& p': {
      m: '0 0 20px',
      color: 'text.secondary',
      fontSize: '0.95rem',
      lineHeight: 1.55,
    },
    '& [data-host-warning-actions]': {
      display: 'flex',
      gap: 1,
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      '& button': {
        fontFamily: CARD_FONT,
        fontWeight: 800,
        fontSize: '0.95rem',
        px: 2.25,
        py: 1,
        borderRadius: '11px',
        cursor: 'pointer',
        border: '1px solid transparent',
        transition: 'background 140ms ease, color 140ms ease, filter 140ms ease',
      },
      // Cancel (rendered first) — ghost button.
      '& button:first-of-type': {
        background: 'transparent',
        borderColor: 'rgba(255,255,255,0.16)',
        color: 'text.secondary',
        '&:hover': { color: 'text.primary', borderColor: 'rgba(255,255,255,0.32)' },
      },
      // Confirm (rendered last) — gold accent, matching the marquee CTA.
      '& button:last-of-type': {
        background: '#ffce1c',
        color: '#1a1400',
        '&:hover': { filter: 'brightness(1.06)' },
      },
    },
  },
};

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function HostWarning({ open, onConfirm, onCancel }: Props) {
  return (
    <Box sx={hostWarningSx}>
      <HostDeviceWarningModal open={open} onConfirm={onConfirm} onCancel={onCancel} />
    </Box>
  );
}
