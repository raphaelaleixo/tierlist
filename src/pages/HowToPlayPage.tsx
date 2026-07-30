import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Divider, Link, Stack } from '@mui/material';
import AppHeader from '../components/AppHeader';
import PageFooter from '../components/PageFooter';
import HowToTrickExample from '../components/HowToTrickExample';
import { PLAYER_COLOR_HEX } from '../theme/theme';

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const GLOSSARY: ReadonlyArray<readonly [string, ReactNode]> = [
  ['Tier list', 'A player&rsquo;s own six favourites, ranked S (favourite) down to F (hate). Someone else plays it.'],
  ['Category', 'The prompt you tier — “Animals”, “90s movies”, “breakfast cereals”.'],
  ['Hand', 'The six cards you hold and play during a round — another player&rsquo;s tier list, handed to you to play blind.'],
  ['Trick', 'One go-around where every player plays a card. The lowest tier wins it.'],
  ['Heart', 'A point. You earn one for every trick you win.'],
  ['Round', 'A full pick-a-category → write-a-list → five-tricks cycle. A game has two.'],
  ['S-tier / F-tier', 'Your favourite and your most hated. F is the card that beats S.'],
  ['Mystery card', 'The one card you never play, left in hand at round end. Revealed only at the finale.'],
  ['Lead', 'The player who plays first in a trick. It passes to whoever wins each trick.'],
];

export default function HowToPlayPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: CARD_FONT }}>
      <AppHeader />
      <Box
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 760,
          mx: 'auto',
          px: { xs: 3, sm: 4 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Stack spacing={4}>
          {/* ── Intro ─────────────────────────────────────────── */}
          <Stack spacing={1.5}>
            <Box sx={overline}>How to play</Box>
            <Box component="h1" sx={{ ...h1, m: 0 }}>
              Your taste, in someone else&rsquo;s hands
            </Box>
            <Box sx={lead}>
              Tierlist is a trick-taking party game hiding inside a tier list — a web take on{' '}
              <em>My Favourite Things</em> by Nilgiri (Archie Edwards). You secretly rank{' '}
              <b>your own</b> favourites from S to F — then a neighbour plays them without
              knowing the order you gave. Play the lowest tier to win a trick — but the F-tier
              you hate beats the S-tier you love. Most hearts after two rounds wins.
            </Box>
          </Stack>

          <Divider sx={hair} />

          {/* ── Setup ─────────────────────────────────────────── */}
          <Section overline="Before you start" title="Setup">
            <Box component="ul" sx={ul}>
              <li><b>3–6 players</b>, each on their own phone, plus one shared big screen (a laptop or TV).</li>
              <li>Everyone picks a <b>unique colour</b> — that&rsquo;s your identity all game.</li>
              <li>A game is <b>two rounds</b>. In round 1 everything passes <b>left</b>; in round 2 it passes <b>right</b>.</li>
            </Box>
          </Section>

          <Divider sx={hair} />

          {/* ── A round ───────────────────────────────────────── */}
          <Section overline="The loop" title="A round, in three phases">
            <Box sx={body}>
              Each round runs through the same three phases. You&rsquo;ll pick a category for one
              neighbour, secretly rank your own favourites in a category someone handed you,
              then play out five tricks.
            </Box>

            <SubSection n="1" title="Pick a category">
              On your phone, choose a category and hand it to a neighbour — your <b>left</b> neighbour
              in round 1, your <b>right</b> in round 2. They&rsquo;ll rank <b>their own</b>{' '}
              favourites in it — and <b>you&rsquo;ll be the one who plays that list</b> later.
              Stuck for an idea? Tap one of three
              suggestions. Once everyone has picked, every category goes public on the big screen.
            </SubSection>

            <SubSection n="2" title="Write the tier list">
              Now fill in the category a neighbour gave <em>you</em>: <b>your</b> six items —
              your actual favourites, your actual ranking — one for each tier from{' '}
              <b>S (favourite)</b> to <b>F (hate)</b>. When you submit, you get about eight seconds to
              burn the list into memory — because it&rsquo;s hidden for the rest of the round. The
              catch: the person who plays these six cards is your neighbour, not you. You&rsquo;re the
              only one who knows which item you filed under which tier.
            </SubSection>

            <SubSection n="3" title="Play the tricks">
              You&rsquo;re now holding six cards a neighbour wrote — <b>their</b> favourites, not
              yours. You can see the items but{' '}
              <b>not their tiers</b> — the neighbour who wrote them still remembers, as well as they
              can. Over five tricks, everyone plays one card, starting with the lead. Items show
              face-up; tiers stay hidden until all cards are down, then flip one by one. The winner
              takes a heart and leads the next trick.
            </SubSection>
          </Section>

          <Divider sx={hair} />

          {/* ── Winning a trick ───────────────────────────────── */}
          <Section overline="The twist" title="Winning a trick">
            <Box sx={body}>
              Tiers have ranks — <b>S=1, A=2, B=3, C=4, D=5</b> — and the <b>lowest rank wins</b>.
              With one exception, and it&rsquo;s the whole heart of the game:
            </Box>

            <HowToTrickExample />

            <Box sx={body}>
              If at least one <b>S</b> and at least one <b>F</b> are played in the same trick, the{' '}
              <b>F wins</b>. Hate beats love.
            </Box>

            <Box sx={fineHead}>The fine print</Box>
            <Box component="ul" sx={ul}>
              <li><b>Ties</b> — if players tie for the winning card (two S cards, or two F-beats-S situations), the <b>earliest in turn order</b> wins.</li>
              <li><b>An all-F trick</b> — if everyone plays F and no S is out, F has nothing to beat, so the earliest in turn order wins.</li>
              <li><b>Duplicate items</b> — you may write the same item on two tiers (a beloved <em>and</em> hated “Cat”). Both cards exist, and the reveal shows them at their different tiers.</li>
            </Box>
          </Section>

          <Divider sx={hair} />

          {/* ── Scoring ───────────────────────────────────────── */}
          <Section overline="Winning" title="Scoring">
            <Box sx={body}>
              One <Box component="span" sx={{ color: PLAYER_COLOR_HEX.red, fontWeight: 700 }}>heart</Box> per
              trick — ten hearts across the whole game. After two rounds (ten tricks), whoever holds the
              most hearts wins. Tied players <b>share the victory</b>.
            </Box>
          </Section>

          <Divider sx={hair} />

          {/* ── The reveal ────────────────────────────────────── */}
          <Section overline="The payoff" title="The reveal">
            <Box sx={body}>
              After the final trick, the big screen walks through every player&rsquo;s complete tier
              list — both rounds, S through F, including the one card they never played: the{' '}
              <b>mystery card</b>. This is the moment the whole game builds to:{' '}
              <em>&ldquo;Wait — THAT was your F-tier?&rdquo;</em>
            </Box>
          </Section>

          <Divider sx={hair} />

          {/* ── Glossary ──────────────────────────────────────── */}
          <Section overline="Reference" title="Glossary">
            <Box component="dl" sx={{ m: 0, display: 'grid', rowGap: 2 }}>
              {GLOSSARY.map(([term, def]) => (
                <Box key={term}>
                  <Box component="dt" sx={{ ...overline, color: 'text.primary', mb: 0.5 }}>
                    {term}
                  </Box>
                  <Box component="dd" sx={{ ...body, m: 0 }}>
                    {def}
                  </Box>
                </Box>
              ))}
            </Box>
          </Section>

          <Divider sx={hair} />

          <Link component={RouterLink} to="/" underline="hover" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            ← Back to home
          </Link>

          <PageFooter />
        </Stack>
      </Box>
    </Box>
  );
}

