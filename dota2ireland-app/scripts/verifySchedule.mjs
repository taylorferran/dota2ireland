// Verify the published Season 7 schedule against live availability data.
// 1. For every scheduled game, list any player blocked at that exact slot (=> standin).
// 2. Produce a consolidated standin list across all divisions.
// 3. Per-player availability health check (days available across the 5-week window).
//
// Reads: src/data/matchScheduleSeason7.ts (the published schedule),
//        src/pages/League.jsx (season7TeamNames slug->name),
//        Supabase teams_s7 + s7_availability (live rosters & availability).
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };

// --- slug -> display name (from League.jsx season7TeamNames) ---
const leagueSrc = readFileSync(new URL('../src/pages/League.jsx', import.meta.url), 'utf8');
const namesBlock = leagueSrc.slice(leagueSrc.indexOf('season7TeamNames = {'));
const slugToName = {};
for (const m of namesBlock.slice(0, namesBlock.indexOf('};')).matchAll(/(\w+):\s*"([^"]+)"/g)) slugToName[m[1]] = m[2];

// --- live teams + availability ---
const J = (x) => { if (Array.isArray(x)) return x; if (typeof x === 'string') { try { return JSON.parse(x); } catch { return null; } } return x; };
const teamsRaw = await (await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/teams_s7?select=name,division_id,players`, { headers })).json();
const availRaw = await (await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/s7_availability?select=auth_id,blocked_slots`, { headers })).json();
const blockedBy = {}; for (const r of availRaw) blockedBy[r.auth_id] = new Set(r.blocked_slots || []);
const teamByName = {}; for (const t of teamsRaw) teamByName[t.name.trim()] = (J(t.players) || []).map(J).filter(Boolean);
const playersForSlug = (slug) => teamByName[(slugToName[slug] || '').trim()] || [];

// --- parse published schedule ---
const schedSrc = readFileSync(new URL('../src/data/matchScheduleSeason7.ts', import.meta.url), 'utf8');
const DIV_LABEL = { 1: 'D1', 2: 'D2A', 22: 'D2B', 23: 'D2C', 3: 'D3' };
const games = [];
for (const m of schedSrc.matchAll(/division:\s*(\d+),\s*week:\s*(\d+),\s*team1Id:\s*'([^']+)',\s*team2Id:\s*'([^']+)',\s*date:\s*'([^']+)',\s*time:\s*'([^']+)'/g)) {
  games.push({ division: +m[1], week: +m[2], a: m[3], b: m[4], date: m[5], time: m[6] });
}

// --- check each game ---
const blockedAt = (slug, slot) => playersForSlug(slug).filter(p => (blockedBy[p.auth_id] || new Set()).has(slot)).map(p => p.name);
const standinGames = [];
let clear = 0, missingData = [];
for (const g of games) {
  const slot = `${g.date} ${g.time}`;
  for (const slug of [g.a, g.b]) if (playersForSlug(slug).length === 0) missingData.push(`${DIV_LABEL[g.division]} ${slug}`);
  const out = [...blockedAt(g.a, slot).map(n => ({ n, team: slugToName[g.a] })), ...blockedAt(g.b, slot).map(n => ({ n, team: slugToName[g.b] }))];
  if (out.length) standinGames.push({ ...g, out }); else clear++;
}

const ORDER = [1, 2, 22, 23, 3];
console.log(`\n=== SCHEDULE CHECK: ${games.length} games | ${clear} full-roster | ${standinGames.length} need a standin ===`);
if (missingData.length) console.log(`⚠ no roster data for: ${[...new Set(missingData)].join(', ')}`);

console.log(`\n=== STANDIN LIST ===`);
for (const div of ORDER) {
  const ds = standinGames.filter(g => g.division === div).sort((x, y) => x.week - y.week);
  if (!ds.length) continue;
  console.log(`\n${DIV_LABEL[div]}`);
  for (const g of ds) {
    const wd = new Date(g.date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
    console.log(`  Wk${g.week}  ${slugToName[g.a]} vs ${slugToName[g.b]}  (${wd} ${g.time})`);
    for (const o of g.out) console.log(`        standin: ${o.n} (${o.team})`);
  }
}

// --- per-player availability health (days with >=1 free slot across 35-day window) ---
const WKDAY = ['18:00', '19:00', '20:00', '21:00'];
const WKEND = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const jsDay = (iso) => new Date(iso + 'T12:00:00').getDay();
const allDays = Array.from({ length: 35 }, (_, i) => addDays('2026-06-01', i));
console.log(`\n=== LOW-AVAILABILITY PLAYERS (free on < 12 of 35 league days) ===`);
const flagged = [];
for (const t of teamsRaw) {
  for (const p of (J(t.players) || []).map(J).filter(Boolean)) {
    const blk = blockedBy[p.auth_id]; if (!blk) { flagged.push({ name: p.name, team: t.name.trim(), days: 'NO SUBMISSION' }); continue; }
    let freeDays = 0;
    for (const date of allDays) { const slots = (jsDay(date) === 0 || jsDay(date) === 6) ? WKEND : WKDAY; if (slots.some(s => !blk.has(`${date} ${s}`))) freeDays++; }
    if (freeDays < 12) flagged.push({ name: p.name, team: t.name.trim(), days: `${freeDays}/35 days` });
  }
}
if (!flagged.length) console.log('  none — all players free on most days.');
for (const f of flagged.sort((a, b) => String(a.days).localeCompare(String(b.days)))) console.log(`  ${f.name.padEnd(18)} ${f.team.padEnd(28)} ${f.days}`);
console.log('');
