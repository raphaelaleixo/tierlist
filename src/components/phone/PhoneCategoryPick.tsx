import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Popover, Stack, TextField } from '@mui/material';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';
import type { CategoryChoice, GameState } from '../../game/types';
import { submitCategory, writerOf } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import { DEFAULT_CATEGORY_EMOJI } from '../../data/categorySuggestions';
import { pastelOnDark } from '../../utils/blob';
import { loadOpenMojiData, unsupportedEmojiIds } from '../../utils/openMojiSupport';
import OpenMojiIcon from '../OpenMojiIcon';
import ShinyButton from '../ShinyButton';
import PlayerNameChip from '../PlayerNameChip';
import type { PlayerMeta } from '../big-screen/playerMeta';

interface Props {
  roomId: string;
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

export default function PhoneCategoryPick({ roomId, gameState, myId, meta }: Props) {
  const round = gameState.rounds[gameState.currentRoundIndex]!;
  const myEntry = round.perPlayer[myId];
  const already = myEntry?.categoryAssigned ?? null;
  const me = meta[myId];
  const recipientId = writerOf(gameState.seating, myId, round.passDirection);
  const recipient = meta[recipientId];
  const recipientName = recipient?.name ?? `Player ${recipientId}`;
  const myColor = me?.colorHex ?? '#888';
  const recipientColor = recipient?.colorHex ?? '#888';

  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState<string>(DEFAULT_CATEGORY_EMOJI);
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLDivElement | null>(null);

  // Sync emoji-mart's picker with OpenMoji's catalogue. Fetch the
  // emoji-to-hexcode map on mount (cached at module level + localStorage),
  // then derive the `exceptEmojis` list of IDs to hide so players can only
  // pick emojis that will actually render as OpenMoji.
  const [openMojiSet, setOpenMojiSet] = useState<Set<string> | null>(null);
  useEffect(() => {
    loadOpenMojiData().then(setOpenMojiSet);
  }, []);
  const exceptEmojis = useMemo(
    () => (openMojiSet ? unsupportedEmojiIds(openMojiSet) : []),
    [openMojiSet],
  );
  // Each round's `categorySuggestions` is a shuffled pool persisted on the
  // game state when the round is created. Each player slices their own
  // 3-item window, so no two players ever see the same suggestion.
  const mySeatIndex = gameState.seating.indexOf(myId);
  const suggestions = round.categorySuggestions.slice(mySeatIndex * 3, mySeatIndex * 3 + 3);

  if (already !== null) {
    return (
      <Box
        sx={{
          flex: 1,
          background: `linear-gradient(to bottom, ${pastelOnDark(myColor, 0.35)} 0%, ${pastelOnDark(myColor, 0.12)} 100%)`,
          fontFamily: CARD_FONT,
        }}
      >
        <Container maxWidth="xs" sx={{ py: 4 }}>
          <Stack spacing={3.5}>
            {/* Headline */}
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  fontFamily: CARD_FONT,
                  fontWeight: 900,
                  fontSize: '2.4rem',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  color: myColor,
                }}
              >
                Locked in
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
                for <PlayerNameChip name={recipientName} colorHex={recipientColor} /> to tier.
              </Box>
            </Box>

            {/* The locked category — rendered in the secondary button style
                for visual continuity with the picker screen. */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                px: 2.5,
                py: 1.5,
                borderRadius: '13px',
                bgcolor: pastelOnDark(myColor, 0.35),
                fontFamily: CARD_FONT,
                fontWeight: 800,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                color: '#fff',
              }}
            >
              <OpenMojiIcon emoji={already.emoji} variant="black" invert size="1.8rem" />
              {already.name}
            </Box>

