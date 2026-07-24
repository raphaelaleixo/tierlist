import { Box, Container } from '@mui/material';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface Props {
  title?: string;
  subtitle?: string;
}

// Matches the app's waiting idiom (see the post-submit states in
// PhoneCategoryPick / PhoneTierWriting): a blinking uppercase Bricolage label
// over a quiet subtitle. No player colour here — this is the neutral,
// between-phases wait.
export default function PhoneWaiting({ title = 'Waiting…', subtitle = 'Waiting for the others.' }: Props) {
  return (
    <Container
      maxWidth="xs"
      sx={{
        py: 6,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          fontFamily: CARD_FONT,
          fontWeight: 900,
          fontSize: '1.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'text.primary',
          animation: 'lockBlink 1.4s ease-in-out infinite',
          '@keyframes lockBlink': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.45 },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {title}
      </Box>
      <Box sx={{ color: 'text.secondary', fontSize: '0.9rem', maxWidth: '30ch' }}>
        {subtitle}
      </Box>
    </Container>
  );
}
