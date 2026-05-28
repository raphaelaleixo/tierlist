/**
 * OpenMoji SVG URLs — served from the app's own `public/openmoji/` (synced
 * via `npm run sync-openmoji`). No third-party CDN, no CORS surprises.
 *
 * OpenMoji files are named by the hex codepoint(s) of the emoji, joined
 * with hyphens for multi-codepoint emojis. We keep `emojiToCodepoint` as a
 * best-effort fallback when the canonical mapping (from `openMojiSupport`)
 * isn't loaded yet — but the support map is the source of truth.
 *
 * We only ship the black variant locally (~22 MB). Color usages fall back
 * to native emoji rendering in OpenMojiIcon.
 */

const OPENMOJI_BLACK_CDN = '/openmoji/black/svg';

export function emojiToCodepoint(emoji: string): string {
  const codepoints = Array.from(emoji).map((c) =>
    c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'),
  );
  // Strip TRAILING U+FE0F (the emoji-presentation variation selector) but
  // keep it mid-sequence. This is correct for most simple cases; composed
  // ZWJ sequences may need the exact hexcode from `openMojiSupport`.
  while (codepoints.length > 0 && codepoints[codepoints.length - 1] === 'FE0F') {
    codepoints.pop();
  }
  return codepoints.join('-');
}

export function openMojiBlackUrl(emoji: string): string {
  return `${OPENMOJI_BLACK_CDN}/${emojiToCodepoint(emoji)}.svg`;
}

// Kept for API compatibility — color is no longer self-hosted. Callers that
// requested `variant="color"` now hit the native-emoji fallback in
// OpenMojiIcon, so this URL won't actually be loaded.
export function openMojiColorUrl(emoji: string): string {
  return `${OPENMOJI_BLACK_CDN}/${emojiToCodepoint(emoji)}.svg`;
}
