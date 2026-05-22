import { createTheme } from '@mui/material/styles';
import type { PlayerColor } from '../game/types';

// Muted "darker pastel" player palette — desaturated mid-tones that read
// distinct on both light and dark cards without screaming.
export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  red:     '#c25450', // terracotta
  orange:  '#d4843d', // burnt orange
  yellow:  '#d6b132', // mustard
  green:   '#7da26b', // sage
  cyan:    '#5d9e9e', // dusty teal
  magenta: '#a874b0', // mauve
};

const PIXEL_FONT = '"Pixelify Sans", "Courier New", monospace';
const BODY_FONT = '"Pixelify Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a14',
      paper: '#10101e',
    },
    primary: {
      main: '#3ce0ff',  // cyan — "READY" arcade glow
    },
    secondary: {
      main: '#ff3ce0',
    },
    error: { main: '#ff3b3b' },
    text: {
      primary: '#f5f5ff',
      secondary: '#a4a4c8',
    },
  },
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: PIXEL_FONT, letterSpacing: 0 },
    h2: { fontFamily: PIXEL_FONT, letterSpacing: 0 },
    h3: { fontFamily: PIXEL_FONT, letterSpacing: 0 },
    h4: { fontFamily: PIXEL_FONT, letterSpacing: 0 },
    h5: { fontFamily: PIXEL_FONT, letterSpacing: 0 },
    h6: { fontFamily: PIXEL_FONT, letterSpacing: 0 },
    button: { fontFamily: PIXEL_FONT, letterSpacing: 0, textTransform: 'none' },
    overline: { fontFamily: PIXEL_FONT, letterSpacing: 1 },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { fontSize: '0.7rem', paddingBlock: '0.8rem' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
  },
});

export default theme;
export { PIXEL_FONT, BODY_FONT };
