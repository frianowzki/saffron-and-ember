// Saffron & Ember — make.fun entry hand-in script (Node 22, standard library only).
// Copies the static browser game under game/ and its real browser renders under screenshots/
// into /output (or MAKEFUN_OUTPUT_DIR locally), then generates /output/dossier.json.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const screenshotsDest = join(outputDir, 'screenshots');
mkdirSync(screenshotsDest, { recursive: true });
const screenshotsSrc = join(repoRoot, 'screenshots');
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
}

const dossierJson = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossierJson);
