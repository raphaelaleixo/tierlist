// Static category suggestion pool. Seeded from the rulebook's example list +
// broad-appeal common categories. The phone surfaces 3 random suggestions
// alongside a free-text input. Each suggestion ships with a default emoji
// that the player can keep or swap when they pick.

import type { CategoryChoice } from "../game/types";

export const CATEGORY_SUGGESTIONS: readonly CategoryChoice[] = [
  { name: "Animals", emoji: "🐾" },
  { name: "Pizza toppings", emoji: "🍕" },
  { name: "TV shows", emoji: "📺" },
  { name: "90s movies", emoji: "📼" },
  { name: "Snacks", emoji: "🍿" },
  { name: "Bands", emoji: "🎸" },
  { name: "Breakfast cereals", emoji: "🥣" },
  { name: "Cars", emoji: "🚗" },
  { name: "Board games", emoji: "🎲" },
  { name: "Video games", emoji: "🎮" },
  { name: "Books", emoji: "📚" },
  { name: "Drinks", emoji: "🥤" },
  { name: "Holidays", emoji: "🎉" },
  { name: "Seasons", emoji: "🍂" },
  { name: "Colours", emoji: "🎨" },
  { name: "Sports", emoji: "⚽" },
  { name: "World capitals", emoji: "🏛️" },
  { name: "Pets", emoji: "🐶" },
  { name: "Cocktails", emoji: "🍸" },
  { name: "Fast food chains", emoji: "🍔" },
  { name: "Star Wars characters", emoji: "⭐" },
  { name: "Marvel heroes", emoji: "🦸" },
  { name: "Disney movies", emoji: "🏰" },
  { name: "Pixar movies", emoji: "💡" },
  { name: "Musical instruments", emoji: "🎷" },
  { name: "Pasta shapes", emoji: "🍝" },
  { name: "Ice cream flavours", emoji: "🍦" },
  { name: "Sandwiches", emoji: "🥪" },
  { name: "Coffee drinks", emoji: "☕" },
  { name: "Cheese", emoji: "🧀" },
  { name: "Office supplies", emoji: "📎" },
  { name: "Smells", emoji: "👃" },
  { name: "Sushi", emoji: "🍣" },
  { name: "Tacos", emoji: "🌮" },
  { name: "Donuts", emoji: "🍩" },
  { name: "Cakes", emoji: "🎂" },
  { name: "Cookies", emoji: "🍪" },
  { name: "Hot sauces", emoji: "🌶️" },
  { name: "Wines", emoji: "🍷" },
  { name: "Beers", emoji: "🍺" },
  { name: "Teas", emoji: "🍵" },
  { name: "Bagel toppings", emoji: "🥯" },
  { name: "Halloween candy", emoji: "🍭" },
  { name: "Sitcoms", emoji: "🛋️" },
  { name: "Karaoke songs", emoji: "🎤" },
  { name: "Christmas movies", emoji: "🎄" },
  { name: "Halloween costumes", emoji: "👻" },
  { name: "Memes", emoji: "🤣" },
  { name: "Dog breeds", emoji: "🐕" },
  { name: "Houseplants", emoji: "🪴" },
  { name: "Sneakers", emoji: "👟" },
  { name: "Yoga poses", emoji: "🧘" },
  { name: "Sunglasses", emoji: "🕶️" },
  { name: "Dance moves", emoji: "🕺" },
  { name: "Mythical creatures", emoji: "🐉" },
  { name: "Pet peeves", emoji: "😤" },
  { name: "Excuses", emoji: "🤷" },
  { name: "Apps on your phone", emoji: "📱" },
  { name: "Streaming services", emoji: "🎬" },
  { name: "Tropical fruits", emoji: "🥭" },
  { name: "Hairstyles", emoji: "💇" },
  { name: "Karaoke duets", emoji: "🎙️" },
  { name: "Group chat names", emoji: "💬" },
  { name: "Villains", emoji: "🦹" },
  { name: "Movie scores / OSTs", emoji: "🎼" },
  { name: "Sci-fi movies", emoji: "🚀" },
  { name: "Reality TV shows", emoji: "🌹" },
  { name: "Cartoons", emoji: "✏️" },
  { name: "Comic Books", emoji: "💥" },
  { name: "Paintings", emoji: "🖼️" },
  { name: "One-hit wonders", emoji: "📻" },
  { name: "Hobbies", emoji: "🧶" },
  { name: "Superpowers", emoji: "⚡" },
  { name: "Comfort foods", emoji: "🥧" },
  { name: "Childhood games", emoji: "🏃" },
  { name: "School subjects", emoji: "📐" },
  { name: "Video game consoles", emoji: "🕹️" },
] as const;

/** Default emoji shown for a typed free-text category until the player picks one. */
export const DEFAULT_CATEGORY_EMOJI = "📋";

// Shuffle the suggestion pool and take the first `count` entries. Called
// once per round when the round is created; the result is persisted on
// `Round.categorySuggestions` so all clients share the same list and can
// slice their own per-player window.
export function shuffleSuggestionPool(count: number): CategoryChoice[] {
  const pool = [...CATEGORY_SUGGESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
