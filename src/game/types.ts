/**
 * Domain types for Tierlist.
 *
 * Two state buckets, persisted at two Firebase paths:
 *   - rooms/{id}/state — RoomState<PlayerSlotData> (react-gameroom: lobby, players)
 *   - rooms/{id}/game  — GameState (this file: phases, rounds, tricks, hearts)
 *
 * Player display name lives on react-gameroom's PlayerSlot.name (set at join time
 * via joinPlayer / PlayerEntryScreen) — not duplicated here.
 */

// ─── Tiers ────────────────────────────────────────────────────────────────

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export const TIERS: readonly Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'] as const;

// Numeric rank for the "lowest wins" rule. F is a sentinel — it has no rank-based
// win power. The only way an F can win is the F-vs-S override (see rules.ts).
export const TIER_RANK: Record<Tier, number> = {
  S: 1,
  A: 2,
  B: 3,
  C: 4,
  D: 5,
  F: 99,
};

// ─── Identity ─────────────────────────────────────────────────────────────

export type PlayerColor = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'magenta';

export const PLAYER_COLORS: readonly PlayerColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'magenta',
] as const;

// Stored on react-gameroom's PlayerSlot<T>['data']. Name lives on slot.name.
export interface PlayerSlotData {
  color: PlayerColor;
}

// ─── Category (chosen during phase 1) ─────────────────────────────────────

// Each player picks a category for a neighbour and tags it with an emoji
// (either from the suggestion pool or a custom one). The emoji travels with
// the category through the round, decorating cards and reveal screens.
export interface CategoryChoice {
  name: string;
  emoji: string;
}

// ─── Tier list (author-time shape) ────────────────────────────────────────

// A complete tier list = exactly 6 items, one per tier. Duplicate item strings
// across tiers are allowed (the paper rules permit "Cat" on both S and A).
export type TierList = Record<Tier, string>;

// ─── Hand (holder-time shape) ─────────────────────────────────────────────

export interface HandCard {
  id: string;        // stable per card; needed because items can repeat
  item: string;      // visible to the holder during play
  tier: Tier;        // hidden to the holder's UI; revealed per-trick
  played: boolean;   // when false at round-end, this is the mystery card
}

// ─── Trick / play ─────────────────────────────────────────────────────────

export interface Play {
  playerId: number;   // 1-based, matches PlayerSlot.id
  cardId: string;     // refs HandCard.id in that player's hand
  revealed: boolean;  // false until the per-trick reveal animation plays
}

export interface Trick {
  index: number;            // 0..4 within a round (5 tricks per round)
  leaderId: number;         // first-player marker holder at start of this trick
  plays: Play[];            // in turn order, clockwise from leader
  winnerId: number | null;  // null until resolve
  fBeatsS: boolean;         // true when the F-vs-S override fired (drives UPSET callout)
}

// ─── Per-player round state ───────────────────────────────────────────────

// Only the irreducible state lives here. "Who-tiers-for-whom" is derived from
// seating + passDirection via helpers in lifecycle.ts (writerOf, recipientOf, ...).
export interface RoundPlayerState {
  // Phase 1 — the category this player picked (for their pass-direction neighbour).
  categoryAssigned: CategoryChoice | null;

  // Phase 2 — the tier list this player wrote (for the neighbour who assigned them a category).
  tierListWritten: TierList | null;

  // Phase 3 — this player's hand to play. Authored by their pass-direction neighbour.
  hand: HandCard[] | null;
}

// ─── Round ────────────────────────────────────────────────────────────────

export type RoundNumber = 1 | 2;
export type PassDirection = 'left' | 'right';  // R1 = left, R2 = right

export type RoundPhase =
  | 'category-pick'
  | 'tier-writing'
  | 'card-play'
  | 'round-end';

export interface Round {
  number: RoundNumber;
  passDirection: PassDirection;
  phase: RoundPhase;
  perPlayer: Record<number, RoundPlayerState>;
  tricks: Trick[];               // grows 0 → 5
  currentTrickIndex: number;     // 0..4
  firstPlayerId: number;         // marker holder at start of round
}

// ─── Game ─────────────────────────────────────────────────────────────────

export type GamePhase =
  | 'lobby'
  | 'in-round'          // delegate to current Round.phase
  | 'game-end-reveal'   // marquee animated walkthrough
  | 'final-score';

export interface GameState {
  phase: GamePhase;
  rounds: [Round] | [Round, Round];  // round 2 created when round 1 ends
  currentRoundIndex: 0 | 1;
  hearts: Record<number, number>;    // playerId → heart count
  seating: number[];                 // clockwise turn order; defines L/R neighbours
}
