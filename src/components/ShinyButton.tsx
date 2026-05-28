import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { pastelOnDark } from '../utils/blob';

// Accent-tinted button with a diagonal shine on the outer ring and a dark
// inner panel. Accent defaults to white (for big-screen / homepage usage);
// pass the player's `colorHex` on phone screens for per-player tinting.

interface Props {
  accent?: string;
  /** `primary` = dark face (the default look).
   *  `secondary` = accent-tinted face (use for accenting / CTAs). */
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export default function ShinyButton({
  accent = '#ffffff',
  variant = 'primary',
  onClick,
  disabled,
  fullWidth,
  ariaLabel,
  children,
}: Props) {
  // Convert hex to rgb so we can build matching alpha-tinted backgrounds and
  // shadow colours without parsing in the sx callbacks.
  const rgb = hexToRgb(accent);
  const tint = (a: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : 'auto',
        p: '2px',
        borderRadius: '15px',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background-color 200ms ease, box-shadow 200ms ease',
        background: `linear-gradient(to bottom right, ${accent} 0%, ${tint(0)} 30%)`,
        backgroundColor: tint(0.2),
        opacity: disabled ? 0.45 : 1,
        '&:hover, &:focus-visible': disabled
          ? undefined
          : {
              backgroundColor: tint(0.7),
              boxShadow: `0 0 14px ${tint(0.5)}`,
              outline: 'none',
            },
      }}
    >
      <Box
        sx={{
          borderRadius: '13px',
          // secondary face: accent mixed toward dark so it sits noticeably
          // darker than the bright outer-ring shine. Primary is plain dark.
          bgcolor: variant === 'secondary' ? pastelOnDark(accent, 0.35) : '#1a1a1a',
          color: '#fff',
          fontFamily: CARD_FONT,
          fontWeight: 700,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}
