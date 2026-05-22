// Static category suggestion pool. Seeded from the rulebook's example list +
// broad-appeal common categories. The phone surfaces 3 random suggestions
// alongside a free-text input. Each suggestion ships with a default emoji
// that the player can keep or swap when they pick.

import type { CategoryChoice } from '../game/types';

export const CATEGORY_SUGGESTIONS: readonly CategoryChoice[] = [
  { name: 'Animals',                emoji: '🐾' },
  { name: 'Pizza toppings',         emoji: '🍕' },
  { name: 'TV shows',               emoji: '📺' },
  { name: '90s movies',             emoji: '📼' },
  { name: 'Snacks',                 emoji: '🍿' },
  { name: 'Bands',                  emoji: '🎸' },
  { name: 'Breakfast cereals',      emoji: '🥣' },
  { name: 'Cars',                   emoji: '🚗' },
  { name: 'Board games',            emoji: '🎲' },
  { name: 'Video games',            emoji: '🎮' },
  { name: 'Books',                  emoji: '📚' },
  { name: 'Drinks',                 emoji: '🥤' },
  { name: 'Holidays',               emoji: '🎉' },
  { name: 'Seasons',                emoji: '🍂' },
  { name: 'Colours',                emoji: '🎨' },
  { name: 'Sports',                 emoji: '⚽' },
  { name: 'World capitals',         emoji: '🏛️' },
  { name: 'Pets',                   emoji: '🐶' },
  { name: 'Cocktails',              emoji: '🍸' },
  { name: 'Fast food chains',       emoji: '🍔' },
  { name: 'Star Wars characters',   emoji: '⭐' },
  { name: 'Marvel heroes',          emoji: '🦸' },
  { name: 'Disney movies',          emoji: '🏰' },
  { name: 'Pixar movies',           emoji: '💡' },
  { name: 'Musical instruments',    emoji: '🎷' },
  { name: 'Pasta shapes',           emoji: '🍝' },
  { name: 'Ice cream flavours',     emoji: '🍦' },
  { name: 'Sandwiches',             emoji: '🥪' },
  { name: 'Coffee drinks',          emoji: '☕' },
  { name: 'Cheese',                 emoji: '🧀' },
  { name: 'Office supplies',        emoji: '📎' },
  { name: 'Smells',                 emoji: '👃' },
] as const;

/** Default emoji shown for a typed free-text category until the player picks one. */
export const DEFAULT_CATEGORY_EMOJI = '📋';

export function pickRandomSuggestions(
  count = 3,
  excludeNames: readonly string[] = [],
): CategoryChoice[] {
  const pool = CATEGORY_SUGGESTIONS.filter((c) => !excludeNames.includes(c.name));
  const out: CategoryChoice[] = [];
  const indices = new Set<number>();
  while (out.length < count && indices.size < pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    if (indices.has(i)) continue;
    indices.add(i);
    out.push(pool[i]);
  }
  return out;
}