// ── section helpers ─────────────────────────────────────────
function Section({ overline: over, title, children }: { overline?: string; title: string; children: ReactNode }) {
  return (
    <Stack component="section" spacing={2}>
      {over && <Box sx={overline}>{over}</Box>}
      <Box component="h2" sx={{ ...h2, m: 0 }}>{title}</Box>
      {children}
    </Stack>
  );
}

function SubSection({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
        <Box
          sx={{
            flex: 'none',
            width: 26,
            height: 26,
            borderRadius: '8px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(255,255,255,0.08)',
            fontFamily: CARD_FONT,
            fontWeight: 900,
            fontSize: '0.85rem',
          }}
        >
          {n}
        </Box>
        <Box component="h3" sx={{ ...h3, m: 0 }}>{title}</Box>
      </Box>
      <Box sx={body}>{children}</Box>
    </Box>
  );
}

// ── shared type tokens ──────────────────────────────────────
const overline = {
  fontFamily: CARD_FONT,
  fontWeight: 700,
  fontSize: '0.72rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: 'text.secondary',
};
const h1 = { fontFamily: CARD_FONT, fontWeight: 900, fontSize: { xs: '2rem', sm: '2.6rem' }, lineHeight: 1.05 };
const h2 = { fontFamily: CARD_FONT, fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.8rem' }, lineHeight: 1.1 };
const h3 = { fontFamily: CARD_FONT, fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 };
const lead = { fontSize: '1.05rem', lineHeight: 1.65, color: 'text.secondary' };
const body = { fontSize: '1rem', lineHeight: 1.65, color: 'text.secondary' };
const fineHead = { ...overline, color: 'text.primary', pt: 0.5 };
const ul = { ...body, m: 0, pl: '1.2em', display: 'grid', rowGap: 1 };
const hair = { borderColor: 'rgba(255,255,255,0.08)' };
