import { useMemo, useState } from 'react';
import { Box, Container, Stack, TextField } from '@mui/material';
import type { CategoryChoice, GameState, Tier, TierList } from '../../game/types';
import { TIERS } from '../../game/types';
import { assignerOf, submitTierList } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import { pastelOnDark } from '../../utils/blob';
import OpenMojiIcon from '../OpenMojiIcon';
import ShinyButton from '../ShinyButton';
import PlayerNameChip from '../PlayerNameChip';
import type { PlayerMeta } from '../big-screen/playerMeta';
import { TIER_COLORS } from '../../theme/theme';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

// Vibey placeholders so each row reads as a flavour cue for what belongs
// in that tier.
const TIER_PLACEHOLDERS: Record<Tier, string> = {
  S: 'Peak. No notes',
  A: 'Excellent',
  B: 'Good enough to be proud of',
  C: 'Fine, exists, does the job',
  D: 'Questionable but functional',
  F: 'Truly unacceptable',
};

interface Props {
  roomId: string;
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

const blankList = (): Record<Tier, string> => ({ S: '', A: '', B: '', C: '', D: '', F: '' });

export default function PhoneTierWriting({ roomId, gameState, myId, meta }: Props) {
  const round = gameState.rounds[gameState.currentRoundIndex]!;
  const myEntry = round.perPlayer[myId];
  const already = myEntry?.tierListWritten ?? null;
  const me = meta[myId];
  const myColor = me?.colorHex ?? '#888';

  // The neighbour who PICKED a category for me. I write in their category —
  // and they are also the player who PLAYS the list I write, because the deal
  // hands each list back to whoever assigned it. Not writerOf(me): that's the
  // neighbour who authors MY hand, which is the other end of the loop.
  const assignerId = assignerOf(gameState.seating, myId, round.passDirection);
  const myCategory = round.perPlayer[assignerId]?.categoryAssigned ?? null;
  const willPlay = meta[assignerId];
  const willPlayName = willPlay?.name ?? `Player ${assignerId}`;
  const willPlayColor = willPlay?.colorHex ?? '#888';

  const [draft, setDraft] = useState<Record<Tier, string>>(blankList);
  const [submitting, setSubmitting] = useState(false);

  const allFilled = useMemo(() => TIERS.every((t) => draft[t].trim().length > 0), [draft]);

  async function handleSubmit() {
    if (!allFilled) return;
    setSubmitting(true);
    const list: TierList = {
      S: draft.S.trim(),
      A: draft.A.trim(),
      B: draft.B.trim(),
      C: draft.C.trim(),
      D: draft.D.trim(),
      F: draft.F.trim(),
    };
    try {
      await writeGameState(roomId, submitTierList(gameState, myId, list));
    } finally {
      setSubmitting(false);
    }
  }

  if (already !== null) {
    return (
      <LockedView
        list={already}
        category={myCategory}
        willPlayName={willPlayName}
        willPlayColor={willPlayColor}
        myColor={myColor}
      />
    );
  }

  return (
    <Box
      sx={{
        // `min-height: 100%` (not `flex: 1`) so the Box grows with content
        // and the gradient paints all the way down on long screens — the
        // tier-writing form is 6 rows tall plus headline + button.
        minHeight: '100%',
        background: `linear-gradient(to bottom, ${pastelOnDark(myColor, 0.35)} 0%, ${pastelOnDark(myColor, 0.12)} 100%)`,
        fontFamily: CARD_FONT,
      }}
    >
      <Container maxWidth="xs" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <HeaderBlock category={myCategory} myColor={myColor} variant="entry" />

          {/* Tier rows */}
          <Stack spacing={1}>
            {TIERS.map((t) => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
                <TierBadge tier={t} />
                <TextField
                  placeholder={TIER_PLACEHOLDERS[t]}
                  value={draft[t]}
                  onChange={(e) => setDraft({ ...draft, [t]: e.target.value })}
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 32 } }}
                  sx={{
                    '& .MuiInputBase-root': {
                      minHeight: 56,
                      bgcolor: 'rgba(0,0,0,0.25)',
                      fontFamily: CARD_FONT,
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      textTransform: 'uppercase',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                      '&:hover fieldset': { borderColor: pastelOnDark(myColor, 0.6) },
                      '&.Mui-focused fieldset': { borderColor: myColor, borderWidth: 2 },
                    },
                    '& .MuiInputBase-input': {
                      py: 0,
                      textTransform: 'uppercase',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      textTransform: 'uppercase',
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>

          <PlaysThisNote
            willPlayName={willPlayName}
            willPlayColor={willPlayColor}
            variant="entry"
          />

          {/* Lock-in button */}
          <ShinyButton
            accent={myColor}
            variant="primary"
            fullWidth
            disabled={!allFilled || submitting}
            onClick={() => void handleSubmit()}
          >
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Lock it in
            </Box>
          </ShinyButton>
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Header (shared by entry + locked views) ────────────────────────────

function HeaderBlock({
  category,
  myColor,
  variant,
}: {
  category: CategoryChoice | null;
  myColor: string;
  variant: 'entry' | 'locked';
}) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      {category && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <OpenMojiIcon emoji={category.emoji} variant="black" invert size="4rem" />
        </Box>
      )}
      {/* Ownership leads. "YOUR" in the player's own colour is the whole
          point of the screen: these are your favourites, not a guess at
          anyone else's. Who plays the list is demoted to a footnote near
          the submit button. */}
      <Box
        sx={{
          fontFamily: CARD_FONT,
          fontWeight: 900,
          fontSize: '2.2rem',
          lineHeight: 1,
          textTransform: 'uppercase',
          color: '#fff',
        }}
      >
        <Box component="span" sx={{ color: myColor }}>Your </Box>
        {category?.name ?? '—'}
      </Box>
      <Box
        sx={{
          mt: 1.5,
          fontFamily: CARD_FONT,
          fontWeight: 600,
          fontSize: '0.95rem',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.3,
          textTransform: 'uppercase',
        }}
      >
        {variant === 'entry'
          ? 'Rank your own favourites, S to F.'
          : 'Your favourites, locked in.'}
      </Box>
    </Box>
  );
}

// The "who plays this" line. Deliberately placed next to the submit button
// rather than in the header: read as a consequence after you understand the
// task, it's flavour; read before it, it reframes the task as "write this
// FOR them", which is the misreading we're fixing.
function PlaysThisNote({
  willPlayName,
  willPlayColor,
  variant,
}: {
  willPlayName: string;
  willPlayColor: string;
  variant: 'entry' | 'locked';
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        fontFamily: CARD_FONT,
        fontWeight: 600,
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.4,
        textTransform: 'uppercase',
      }}
    >
      {variant === 'entry' ? (
        <>
          <PlayerNameChip name={willPlayName} colorHex={willPlayColor} /> plays these
          — they won&rsquo;t know your order.
        </>
      ) : (
        <>
          Memorise it — you&rsquo;re the only one who knows this order.
        </>
      )}
    </Box>
  );
}

