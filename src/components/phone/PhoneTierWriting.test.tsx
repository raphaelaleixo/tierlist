import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { GameState } from '../../game/types';
import { createInitialGameState, submitCategory, startTierWriting } from '../../game/lifecycle';
import PhoneTierWriting from './PhoneTierWriting';
import type { PlayerMeta } from '../big-screen/playerMeta';

// Mock the Firebase-dependent hook before importing the component
vi.mock('../../hooks/useGameState', () => ({
  writeGameState: vi.fn(),
}));

describe('PhoneTierWriting', () => {
  it('shows the correct player who will play your list (assignerOf, not writerOf)', () => {
    // Build a game state at tier-writing phase
    const seating = [1, 2, 3, 4];
    let state: GameState = createInitialGameState(seating, 1);

    // All players pick a category
    state = submitCategory(state, 1, { name: 'Category A', emoji: '🐾' });
    state = submitCategory(state, 2, { name: 'Category B', emoji: '🐾' });
    state = submitCategory(state, 3, { name: 'Category C', emoji: '🐾' });
    state = submitCategory(state, 4, { name: 'Category D', emoji: '🐾' });

    // Start tier-writing phase
    state = startTierWriting(state);

    // Build player metadata with known names
    const meta: Record<number, PlayerMeta> = {
      1: { id: 1, name: 'Alice', color: 'red', colorHex: '#ff0000' },
      2: { id: 2, name: 'Bob', color: 'cyan', colorHex: '#00ffff' },
      3: { id: 3, name: 'Carol', color: 'green', colorHex: '#00ff00' },
      4: { id: 4, name: 'Dan', color: 'magenta', colorHex: '#ff00ff' },
    };

    // Render as Alice (myId=1)
    // In R1 (passDirection='left'), Alice's assigner is the neighbour to her right: Bob (2)
    // The old bug used writerOf(1, 'left') = left neighbour = Dan (4)
    // The fix uses assignerOf(1, 'left') = right neighbour = Bob (2)
    render(
      <PhoneTierWriting
        roomId="test-room"
        gameState={state}
        myId={1}
        meta={meta}
      />
    );

    // Assert that the output contains Bob (correct) and NOT Dan (the bug value)
    expect(screen.getByText('Bob')).toBeTruthy();
    // Dan is specifically the wrong player the old bug produced (via writerOf),
    // so we verify it's absent to ensure the fix is in place
    expect(screen.queryByText('Dan')).toBeNull();
  });
});
