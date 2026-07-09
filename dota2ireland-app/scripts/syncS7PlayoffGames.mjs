// Bake Season 7 playoff game detail into a committed JSON file so the bracket renders
// series detail (players, heroes, K/D/A, Imprint scores) with NO runtime Imprint calls.
//
// Reads the match ids recorded in src/data/s7PlayoffResults.js, fetches each game from
// Imprint, and writes src/data/s7PlayoffGames.json keyed by match id. Run after recording
// new playoff results, then commit the JSON alongside the results:
//
//   npm run sync-s7-playoff-games
//
// Requires VITE_IMPRINT_API_TOKEN in the environment or .env.local.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { s7PlayoffResults } from '../src/data/s7PlayoffResults.js';
import { gameFromMatchDetail } from '../src/utils/s7Results.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMPRINT = 'https://v2.api.imprint.gg';

function loadToken() {
  if (process.env.VITE_IMPRINT_API_TOKEN) return process.env.VITE_IMPRINT_API_TOKEN;
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
    const line = env.split('\n').find((l) => l.startsWith('VITE_IMPRINT_API_TOKEN='));
    if (line) return line.slice('VITE_IMPRINT_API_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
  } catch { /* ignore */ }
  throw new Error('VITE_IMPRINT_API_TOKEN not found (set it in the environment or .env.local)');
}

const TOKEN = loadToken();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMatch(id, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${IMPRINT}/match/${id}`, { headers: { 'x-api-key': TOKEN } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(400 * (attempt + 1));
    }
  }
}

// Collect every match id referenced across all divisions' recorded results.
const ids = [...new Set(
  Object.values(s7PlayoffResults).flatMap((div) => Object.values(div).flatMap((r) => r.matchIds || [])),
)];
console.log(`Baking ${ids.length} playoff game(s)...`);

const out = {};
for (const id of ids) {
  try {
    const m = await fetchMatch(id);
    out[id] = gameFromMatchDetail(m, 1); // `game` number is assigned per-series at render time
    const w = (m.teams || []).find((t) => t.win);
    console.log(`  ✓ ${id} — winner ${w?.team_name ?? '?'}`);
  } catch (e) {
    console.warn(`  ! ${id} failed: ${e.message}`);
  }
}

const outPath = join(ROOT, 'src/data/s7PlayoffGames.json');
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`\nWrote ${outPath} (${Object.keys(out).length}/${ids.length} games). Commit it with the results.`);
