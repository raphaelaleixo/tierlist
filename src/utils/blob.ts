/**
 * Organic-blob CSS utilities.
 *
 * - blobBorderRadius(seed): deterministic asymmetric border-radius derived
 *   from a string seed — same seed → same silhouette across renders.
 * - pastel(hex, opacity?): mix a hex colour with white to soften it for use
 *   as a backdrop (e.g., per-player blob behind the card emoji).
 */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BLOB_MIN = 32;
const BLOB_RANGE = 36; // radii vary 32–68%

export function blobBorderRadius(seed: string): string {
  const h = hashString(seed);
  const r = (i: number) => BLOB_MIN + ((h >>> (i * 4)) & 0x3f) % BLOB_RANGE;
  return `${r(0)}% ${r(1)}% ${r(2)}% ${r(3)}% / ${r(4)}% ${r(5)}% ${r(6)}% ${r(7)}%`;
}

/**
 * Mix a hex colour with white to produce a soft pastel (for light cards).
 * @param hex - "#RRGGBB"
 * @param opacity - fraction of colour to keep (0–1). Default 0.25.
 */
export function pastel(hex: string, opacity = 0.25): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * opacity + 255 * (1 - opacity));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/**
 * Mix a hex colour with the app's near-black to produce a darker tint
 * suitable as a blob backdrop on dark cards.
 * @param hex - "#RRGGBB"
 * @param opacity - fraction of colour to keep (0–1). Default 0.4.
 */
export function pastelOnDark(hex: string, opacity = 0.4): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darkR = 21; // #15
  const darkG = 21; // #15
  const darkB = 31; // #1f
  const mix = (c: number, d: number) => Math.round(c * opacity + d * (1 - opacity));
  return `rgb(${mix(r, darkR)}, ${mix(g, darkG)}, ${mix(b, darkB)})`;
}
