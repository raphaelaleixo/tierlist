import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { PLAYER_COLOR_HEX } from '../theme/theme';

// "The Ranking" mark: a rounded app tile holding three tier bars that step
// down in the S / A / C player colors — a mini tier-list read that scales
// from a 16px favicon up to the homepage hero.

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface LogoIconProps {
  /** Rendered width/height in px. */
  size?: number;
  /** When true the icon is purely decorative (a sibling label names it). */
  decorative?: boolean;
}

/** The standalone tile mark. */
export function LogoIcon({ size = 28, decorative = false }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'block', flexShrink: 0 }}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': 'Tierlist' })}
    >
      <rect x="4" y="4" width="56" height="56" rx="15" fill="#161628" stroke="rgba(255,255,255,0.07)" />
      <rect x="14" y="16" width="36" height="8" rx="4" fill={PLAYER_COLOR_HEX.red} />
      <rect x="14" y="28" width="27" height="8" rx="4" fill={PLAYER_COLOR_HEX.orange} />
      <rect x="14" y="40" width="18" height="8" rx="4" fill={PLAYER_COLOR_HEX.green} />
    </svg>
  );
}

interface LogoProps {
  /** `lockup` = icon + wordmark; `icon` = tile only. */
  variant?: 'lockup' | 'icon';
  /** Icon height in px. The wordmark and gap scale from this. */
  size?: number;
  sx?: SxProps<Theme>;
}

/** Icon + `TIERLIST` wordmark lockup (or the bare icon). */
export default function Logo({ variant = 'lockup', size = 28, sx }: LogoProps) {
  if (variant === 'icon') return <LogoIcon size={size} />;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: `${size * 0.42}px`, ...sx }}>
      <LogoIcon size={size} decorative />
      <Box
        component="span"
        sx={{
          fontFamily: CARD_FONT,
          fontWeight: 900,
          fontSize: `${size * 0.62}px`,
          letterSpacing: `${size * 0.07}px`,
          lineHeight: 1,
          color: 'text.primary',
          whiteSpace: 'nowrap',
        }}
      >
        TIERLIST
      </Box>
    </Box>
  );
}
