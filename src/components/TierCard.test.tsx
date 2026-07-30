import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TierCard from './TierCard';

// The banner is the only place a tier is ever shown on a card. It has three
// states and the precedence between them is the whole contract:
//   revealed        -> the real tier, full colour
//   guess, unrevealed -> "S?" style, muted
//   neither         -> "?"
function renderCard(props: Partial<React.ComponentProps<typeof TierCard>> = {}) {
  return render(
    <TierCard
      emoji="🐾"
      category="Animals"
      writerName="Bob"
      holderColor="red"
      item="Cat"
      tier="S"
      revealed={false}
      {...props}
    />,
  );
}

describe('TierCard tier banner', () => {
  it('shows "?" when unrevealed with no guess', () => {
    renderCard();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows the guessed tier with a "?" suffix when unrevealed', () => {
    renderCard({ guess: 'A' });
    expect(screen.getByText('A?')).toBeInTheDocument();
    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });

  it('shows the real tier once revealed, ignoring any guess', () => {
    renderCard({ tier: 'S', revealed: true, guess: 'F' });
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.queryByText('F?')).not.toBeInTheDocument();
  });
});
