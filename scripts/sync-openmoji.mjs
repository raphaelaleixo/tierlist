#!/usr/bin/env node
/**
 * Sync OpenMoji assets into `public/openmoji/` so the app can serve them
 * from its own origin (no flaky third-party CDN, no CORS surprises).
 *
 * Pulls:
 *   - black/svg/* — the line-art SVGs we use everywhere except 🔥 × N.
 *   - data/openmoji.json — used to know which emojis are supported so the
 *     picker can filter unsupported ones out.
 *
 * Idempotent: skips the download if the target folder already has files.
 * Runs as `postinstall` so `npm install` (and Vercel's build step) always
 * results in a populated `public/openmoji/`. The folder is gitignored —
 * each developer / CI run regenerates from upstream.
 */

import degit from 'degit';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_OPENMOJI = join(ROOT, 'public', 'openmoji');
const BLACK_DIR = join(PUBLIC_OPENMOJI, 'black', 'svg');
const DATA_DIR = join(PUBLIC_OPENMOJI, 'data');

function alreadyPopulated(dir) {
  try {
    return existsSync(dir) && readdirSync(dir).length > 100;
  } catch {
    return false;
  }
}

async function clone(repoPath, dest, label) {
  mkdirSync(dest, { recursive: true });
  const emitter = degit(repoPath, { force: true, cache: false });
  emitter.on('info', (info) => {
    if (info.message) console.log(`  ${info.message}`);
  });
  await emitter.clone(dest);
  console.log(`  ✓ ${label} → ${dest.replace(ROOT + '/', '')}`);
}

async function main() {
  if (alreadyPopulated(BLACK_DIR) && existsSync(join(DATA_DIR, 'openmoji.json'))) {
    console.log('[sync-openmoji] assets already present, skipping.');
    return;
  }

  console.log('[sync-openmoji] fetching OpenMoji assets from GitHub...');
  await clone('hfg-gmuend/openmoji/black/svg', BLACK_DIR, 'black/svg');
  await clone('hfg-gmuend/openmoji/data', DATA_DIR, 'data');
  console.log('[sync-openmoji] done.');
}

main().catch((err) => {
  console.error('[sync-openmoji] failed:', err);
  process.exit(1);
});
