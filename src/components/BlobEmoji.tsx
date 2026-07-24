import { Box } from '@mui/material';
import OpenMojiIcon from './OpenMojiIcon';
import { blobBorderRadius } from '../utils/blob';

// A white OpenMoji sitting on an organic, deterministic blob tinted in a
// given colour — the in-game card artwork, reused wherever we show items
// outside an actual card (home board, how-to-play illustration).

interface Props {
  emoji: string;
  /** Blob tint (usually a player colour). */
  color: string;
  /** Container width/height — number (px) or any CSS length. */
  size?: number | string;
  /** OpenMoji size inside the blob. */
  emojiSize?: string;
}

export default function BlobEmoji({
  emoji,
  color,
  size = 44,
  emojiSize = 'min(6.8vw, 34px)',
}: Props) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: color,
          borderRadius: blobBorderRadius(emoji),
        }}
      />
      <OpenMojiIcon emoji={emoji} invert size={emojiSize} sx={{ position: 'relative', zIndex: 1 }} />
    </Box>
  );
}
