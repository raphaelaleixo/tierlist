import { Box } from '@mui/material';
import BlobEmoji from './BlobEmoji';
import { PLAYER_COLOR_HEX } from '../theme/theme';

// One worked trick that shows the signature rule: lowest tier normally wins,
// but when an S and an F are both played, the F takes it. "Hate beats love."

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface PlayedCard {
  tier: string;
  color: string;
  emoji: string;
  item: string;
  wins?: boolean;
}

const CARDS: PlayedCard[] = [
  { tier: 'S', color: PLAYER_COLOR_HEX.red, emoji: '🍕', item: 'Pizza' },
  { tier: 'A', color: PLAYER_COLOR_HEX.orange, emoji: '🎬', item: 'Cult classic' },
  { tier: 'F', color: PLAYER_COLOR_HEX.magenta, emoji: '🥦', item: 'Broccoli', wins: true },
];

export default function HowToTrickExample() {
  return (
    <Box
      sx={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px',
        p: { xs: 2, sm: 2.5 },
        background: 'linear-gradient(180deg, #10101e, #0c0c18)',
      }}
    >
      <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, justifyContent: 'center', flexWrap: 'wrap' }}>
        {CARDS.map((c) => (
          <Box
            key={c.tier}
            sx={{
              position: 'relative',
              width: 116,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: '14px',
              bgcolor: '#161628',
              border: c.wins
                ? `2px solid ${c.color}`
                : '1px solid rgba(255,255,255,0.08)',
              boxShadow: c.wins ? `0 0 26px -4px ${c.color}` : 'none',
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                bgcolor: c.color,
                color: 'rgba(0,0,0,0.72)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              {c.tier}
            </Box>
            <BlobEmoji emoji={c.emoji} color={c.color} size={54} emojiSize="34px" />
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'text.primary',
                textAlign: 'center',
                lineHeight: 1.15,
              }}
            >
              {c.item}
            </Box>
            {c.wins && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -11,
                  right: -8,
                  bgcolor: c.color,
                  color: '#1a0010',
                  fontFamily: CARD_FONT,
                  fontWeight: 900,
                  fontSize: '0.62rem',
                  letterSpacing: '0.06em',
                  px: 0.9,
                  py: 0.35,
                  borderRadius: '999px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                }}
              >
                WINS ♥
              </Box>
            )}
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          mt: 2,
          textAlign: 'center',
          color: 'text.secondary',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          maxWidth: '46ch',
          mx: 'auto',
        }}
      >
        Lowest tier normally wins, so <Box component="strong" sx={{ color: 'text.primary' }}>S (Pizza)</Box> should
        take it. But an <Box component="strong" sx={{ color: 'text.primary' }}>S</Box> and an{' '}
        <Box component="strong" sx={{ color: 'text.primary' }}>F</Box> are both in play —
        so <Box component="strong" sx={{ color: 'text.primary' }}>F (Broccoli)</Box> beats the S and wins the trick.
      </Box>
    </Box>
  );
}
