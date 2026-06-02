// Lock in Season 7 group-stage results from the Imprint.gg API into a committed
// snapshot the app can fall back to when the live API is unavailable.
//
// During the season the app reads results live (api/league-matches + api/match).
// Run this once after groups finish (then commit src/data/s7ResultsSnapshot.json)
// to freeze the final results into version control.
//
//   node scripts/syncS7Results.mjs [leagueId]   # defaults to 19763 (IDL Season 7)
//
// Requires VITE_IMPRINT_API_TOKEN in the environment or .env.local.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMPRINT = 'https://v2.api.imprint.gg';
const LEAGUE_ID = Number(process.argv[2] || 19763);

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

async function imprint(path) {
  const res = await fetch(`${IMPRINT}${path}`, { headers: { 'x-api-key': TOKEN } });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
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

const list = await imprint(`/league/${LEAGUE_ID}/matches`);
const series = Array.isArray(list.series) ? list.series : [];
const ids = [...new Set(series.flatMap((s) => s.matches || []))];

console.log(`League ${LEAGUE_ID} (${list.league_name ?? '?'}): ${series.length} series, ${ids.length} games`);

const details = await mapLimit(ids, 8, async (id) => {
  try {
    return await imprint(`/match/${id}`);
  } catch (e) {
    console.warn(`  ! could not fetch match ${id}: ${e.message}`);
    return null;
  }
});

const detailById = new Map(ids.map((id, i) => [id, details[i]]));

const detailsOut = {};
for (const [id, m] of detailById) {
  if (!m) continue;
  detailsOut[id] = {
    match_id: m.match_id,
    duration: m.duration ?? null,
    teams: (m.teams || []).map((t) => ({
      team_id: t.team_id,
      team_name: t.team_name,
      win: !!t.win,
      kills: t.kills,
      players: (t.players || []).map((p) => ({
        account_id: p.account_id,
        account_name: p.account_name,
        position: p.position,
        hero: p.hero
          ? { name: p.hero.name, icon_src: p.hero.icon_src, static_portrait_src: p.hero.static_portrait_src }
          : null,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        imprint_rating: p.imprint_rating,
      })),
    })),
  };
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  leagueId: LEAGUE_ID,
  series: series.map((s) => ({
    series_id: s.series_id,
    match_count: s.match_count,
    teams: s.teams,
    matches: s.matches,
  })),
  details: detailsOut,
};

const outPath = join(ROOT, 'src/data/s7ResultsSnapshot.json');
writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`);

// Human-readable summary
console.log('\n=== Series results ===');
for (const s of series) {
  const teams = s.teams || [];
  if (teams.length !== 2) continue;
  const wins = { [teams[0].team_id]: 0, [teams[1].team_id]: 0 };
  let played = 0;
  for (const id of s.matches || []) {
    const m = detailById.get(id);
    const w = m?.teams?.find((t) => t.win);
    if (w) { wins[w.team_id] = (wins[w.team_id] || 0) + 1; played += 1; }
  }
  const complete = played >= (s.match_count || (s.matches || []).length);
  console.log(
    `  ${teams[0].team_name}  ${wins[teams[0].team_id]} – ${wins[teams[1].team_id]}  ${teams[1].team_name}` +
    `${complete ? '' : '   (in progress)'}`,
  );
}

console.log(`\nWrote ${outPath} (${series.length} series, ${Object.keys(detailsOut).length} games).`);
console.log('Commit the snapshot to lock these results in.');
