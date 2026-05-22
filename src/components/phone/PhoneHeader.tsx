import { Box, Typography } from '@mui/material';
import FirePoints from '../FirePoints';
import PlayerColorDot from '../big-screen/PlayerColorDot';
import type { PlayerMeta } from '../big-screen/playerMeta';

interface Props {
  me: PlayerMeta;
  roomId: string;
  hearts?: number;
  category?: string | null;
}

export default function PhoneHeader({ me, roomId, hearts, category }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        bgcolor: 'background.paper',
      }}
    >
      <PlayerColorDot colorHex={me.colorHex} size={22} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>{me.name}</Typography>
        {category && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {category}
          </Typography>
        )}
      </Box>
      {hearts !== undefined && (
        <Typography
          sx={{
            color: 'error.main',
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: '0.8rem',
          }}
        >
          <FirePoints points={hearts} invert size="0.8rem" />
        </Typography>
      )}
      <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
        {roomId}
      </Typography>
    </Box>
  );
}
