import { Box } from '@mui/material';
import OpenMojiIcon from './OpenMojiIcon';

// Row of fire emojis showing earned points out of a maximum (default 10 —
// the most a player can win in a 2-round game). Lit points use the OpenMoji
// COLOR variant; remaining slots use the black line-art variant, dimmed.

interface Props {
  points: number;
  max?: number;
  /** When true, the unlit (black-line) fires invert to white for dark bgs. */
  invert?: boolean;
  size?: number | string;
}

export default function FirePoints({ points, max = 10, invert = false, size = '1em' }: Props) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
      {Array.from({ length: max }).map((_, i) => {
        const lit = i < points;
        return (
          <OpenMojiIcon
            key={i}
            emoji="🔥"
            variant={lit ? 'color' : 'black'}
            invert={!lit && invert}
            size={size}
          />
        );
      })}
    </Box>
  );
}
