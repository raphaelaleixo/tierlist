/**
 * Loads OpenMoji's `data/openmoji.json` once and exposes:
 *
 *   - `loadOpenMojiData()` — async loader, caches a Set<hexcode> at module
 *     level (and in localStorage for instant subsequent loads).
 *   - `getOpenMojiHexcode(emoji)` — synchronous lookup; tries a few common
 *     codepoint normalisations (with/without trailing FE0F, with/without
 *     any FE0F) and returns whichever one matches an OpenMoji filename, or
 *     `null` if it's genuinely unsupported / data not loaded.
 *   - `unsupportedEmojiIds(...)` — IDs in `@emoji-mart/data` whose native
 *     glyph isn't in OpenMoji, for the picker's `exceptEmojis` prop.
 *
 * Why a Set of hexcodes (not a Map keyed by emoji char)? Different sources
 * sometimes encode the same emoji slightly differently (FE0F presence,
 * normalisation form, etc), so keying by exact char misses. Hexcodes are
 * the canonical filename identity OpenMoji uses on disk — checking
 * normalised codepoint sequences against the Set matches reliably.
 */

import emojiData from '@emoji-mart/data';

// Served from the app's own origin (synced via `npm run sync-openmoji`),
// so no CORS / CDN flakiness.
const OPENMOJI_DATA_URLS = ['/openmoji/data/openmoji.json'];
const CACHE_KEY = 'tierlist.openmojiHexcodes.v2';

interface OpenMojiEntry {
  hexcode: string;
}

let supported: Set<string> | null = null;
let pending: Promise<Set<string>> | null = null;

async function fetchFirstAvailable(): Promise<OpenMojiEntry[]> {
  let lastError: unknown;
  for (const url of OPENMOJI_DATA_URLS) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as OpenMojiEntry[];
    } catch (err) {
      lastError = err;
      console.warn('[OpenMoji] failed to load', url, err);
    }
  }
  throw lastError ?? new Error('All OpenMoji data sources failed');
}

function readCache(): Set<string> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return null;
  }
}

function writeCache(set: Set<string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage might be unavailable / over quota — non-fatal.
  }
}

export function loadOpenMojiData(): Promise<Set<string>> {
  console.info('[OpenMoji] loadOpenMojiData() called');
  if (supported) return Promise.resolve(supported);
  const stored = readCache();
  if (stored) {
    supported = stored;
    console.info(`[OpenMoji] loaded ${supported.size} hexcodes from cache`);
    return Promise.resolve(supported);
  }
  if (pending) return pending;
  console.info('[OpenMoji] fetching from CDN...');
  pending = fetchFirstAvailable()
    .then((entries) => {
      supported = new Set(entries.map((e) => e.hexcode));
      writeCache(supported);
      console.info(`[OpenMoji] fetched ${supported.size} hexcodes`);
      return supported;
    })
    .catch((err) => {
      console.error('[OpenMoji] could not load support list', err);
      supported = new Set();
      return supported;
    });
  return pending;
}

export function isOpenMojiDataLoaded(): boolean {
  return supported !== null;
}

function toHexCodepoints(emoji: string): string[] {
  return Array.from(emoji).map((c) =>
    c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'),
  );
}

/**
 * Synchronous lookup. Returns the hexcode variant that matches an OpenMoji
 * filename, or `null` if unsupported / data not loaded yet. Tries:
 *   1. All codepoints as-is (`1F636-200D-1F32B-FE0F`).
 *   2. Without trailing FE0F (`1F636-200D-1F32B`).
 *   3. Without any FE0F at all (last resort).
 * The first hit wins.
 */
export function getOpenMojiHexcode(emoji: string): string | null {
  if (!supported || supported.size === 0) return null;
  const codepoints = toHexCodepoints(emoji);

  const asIs = codepoints.join('-');
  if (supported.has(asIs)) return asIs;

  if (codepoints[codepoints.length - 1] === 'FE0F') {
    const trimmed = codepoints.slice(0, -1).join('-');
    if (supported.has(trimmed)) return trimmed;
  }

  const stripped = codepoints.filter((c) => c !== 'FE0F').join('-');
  if (supported.has(stripped)) return stripped;

  return null;
}

type EmojiMartData = {
  emojis: Record<string, { skins: { native: string }[] }>;
};

/**
 * True if the emoji is a "compound" flag — country flags via regional
 * indicators (🇺🇸), subdivision flags via tag sequences (🏴󠁧󠁢󠁥󠁮󠁧󠁿), or
 * ZWJ-composed flags built on white/black flag (🏳️‍🌈 rainbow,
 * 🏳️‍⚧️ trans, 🏴‍☠️ pirate). We hide all of these because OpenMoji's
 * black variant renders them all as the same generic flag outline.
 *
 * Plain single-glyph flag emojis (🏳️, 🏴, 🚩, 🏁) are visually distinct
 * and stay.
 */
function isFlagEmoji(emoji: string): boolean {
  const cps = Array.from(emoji).map((c) => c.codePointAt(0)!);
  if (cps.length === 0) return false;
  // Regional indicator pair: each codepoint in U+1F1E6..U+1F1FF.
  if (cps.length === 2 && cps.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)) return true;
  // Any composed sequence starting with white flag (🏳️) or black flag
  // (🏴) — catches tag-sequence subdivisions AND ZWJ flags (rainbow,
  // trans, pirate).
  const first = cps[0];
  const isFlagBase = first === 0x1f3f3 || first === 0x1f3f4;
  if (isFlagBase && cps.length > 1 && cps.slice(1).some((cp) => cp !== 0xfe0f)) {
    return true;
  }
  return false;
}

/** Emoji IDs in `@emoji-mart/data` whose native glyph isn't in OpenMoji,
 *  plus all flag emojis (hidden because the black variant can't distinguish
 *  them visually). */
export function unsupportedEmojiIds(_supported: Set<string>): string[] {
  if (_supported.size === 0) return [];
  const data = emojiData as unknown as EmojiMartData;
  const out: string[] = [];
  for (const [id, entry] of Object.entries(data.emojis)) {
    const native = entry.skins[0]?.native;
    if (!native) {
      out.push(id);
      continue;
    }
    if (isFlagEmoji(native)) {
      out.push(id);
      continue;
    }
    if (getOpenMojiHexcode(native) === null) out.push(id);
  }
  return out;
}
