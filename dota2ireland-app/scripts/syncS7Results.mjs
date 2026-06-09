// Sync Season 7 group-stage results from the Imprint.gg API into the `s7_results`
// Supabase table. Run this after each match is played:
//
//   npm run sync-s7-results
//
// It makes ONE pass over the Imprint API (the league series list + each game's detail),
// computes every matchup's score + full per-game detail, and upserts a row per matchup.
// The website then reads `s7_results` from Supabase — visitors never hit the Imprint API.
//
// Requires in the environment or .env.local:
//   VITE_IMPRINT_API_TOKEN     - Imprint API key
//   VITE_SUPABASE_URL          - Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY  - service role key (writes bypass RLS)
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { buildNameToKey, indexSeries } from '../src/utils/s7Results.js';
import { season7TeamNames } from '../src/data/season7Teams.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMPRINT = 'https://v2.api.imprint.gg';
const LEAGUE_ID = Number(process.argv[2] || 19763);

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* ignore */ }
  return env;
}

const ENV = loadEnv();
const TOKEN = ENV.VITE_IMPRINT_API_TOKEN;
const SUPABASE_URL = ENV.VITE_SUPABASE_URL;
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!TOKEN) throw new Error('VITE_IMPRINT_API_TOKEN not set');
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function imprint(path, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${IMPRINT}${path}`, { headers: { 'x-api-key': TOKEN } });
      if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(400 * (attempt + 1));
    }
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

// ── Fetch from Imprint ──────────────────────────────────────────────────────
const list = await imprint(`/league/${LEAGUE_ID}/matches`);
const series = Array.isArray(list.series) ? list.series : [];
const ids = [...new Set(series.flatMap((s) => s.matches || []))];
console.log(`League ${LEAGUE_ID} (${list.league_name ?? '?'}): ${series.length} series, ${ids.length} games`);

const details = await mapLimit(ids, 4, async (id) => {
  try {
    return await imprint(`/match/${id}`);
  } catch (e) {
    console.warn(`  ! could not fetch match ${id}: ${e.message}`);
    return null;
  }
});
const detailById = new Map(ids.map((id, i) => [id, details[i]]));

// ── Compute results ─────────────────────────────────────────────────────────
const byPair = indexSeries(series, detailById, buildNameToKey(season7TeamNames));

const rows = [];
for (const [pairKey, r] of byPair) {
  const [k1, k2] = r.keys;
  rows.push({
    pair_key: pairKey,
    team1_id: k1,
    team2_id: k2,
    team1_name: season7TeamNames[k1] ?? k1,
    team2_name: season7TeamNames[k2] ?? k2,
    score1: r.winsByKey[k1] ?? 0,
    score2: r.winsByKey[k2] ?? 0,
    completed: r.complete,
    match_ids: r.games.map((g) => g.matchId),
    games: r.games,
    updated_at: new Date().toISOString(),
  });
}

// ── Upsert to Supabase ──────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const { error } = await supabase.from('s7_results').upsert(rows, { onConflict: 'pair_key' });
if (error) {
  console.error('Upsert failed:', error.message || JSON.stringify(error));
  if (error.code === '42P01') console.error('  -> the s7_results table does not exist yet. Run the CREATE TABLE SQL in Supabase first.');
  process.exit(1);
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\nUpserted ${rows.length} matchup(s) into s7_results:`);
for (const row of rows) {
  console.log(
    `  ${row.completed ? '✓' : '·'} ${row.team1_name} ${row.score1}-${row.score2} ${row.team2_name}` +
    `${row.completed ? '' : '   (in progress)'}`,
  );
}
console.log('\nDone. The website now serves these from the DB — no Imprint calls for visitors.');
