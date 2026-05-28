import { Box } from '@mui/material';

// Inline pill for displaying another player's name in their colour, always
// readable thanks to a small white backdrop. Reused across phone screens
// (recipient names in headlines, etc.) so we don't repeat the styling.

interface Props {
  name: string;
  colorHex: string;
}

export default function PlayerNameChip({ name, colorHex }: Props) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.5,
        py: 0.15,
        mx: 0.4,
        bgcolor: '#fff',
        color: colorHex,
        fontWeight: 900,
        textTransform: 'uppercase',
        borderRadius: '6px',
      }}
    >
      {name}
    </Box>
  );
}
