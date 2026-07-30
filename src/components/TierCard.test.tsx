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
  it('shows "?" when unrevealed with no guess, and keeps the banner translated away', () => {
    renderCard();
    const banner = screen.getByText('?');
    expect(banner).toBeInTheDocument();
    // The banner sits translated out of view until it has something to say.
    // Without this assertion the test passes even if no guess renders
    // off-screen, which is the bug it exists to catch.
    expect(banner).toHaveStyle({ transform: 'translateY(110%)' });
  });

  it('shows the guessed tier with a "?" suffix, and brings the banner into view', () => {
    renderCard({ guess: 'A' });
    const banner = screen.getByText('A?');
    expect(banner).toBeInTheDocument();
    expect(screen.queryByText('?')).not.toBeInTheDocument();
    // The banner sits translated out of view until it has something to say.
    // Without this assertion the test passes even if the guess renders
    // off-screen, which is the bug it exists to catch.
    expect(banner).toHaveStyle({ transform: 'none' });
  });

  it('shows the real tier once revealed, ignoring any guess', () => {
    renderCard({ tier: 'S', revealed: true, guess: 'F' });
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.queryByText('F?')).not.toBeInTheDocument();
  });
});
