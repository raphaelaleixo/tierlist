import { Box } from '@mui/material';
import type { PlayerColor, Round, Tier } from '../../game/types';
import { TIERS } from '../../game/types';
import { writerOf } from '../../game/lifecycle';
import TierCard from '../TierCard';
import type { PlayerMeta } from './playerMeta';

// Right column on the big screen. As cards are revealed each trick, items slot
// into their tier row as full TierCards (height-bound, dark variant).

const TIER_COLORS: Record<Tier, string> = {
  S: '#ef3a3a',
  A: '#ff8c1c',
  B: '#ffce1c',
  C: '#3aaf4d',
  D: '#3a7aef',
  F: '#9a3aef',
};

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

interface ItemEntry {
  key: string;
  item: string;
  emoji: string;
  category: string;
  holderColor: PlayerColor;
  writerName: string;
  tier: Tier;
}

interface Props {
  round: Round;
  meta: Record<number, PlayerMeta>;
  seating: number[];
}

export default function LiveTierList({ round, meta, seating }: Props) {
  const itemsByTier: Record<Tier, ItemEntry[]> = { S: [], A: [], B: [], C: [], D: [], F: [] };

  for (const trick of round.tricks) {
    for (const play of trick.plays) {
      if (!play.revealed) continue;
      const card = round.perPlayer[play.playerId]?.hand?.find((c) => c.id === play.cardId);
      const cat = round.perPlayer[play.playerId]?.categoryAssigned;
      const holder = meta[play.playerId];
      const writerId = writerOf(seating, play.playerId, round.passDirection);
      const writer = meta[writerId];
      if (!card || !cat || !holder) continue;
      itemsByTier[card.tier].push({
        key: card.id,
        item: card.item,
        emoji: cat.emoji,
        category: cat.name,
        holderColor: holder.color,
        writerName: writer?.name ?? `Player ${writerId}`,
        tier: card.tier,
      });
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontFamily: CARD_FONT, flex: 1 }}>
      {TIERS.map((tier) => (
        <TierRow key={tier} tier={tier} items={itemsByTier[tier]} />
      ))}
    </Box>
  );
}

function TierRow({ tier, items }: { tier: Tier; items: ItemEntry[] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        flex: 1,
        minHeight: 64,
        bgcolor: 'rgba(255,255,255,0.04)',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          aspectRatio: '1 / 1',
          bgcolor: TIER_COLORS[tier],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: CARD_FONT,
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#fff',
          flexShrink: 0,
          WebkitTextStroke: '3px rgba(0,0,0,0.35)',
          paintOrder: 'stroke fill',
        }}
      >
        {tier}
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          gap: 0.75,
          p: 0.75,
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {items.map((entry) => (
          <TierCard
            key={entry.key}
            emoji={entry.emoji}
            category={entry.category}
            writerName={entry.writerName}
            holderColor={entry.holderColor}
            item={entry.item}
            tier={entry.tier}
            revealed
            variant="dark"
            heightBound
          />
        ))}
      </Box>
    </Box>
  );
}