            {/* Waiting indicator */}
            <Box
              sx={{
                textAlign: 'center',
                fontFamily: CARD_FONT,
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: 2,
                animation: 'lockBlink 1.4s ease-in-out infinite',
                '@keyframes lockBlink': {
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

  async function handleSubmit(choice: CategoryChoice) {
    if (!choice.name.trim()) return;
    setSubmitting(true);
    try {
      await writeGameState(
        roomId,
        submitCategory(gameState, myId, { name: choice.name.trim(), emoji: choice.emoji }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        // Fill the body wrapper (which is sized to viewport - headers via
        // the flex chain in PhoneGame) so the gradient covers the screen.
        flex: 1,
        background: `linear-gradient(to bottom, ${pastelOnDark(myColor, 0.35)} 0%, ${pastelOnDark(myColor, 0.12)} 100%)`,
        fontFamily: CARD_FONT,
      }}
    >
      <Container maxWidth="xs" sx={{ py: 4 }}>
        <Stack spacing={3.5}>
          {/* Headline */}
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontWeight: 900,
                fontSize: '2.4rem',
                lineHeight: 1,
                textTransform: 'uppercase',
                color: '#ffce1c',
                animation: 'pickPulse 700ms ease-in-out infinite alternate',
                '@keyframes pickPulse': {
                  from: { color: '#ffce1c' },
                  to: { color: '#fff5b0' },
                },
              }}
            >
              Pick a category
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
              for <PlayerNameChip name={recipientName} colorHex={recipientColor} /> to tier.
            </Box>
          </Box>

          {/* Text input with emoji button */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
            <Box
              ref={(el: HTMLDivElement | null) => setEmojiAnchorEl(el)}
              sx={{ flex: '0 0 auto' }}
            >
              <ShinyButton
                accent={myColor}
                variant="secondary"
                onClick={() => setPickerOpen(true)}
                ariaLabel="Pick emoji"
              >
                <OpenMojiIcon emoji={emoji} variant="black" invert size="1.8rem" />
              </ShinyButton>
            </Box>
            <TextField
              placeholder="Type your category…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 40 } }}
              sx={{
                // The OutlinedInput (visible pill) is the one with intrinsic
                // height. It uses `display: inline-flex; align-items: center;`,
                // so giving it a `min-height` matching the ShinyButton's
                // natural footprint vertically centers the input inside it.
                // `height: 100%` would need a definite parent height to
                // resolve — the row is content-sized, so we just lock the
                // pill's height directly.
                '& .MuiInputBase-root': {
                  minHeight: 56,
                  bgcolor: 'rgba(0,0,0,0.25)',
                  fontFamily: CARD_FONT,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                  '&:hover fieldset': { borderColor: pastelOnDark(myColor, 0.6) },
                  '&.Mui-focused fieldset': { borderColor: myColor, borderWidth: 2 },
                },
                // Drop the input's vertical padding — the pill's min-height
                // + flex centering is doing the work now.
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
          <Popover
            open={pickerOpen}
            anchorEl={emojiAnchorEl}
            onClose={() => setPickerOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{ paper: { sx: { bgcolor: 'transparent', boxShadow: 'none' } } }}
          >
            <Picker
              data={emojiData}
              exceptEmojis={exceptEmojis}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
              perLine={8}
              maxFrequentRows={1}
              onEmojiSelect={(e: { native: string }) => {
                setEmoji(e.native);
                setPickerOpen(false);
              }}
            />
          </Popover>

          {/* Suggestions */}
          <Stack spacing={1.2}>
            <Box
              sx={{
                fontFamily: CARD_FONT,
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: 2,
                textAlign: 'center',
              }}
            >
              or tap a suggestion
            </Box>
            <Stack spacing={1}>
              {suggestions.map((s) => (
                <ShinyButton
                  key={s.name}
                  accent={myColor}
                  variant="secondary"
                  fullWidth
                  disabled={submitting}
                  onClick={() => void handleSubmit(s)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <OpenMojiIcon emoji={s.emoji} variant="black" invert size="1.8rem" />
                    <Box sx={{ fontWeight: 800, fontSize: '1rem' }}>{s.name}</Box>
                  </Box>
                </ShinyButton>
              ))}
            </Stack>
          </Stack>

          {/* Lock-in button */}
          <ShinyButton
            accent={myColor}
            variant="primary"
            fullWidth
            disabled={!text.trim() || submitting}
            onClick={() => void handleSubmit({ name: text, emoji })}
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
