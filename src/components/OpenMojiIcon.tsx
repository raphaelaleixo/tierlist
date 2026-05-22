import { Box } from '@mui/material';
import { openMojiBlackUrl, openMojiColorUrl } from '../utils/openMoji';

// Inline OpenMoji SVG icon, sized in em by default so it tracks the
// surrounding text. Two variants — `black` (line-art monochrome, supports
// invert for dark backgrounds) and `color` (full colour fill).

interface Props {
  emoji: string;
  size?: number | string;
  /** Only meaningful for the black variant — flips black→white on dark bgs. */
  invert?: boolean;
  variant?: 'black' | 'color';
  sx?: import('@mui/material').BoxProps['sx'];
}

export default function OpenMojiIcon({
  emoji,
  size = '1em',
  invert = false,
  variant = 'black',
  sx,
}: Props) {
  const src = variant === 'color' ? openMojiColorUrl(emoji) : openMojiBlackUrl(emoji);
  const filter = variant === 'black' && invert ? 'invert(1)' : 'none';
  return (
    <Box
      component="img"
      src={src}
      alt={emoji}
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
