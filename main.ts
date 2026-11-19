// Leonida Legends — the hand-in program for gta6-trophy-guide-01 (Node 22,
// standard library only). It validates the entry, then copies app/ and
// screenshots/ from this repository into the output directory and writes
// /output/dossier.json with the vendored make.fun library, which is what the
// judge reads. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The guide itself is plain static files under app/ (index.html, app.js,
// style.css, data/trophies.json) and works offline in desktop Chrome.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SCREENSHOT_BYTES = 262144;
const EXPECTED_TROPHIES = 55;

function fail(message) {
  throw new Error('gta6-trophy-guide-01: ' + message);
}

function checkTrophyFile() {
  const trophyPath = join(REPO_ROOT, 'app', 'data', 'trophies.json');
  if (!existsSync(trophyPath)) fail('app/data/trophies.json is missing');
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(trophyPath, 'utf8'));
  } catch (error) {
    fail('app/data/trophies.json does not parse: ' + error.message);
  }
  const list = Array.isArray(parsed) ? parsed : parsed.trophies;
  if (!Array.isArray(list) || list.length !== EXPECTED_TROPHIES) {
    fail('trophies.json must hold exactly ' + EXPECTED_TROPHIES + ' trophies, found ' + (Array.isArray(list) ? list.length : 'none'));
  }
  for (const trophy of list) {
    if (typeof trophy.name !== 'string' || !trophy.name.trim()) fail('a trophy is missing its name');
    if (typeof trophy.guide !== 'string' || !trophy.guide.trim()) fail('trophy "' + trophy.name + '" has no guide');
  }
  return list.length;
}

function checkScreenshotFolder() {
  const shotDir = join(REPO_ROOT, 'screenshots');
  if (!existsSync(shotDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    fail('screenshots/ must hold 3 or 4 files, found ' + shots.length);
  }
  for (const name of shots) {
    const file = join(shotDir, name);
    if (!statSync(file).isFile()) fail('screenshots/' + name + ' is not a regular file');
    const size = statSync(file).size;
    if (size > MAX_SCREENSHOT_BYTES) {
      fail('screenshots/' + name + ' is ' + size + ' bytes, over the 256 KiB cap');
    }
    const suffix = extname(name).toLowerCase();
    if (suffix !== '.jpg' && suffix !== '.jpeg' && suffix !== '.png') {
      fail('screenshots/' + name + ' is not a JPEG or PNG');
    }
  }
  return shots.length;
}

const trophyCount = checkTrophyFile();
const screenshotCount = checkScreenshotFolder();

mkdirSync(OUTPUT_DIR, { recursive: true });
cpSync(join(REPO_ROOT, 'app'), join(OUTPUT_DIR, 'app'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'screenshots'), { recursive: true });
cpSync(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });

// Same caps as the scorer: the dossier text is capped at 160 KiB, at most 4
// screenshots of at most 256 KiB each, app/ at most 993 files and 48 MiB.
writeFileSync(
  join(OUTPUT_DIR, 'dossier.json'),
  buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log('Leonida Legends handed in: ' + trophyCount + ' trophies, ' + screenshotCount + ' screenshots -> ' + OUTPUT_DIR);