// ─── Tier letter badge ──────────────────────────────────────────────────

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Box
      sx={{
        flex: '0 0 auto',
        width: 56,
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: TIER_COLORS[tier],
        borderRadius: '8px',
        fontFamily: CARD_FONT,
        fontWeight: 900,
        fontSize: '1.8rem',
        color: '#fff',
        WebkitTextStroke: '2px rgba(0,0,0,0.3)',
        paintOrder: 'stroke fill',
      }}
    >
      {tier}
    </Box>
  );
}

// ─── Locked view ─────────────────────────────────────────────────────────

function LockedView({
  list,
  category,
  willPlayName,
  willPlayColor,
  myColor,
}: {
  list: TierList;
  category: CategoryChoice | null;
  willPlayName: string;
  willPlayColor: string;
  myColor: string;
}) {
  return (
    <Box
      sx={{
        minHeight: '100%',
        background: `linear-gradient(to bottom, ${pastelOnDark(myColor, 0.35)} 0%, ${pastelOnDark(myColor, 0.12)} 100%)`,
        fontFamily: CARD_FONT,
      }}
    >
      <Container maxWidth="xs" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {/* Same category-as-title header as the entry view, plus a small
              "Locked in" eyebrow in the player colour so the state still
              reads at a glance. */}
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '0.85rem',
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: myColor,
                mb: 1.5,
              }}
            >
              Locked in
            </Box>
          </Box>
          <HeaderBlock category={category} myColor={myColor} variant="locked" />

          {/* Recap rows — same shape as the entry rows, but read-only. */}
          <Stack spacing={1}>
            {TIERS.map((t) => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
                <TierBadge tier={t} />
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    minHeight: 56,
                    bgcolor: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 1,
                    fontFamily: CARD_FONT,
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    textTransform: 'uppercase',
                    color: '#fff',
                  }}
                >
                  {list[t]}
                </Box>
              </Box>
            ))}
          </Stack>

          <PlaysThisNote
            willPlayName={willPlayName}
            willPlayColor={willPlayColor}
            variant="locked"
          />

          <Box
            sx={{
              textAlign: 'center',
              fontFamily: CARD_FONT,
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: 2,
              animation: 'tierLockBlink 1.4s ease-in-out infinite',
              '@keyframes tierLockBlink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.45 },
              },
            }}
          >
            Waiting for the others…
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
