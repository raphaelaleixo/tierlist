import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { openMojiBlackUrl } from '../utils/openMoji';
import {
  getOpenMojiHexcode,
  isOpenMojiDataLoaded,
  loadOpenMojiData,
} from '../utils/openMojiSupport';

// Inline OpenMoji SVG icon. Two variants — `black` (line-art monochrome,
// supports invert for dark backgrounds) and `color` (full colour fill).
//
// Resolution strategy:
//   1. If the OpenMoji data Map is loaded, use the canonical hexcode from
//      `openmoji.json` (this is the source of truth — handles all FE0F /
//      ZWJ edge cases for composed emojis like 😶‍🌫️, 🏳️‍🌈, family
//      sequences, etc).
//   2. Otherwise, fall back to computing a codepoint locally (correct for
//      single-codepoint emojis; an `onError` handler catches the rest).
//   3. If the data is loaded AND this emoji isn't in OpenMoji, render the
//      native emoji glyph so there's no broken image.

interface Props {
  emoji: string;
  size?: number | string;
  /** Only meaningful for the black variant — flips black→white on dark bgs. */
  invert?: boolean;
  variant?: 'black' | 'color';
  sx?: import('@mui/material').BoxProps['sx'];
}

// Served from the app's own origin (see `scripts/sync-openmoji.mjs`).
// Only black is self-hosted; `variant="color"` callers fall back to the
// native emoji glyph below.
const BLACK_BASE = '/openmoji/black/svg';

export default function OpenMojiIcon({
  emoji,
  size = '1em',
  invert = false,
  variant = 'black',
  sx,
}: Props) {
  // Trigger the data load on first mount. Re-renders below pick up the cache
  // once the fetch resolves.
  const [dataLoaded, setDataLoaded] = useState(isOpenMojiDataLoaded());
  useEffect(() => {
    if (dataLoaded) return;
    loadOpenMojiData().then(() => setDataLoaded(true));
  }, [dataLoaded]);

  const hexcode = getOpenMojiHexcode(emoji);
  const useFallback = dataLoaded && hexcode === null;

  // If the data has loaded and this emoji isn't in OpenMoji, render native
  // immediately (skip the broken-image roundtrip).
  const [imageFailed, setImageFailed] = useState(false);
  // Reset the failed state when the resolved URL changes — a fresh hexcode
  // from the Map (loaded after a previous wrong-URL 404) deserves a retry.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageFailed(false);
  }, [emoji, hexcode]);

  // Only the black variant is self-hosted; for `variant="color"` we render
  // the native emoji directly so the OS/browser does its full-colour thing.
  const wantsColor = variant === 'color';

  if (useFallback || imageFailed || wantsColor) {
    return (
      <Box
        component="span"
        aria-label={emoji}
        sx={{
          fontSize: size,
          lineHeight: 1,
          userSelect: 'none',
          display: 'inline-block',
          verticalAlign: '-0.15em',
          ...sx,
        }}
      >
        {emoji}
      </Box>
    );
  }

  // Black variant: canonical hexcode from the Map when loaded, otherwise
  // the local codepoint computation (good enough for most simple emojis;
  // the onError handler covers ZWJ edge cases until the Map populates).
  const src = hexcode ? `${BLACK_BASE}/${hexcode}.svg` : openMojiBlackUrl(emoji);
  const filter = invert ? 'invert(1)' : 'none';

  return (
    <Box
      component="img"
      src={src}
      alt={emoji}
      onError={() => setImageFailed(true)}
      sx={{
        width: size,
        height: size,
        userSelect: 'none',
        display: 'inline-block',
        verticalAlign: '-0.15em',
        filter,
        ...sx,
      }}
    />
  );
}
