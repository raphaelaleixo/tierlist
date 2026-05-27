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
  /** Number of rows to lay the fires across (default 1). */
  rows?: number;
}

export default function FirePoints({ points, max = 10, invert = false, size = '1em', rows = 1 }: Props) {
  const cols = Math.ceil(max / rows);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, auto)`,
        columnGap: '1cqi',
        rowGap: '5cqi',
        justifyContent: 'center',
      }}
    >
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
