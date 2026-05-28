/**
 * Hydrate a raw Firebase RTDB snapshot back into a strict GameState.
 *
 * Firebase strips `null` values and empty objects/arrays on write, so a
 * just-initialised GameState (where every per-player field is null and every
 * round's tricks array is empty) round-trips as a sparse blob. This module
 * fills in the defaults so the lifecycle helpers can rely on the full shape.
 *
 * Also normalises arrays that Firebase serialised as objects with numeric
 * keys (a known quirk for sparse arrays).
 */

import type {
  CategoryChoice,
  GameState,
  GamePhase,
  HandCard,
  PassDirection,
  Play,
  Round,
  RoundPhase,
  RoundPlayerState,
  Tier,
  TierList,
  Trick,
} from './types';

const LEGACY_CATEGORY_FALLBACK_EMOJI = '📋';

type Unknown = Record<string, unknown> | undefined | null;

function toArrayOrObject<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .map((k) => Number(k))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    return keys.map((k) => obj[String(k)] as T);
  }
  return [];
}

function hydrateTierList(raw: unknown): TierList | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const tiers: Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'];
  const out: Partial<TierList> = {};
  for (const t of tiers) out[t] = typeof r[t] === 'string' ? (r[t] as string) : '';
  return out as TierList;
}

function hydrateHand(raw: unknown): HandCard[] | null {
  const arr = toArrayOrObject<Unknown>(raw);
  if (arr.length === 0) return null;
  return arr.map((card) => {
    const c = (card ?? {}) as Record<string, unknown>;
    return {
      id: typeof c.id === 'string' ? c.id : '',
      item: typeof c.item === 'string' ? c.item : '',
      tier: (c.tier as Tier) ?? 'S',
      played: c.played === true,
    };
  });
}

function hydrateCategoryChoice(raw: unknown): CategoryChoice | null {
  if (raw == null) return null;
  // Legacy data (pre-emoji): plain string. Wrap with the fallback emoji.
  if (typeof raw === 'string') return { name: raw, emoji: LEGACY_CATEGORY_FALLBACK_EMOJI };
  if (typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name : null;
    if (!name) return null;
    const emoji = typeof r.emoji === 'string' ? r.emoji : LEGACY_CATEGORY_FALLBACK_EMOJI;
    return { name, emoji };
  }
  return null;
}

function hydratePlayerState(raw: unknown): RoundPlayerState {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    categoryAssigned: hydrateCategoryChoice(r.categoryAssigned),
    tierListWritten: hydrateTierList(r.tierListWritten),
    hand: hydrateHand(r.hand),
  };
}

function hydratePlay(raw: unknown): Play {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    playerId: typeof r.playerId === 'number' ? r.playerId : Number(r.playerId) || 0,
    cardId: typeof r.cardId === 'string' ? r.cardId : '',
    revealed: r.revealed === true,
  };
}

function hydrateTrick(raw: unknown, fallbackIndex: number): Trick {
  const r = (raw ?? {}) as Record<string, unknown>;
  const playsArr = toArrayOrObject<Unknown>(r.plays).map(hydratePlay);
  return {
    index: typeof r.index === 'number' ? r.index : fallbackIndex,
    leaderId: typeof r.leaderId === 'number' ? r.leaderId : Number(r.leaderId) || 0,
    plays: playsArr,
    winnerId: typeof r.winnerId === 'number' ? r.winnerId : null,
    fBeatsS: r.fBeatsS === true,
  };
}

function hydrateRound(raw: unknown, seating: number[]): Round {
  const r = (raw ?? {}) as Record<string, unknown>;

  const perPlayerRaw = (r.perPlayer ?? {}) as Record<string, unknown>;
  const perPlayer: Record<number, RoundPlayerState> = {};
  for (const pid of seating) {
    perPlayer[pid] = hydratePlayerState(perPlayerRaw[String(pid)]);
  }

  const tricks = toArrayOrObject<Unknown>(r.tricks).map((t, i) => hydrateTrick(t, i));

  const suggestionsRaw = toArrayOrObject<Unknown>(r.categorySuggestions);
  const categorySuggestions = suggestionsRaw
    .map((s) => hydrateCategoryChoice(s))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return {
    number: r.number === 2 ? 2 : 1,
    passDirection: (r.passDirection as PassDirection) ?? 'left',
    phase: (r.phase as RoundPhase) ?? 'category-pick',
    perPlayer,
    tricks,
    currentTrickIndex: typeof r.currentTrickIndex === 'number' ? r.currentTrickIndex : 0,
    firstPlayerId: typeof r.firstPlayerId === 'number' ? r.firstPlayerId : 0,
    categorySuggestions,
  };
}

export function deserializeGameState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const seating = toArrayOrObject<number>(r.seating).filter((n) => typeof n === 'number');

  const heartsRaw = (r.hearts ?? {}) as Record<string, unknown>;
  const hearts: Record<number, number> = {};
  for (const pid of seating) {
    const v = heartsRaw[String(pid)];
    hearts[pid] = typeof v === 'number' ? v : 0;
  }

  const roundsRaw = toArrayOrObject<Unknown>(r.rounds);
  const rounds = roundsRaw.map((rd) => hydrateRound(rd, seating)) as GameState['rounds'];

  return {
    phase: (r.phase as GamePhase) ?? 'in-round',
    rounds: rounds.length > 0 ? rounds : ([] as unknown as GameState['rounds']),
    currentRoundIndex: r.currentRoundIndex === 1 ? 1 : 0,
    hearts,
    seating,
  };
}
