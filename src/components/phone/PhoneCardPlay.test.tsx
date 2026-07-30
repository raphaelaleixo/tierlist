import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createInitialGameState,
  submitCategory,
  startTierWriting,
  submitTierList,
  dealHands,
  startCardPlay,
} from '../../game/lifecycle';
import type { GameState, TierList } from '../../game/types';
import type { PlayerMeta } from '../big-screen/playerMeta';
import PhoneCardPlay from './PhoneCardPlay';

// PhoneCardPlay imports writeGameState, which imports ../firebase, which calls
// initializeApp at module load and throws without env vars.
vi.mock('../../hooks/useGameState', () => ({ writeGameState: vi.fn() }));

const SEATING = [1, 2, 3, 4];
const NAMES: Record<number, string> = { 1: 'Alice', 2: 'Bob', 3: 'Carol', 4: 'Dan' };
const HEX: Record<number, string> = { 1: '#e5484d', 2: '#00b4d8', 3: '#ffce1c', 4: '#d6409f' };
const META: Record<number, PlayerMeta> = Object.fromEntries(
  SEATING.map((id) => [id, { id, name: NAMES[id], color: 'red', colorHex: HEX[id] }]),
) as Record<number, PlayerMeta>;

const listFor = (pid: number): TierList => ({
  S: `${pid}-S`, A: `${pid}-A`, B: `${pid}-B`,
  C: `${pid}-C`, D: `${pid}-D`, F: `${pid}-F`,
});

// `firstPlayerId: 2` means it is Bob's turn, NOT Alice's — Alice (myId 1) is
// the player we render, so every test below runs in the off-turn state.
function cardPlayState(firstPlayerId = 2): GameState {
  let s = createInitialGameState(SEATING, firstPlayerId);
  for (const pid of SEATING) s = submitCategory(s, pid, { name: `cat-${pid}`, emoji: '🐾' });
  s = startTierWriting(s);
  for (const pid of SEATING) s = submitTierList(s, pid, listFor(pid));
  s = dealHands(s, (a) => [...a]);
  return startCardPlay(s);
}

function renderHand(state: GameState) {
  return render(<PhoneCardPlay roomId="R" gameState={state} myId={1} meta={META} />);
}

describe('PhoneCardPlay selection', () => {
  it('lets you select a card when it is not your turn', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    const cards = screen.getAllByRole('button', { pressed: false });
    expect(cards.length).toBeGreaterThan(0);

    await user.click(cards[0]);
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('still refuses to play when it is not your turn, even with a card selected', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);

    // The primary CTA reads "Waiting" off-turn and must stay disabled.
    expect(screen.getByRole('button', { name: /waiting/i })).toBeDisabled();
  });

  it('deselects when you tap the same card again', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    const card = screen.getAllByRole('button', { pressed: false })[0];
    await user.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    await user.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('PhoneCardPlay tier guesses', () => {
  it('cannot guess until a card is selected', () => {
    renderHand(cardPlayState());
    expect(screen.getByRole('button', { name: /guess tier/i })).toBeDisabled();
  });

  it('records a guess and shows it on the card with a "?" suffix', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: 'A' }));

    expect(screen.getByText('A?')).toBeInTheDocument();
  });

  it('clears a guess', async () => {
    const user = userEvent.setup();
    renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByText('A?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByText('A?')).not.toBeInTheDocument();
  });

  it('drops a guess when its card leaves the hand', async () => {
    const user = userEvent.setup();
    const { rerender } = renderHand(cardPlayState());

    await user.click(screen.getAllByRole('button', { pressed: false })[0]);
    await user.click(screen.getByRole('button', { name: /guess tier/i }));
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByText('A?')).toBeInTheDocument();

    // A fresh deal produces new card ids, so every existing guess is stale.
    rerender(<PhoneCardPlay roomId="R" gameState={cardPlayState()} myId={1} meta={META} />);
    expect(screen.queryByText('A?')).not.toBeInTheDocument();
  });
});
