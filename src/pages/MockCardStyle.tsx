import { Box, Typography } from '@mui/material';
import TierCard, { type TierCardProps } from '../components/TierCard';

// Sandbox for iterating the TierCard aesthetic. Two rows of the same seven
// cards (six tiers + one hidden) — top in light variant, bottom in dark — so
// the two looks can be eyeballed against each other.

const SAMPLE_CARDS: TierCardProps[] = [
  { emoji: '🐾', category: 'Animals',        writerName: 'Alice', holderColor: 'red',     item: 'Cat',                 tier: 'S', revealed: true },
  { emoji: '🍕', category: 'Pizza toppings', writerName: 'Bob',   holderColor: 'cyan',    item: 'Pepperoni',           tier: 'A', revealed: true },
  { emoji: '🎸', category: 'Bands',          writerName: 'Carol', holderColor: 'yellow',  item: 'The Beatles',         tier: 'B', revealed: true },
  { emoji: '🎲', category: 'Board games',    writerName: 'Dan',   holderColor: 'magenta', item: 'Catan',               tier: 'C', revealed: true },
  { emoji: '📚', category: 'Books',          writerName: 'Ed',    holderColor: 'green',   item: 'Sapiens',             tier: 'D', revealed: true },
  { emoji: '📼', category: '90s movies',     writerName: 'Fay',   holderColor: 'orange',  item: 'Wild Wild West',      tier: 'F', revealed: true },
  { emoji: '☕', category: 'Coffee drinks',  writerName: 'Gus',   holderColor: 'red',     item: 'Pumpkin Spice Latte', tier: 'A', revealed: false },
];

function Row({ label, variant, rowBg }: { label: string; variant: 'light' | 'dark'; rowBg: string }) {
  return (
    <Box sx={{ bgcolor: rowBg, p: 4 }}>
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          mb: 2,
          color: variant === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
          textAlign: 'center',
          letterSpacing: 3,
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          justifyContent: 'center',
          maxWidth: 1280,
          mx: 'auto',
        }}
      >
        {SAMPLE_CARDS.map((card, i) => (
          <TierCard key={i} {...card} variant={variant} />
        ))}
      </Box>
    </Box>
  );
}

export default function MockCardStyle() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Row label="LIGHT" variant="light" rowBg="#f4f4ef" />
      <Row label="DARK" variant="dark" rowBg="#0a0a14" />
    </Box>
  );
}
