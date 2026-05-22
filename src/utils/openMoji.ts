/**
 * OpenMoji black-variant SVG URLs.
 *
 * OpenMoji files are named by the hex codepoint(s) of the emoji, joined with
 * hyphens for multi-codepoint emojis (flags, ZWJ sequences). Variation
 * selector U+FE0F is stripped from the filename.
 *
 * Asset source: https://github.com/hfg-gmuend/openmoji (CC BY-SA 4.0).
 * CDN: jsDelivr.
 */

const OPENMOJI_BLACK_CDN = 'https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@master/black/svg';
const OPENMOJI_COLOR_CDN = 'https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@master/color/svg';

export function emojiToCodepoint(emoji: string): string {
  return Array.from(emoji)
    .filter((c) => c !== '️') // strip emoji-presentation variation selector
    .map((c) => c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'))
    .join('-');
}

export function openMojiBlackUrl(emoji: string): string {
  return `${OPENMOJI_BLACK_CDN}/${emojiToCodepoint(emoji)}.svg`;
}

export function openMojiColorUrl(emoji: string): string {
  return `${OPENMOJI_COLOR_CDN}/${emojiToCodepoint(emoji)}.svg`;
}
