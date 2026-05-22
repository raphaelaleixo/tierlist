import { Box, Container, Typography } from '@mui/material';

interface Props {
  title?: string;
  subtitle?: string;
}

export default function PhoneWaiting({ title = 'Waiting…', subtitle = 'Waiting for the others.' }: Props) {
  return (
    <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
      <Typography
        variant="h5"
        sx={{
          color: 'primary.main',
          animation: 'blink 1.2s steps(2, end) infinite',
          '@keyframes blink': { '50%': { opacity: 0.4 } },
        }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        {subtitle}
      </Typography>
      <Box
        sx={{
          mt: 4,
          mx: 'auto',
          width: 80,
          height: 4,
          bgcolor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            bgcolor: 'primary.main',
            animation: 'sweep 1.6s linear infinite',
          },
          '@keyframes sweep': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      />
    </Container>
  );
}
