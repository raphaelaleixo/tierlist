import { Box } from '@mui/material';
import BlobEmoji from './BlobEmoji';
import { PLAYER_COLOR_HEX } from '../theme/theme';

// The home page's signature device: a static three-row tier list (S / A / F)
// with a few items already placed — a mini demo of the game at a glance.
// Items reuse the in-game card treatment: a white OpenMoji over an organic
// blob tinted in a player colour (blobs cycle the palette like a real table
// of players' cards).

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

// Player-colour cycle for the blobs, so a row reads like several different
// players' cards rather than one flat colour.
const BLOB_CYCLE = [
  PLAYER_COLOR_HEX.red,
  PLAYER_COLOR_HEX.orange,
  PLAYER_COLOR_HEX.yellow,
  PLAYER_COLOR_HEX.green,
  PLAYER_COLOR_HEX.cyan,
  PLAYER_COLOR_HEX.magenta,
];

interface TierRow {
  tier: 'S' | 'A' | 'F';
  color: string;
  items: string[];
}

// S = adored, A = solid, F = the hated pile (broccoli + cockroach, nodding to
// the rulebook's own example category).
const ROWS: TierRow[] = [
  { tier: 'S', color: PLAYER_COLOR_HEX.red, items: ['🔥', '🐱', '🍕'] },
  { tier: 'A', color: PLAYER_COLOR_HEX.orange, items: ['🎮', '🎬'] },
  { tier: 'F', color: PLAYER_COLOR_HEX.magenta, items: ['🥦', '🪳'] },
];

export default function HomeTierBoard() {
  let itemIndex = 0;
  return (
    <Box
      role="img"
      aria-label="A sample tier list — S tier: fire, cat, pizza; A tier: game controller, film; F tier: broccoli, cockroach."
      sx={{
        background: 'linear-gradient(180deg, #10101e, #0c0c18)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        p: { xs: 1, sm: 1.5 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.8)',
      }}
    >
      {ROWS.map((row) => (
        <Box key={row.tier} sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
          <Box
            sx={{
              flex: '0 0 clamp(38px, 7vw, 50px)',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: row.color,
              color: 'rgba(0,0,0,0.72)',
              fontFamily: CARD_FONT,
              fontWeight: 900,
              fontSize: 'clamp(1.15rem, 3.2vw, 1.7rem)',
              lineHeight: 1,
            }}
          >
            {row.tier}
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: 'wrap',
              bgcolor: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              px: 1.25,
              py: 0.75,
              minHeight: 'clamp(46px, 9vw, 58px)',
            }}
          >
            {row.items.map((emoji, i) => (
              <BlobEmoji
                key={`${row.tier}-${i}`}
                emoji={emoji}
                color={BLOB_CYCLE[itemIndex++ % BLOB_CYCLE.length]}
                size="clamp(36px, 7vw, 46px)"
                emojiSize="min(6.8vw, 34px)"
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
