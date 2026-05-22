import { Box } from '@mui/material';

interface Props {
  colorHex: string;
  size?: number;
  pulse?: boolean;
}

export default function PlayerColorDot({ colorHex, size = 24, pulse = false }: Props) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: colorHex,
        boxShadow: `0 0 ${size / 2}px ${colorHex}aa`,
        flexShrink: 0,
        animation: pulse ? 'pdot 1.1s ease-in-out infinite' : 'none',
        '@keyframes pdot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.55, transform: 'scale(0.92)' },
        },
      }}
    />
  );
}
