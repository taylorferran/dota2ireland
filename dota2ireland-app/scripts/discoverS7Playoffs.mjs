// Discover Season 7 playoff progress from Imprint for all divisions. Resolves each bracket
// (single + double elim) round by round, reporting decided results (paste-ready for
// s7PlayoffResults.js) and pending matches. Playoff series are Bo3 (Grand Finals Bo5), so
// games are counted per pair with no cap.
//
//   node scripts/discoverS7Playoffs.mjs
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildNameToKey, resolveSeriesKeys } from '../src/utils/s7Results.js';
import { season7TeamNames } from '../src/data/season7Teams.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
  .find((l) => l.startsWith('VITE_IMPRINT_API_TOKEN=')).split('=')[1].trim().replace(/^["']|["']$/g, '');
const get = async (p) => { const r = await fetch(`https://v2.api.imprint.gg${p}`, { headers: { 'x-api-key': TOKEN } }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };
const mapLimit = async (items, n, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; };
const nm = (k) => season7TeamNames[k] || k;

const SEEDS = {
  1: { 1: 'full_english_breakfast', 2: 'business_mices', 3: 'wongwongbakery' },
  2: { 1: 'imprint_esports', 2: 'random', 3: 'mikes_army', 4: 'fost_team', 5: 'five_stuns_no_brains', 6: 'joonsquad_next', 7: 'veleno', 8: 'secretshop', 9: 'mmr_famine', 10: 'd2ire_rejects', 11: 'owen_morris_cummers', 12: 'the_chumps_people', 13: 'cavan_creche', 14: 'the_dark_side', 15: 'missprint_esports' },
  3: { 1: 'wreck_the_herald', 2: 'grumpy_old_men', 3: 'team_sosal', 4: 'bord_na_mona' },
};
// Bracket match specs: participants are a fixed seed or the winner/loser of another match.
const S = (seed) => ({ seed });
const W = (from) => ({ from, take: 'winner' });
const L = (from) => ({ from, take: 'loser' });
const BRACKETS = {
  1: { ws: { bo: 'Bo3', p: [S(2), S(3)], label: 'Winners Semi' }, wf: { bo: 'Bo3', p: [S(1), W('ws')], label: 'Winners Final' }, lf: { bo: 'Bo3', p: [L('ws'), L('wf')], label: 'Losers Final' }, gf: { bo: 'Bo5', p: [W('wf'), W('lf')], label: 'Grand Final' } },
  3: { sf1: { bo: 'Bo3', p: [S(1), S(4)], label: 'Winners SF1' }, sf2: { bo: 'Bo3', p: [S(2), S(3)], label: 'Winners SF2' }, wf: { bo: 'Bo3', p: [W('sf1'), W('sf2')], label: 'Winners Final' }, lr1: { bo: 'Bo3', p: [L('sf1'), L('sf2')], label: 'Lower R1' }, lf: { bo: 'Bo3', p: [W('lr1'), L('wf')], label: 'Lower Final' }, gf: { bo: 'Bo5', p: [W('wf'), W('lf')], label: 'Grand Final' } },
  2: { r1m2: { bo: 'Bo3', p: [S(8), S(9)], label: 'Ro16' }, r1m3: { bo: 'Bo3', p: [S(5), S(12)], label: 'Ro16' }, r1m4: { bo: 'Bo3', p: [S(4), S(13)], label: 'Ro16' }, r1m5: { bo: 'Bo3', p: [S(3), S(14)], label: 'Ro16' }, r1m6: { bo: 'Bo3', p: [S(6), S(11)], label: 'Ro16' }, r1m7: { bo: 'Bo3', p: [S(7), S(10)], label: 'Ro16' }, r1m8: { bo: 'Bo3', p: [S(2), S(15)], label: 'Ro16' }, qf1: { bo: 'Bo3', p: [S(1), W('r1m2')], label: 'QF1' }, qf2: { bo: 'Bo3', p: [W('r1m3'), W('r1m4')], label: 'QF2' }, qf3: { bo: 'Bo3', p: [W('r1m5'), W('r1m6')], label: 'QF3' }, qf4: { bo: 'Bo3', p: [W('r1m7'), W('r1m8')], label: 'QF4' }, sf1: { bo: 'Bo3', p: [W('qf1'), W('qf2')], label: 'SF1' }, sf2: { bo: 'Bo3', p: [W('qf3'), W('qf4')], label: 'SF2' }, final: { bo: 'Bo5', p: [W('sf1'), W('sf2')], label: 'Final' } },
};

// Build wins + game ids per team-key pair across all Imprint series (no cap).
const nameToKey = buildNameToKey(season7TeamNames);
const list = await get('/league/19763/matches');
const ids = [...new Set((list.series || []).flatMap((s) => s.matches || []))];
const details = await mapLimit(ids, 4, (id) => get(`/match/${id}`).catch(() => null));
const detailById = new Map(ids.map((id, i) => [id, details[i]]));
const pair = new Map();
for (const s of list.series || []) {
  const keys = resolveSeriesKeys(s, nameToKey); if (!keys) continue;
  const [kA, kB] = keys; const idToKey = { [s.teams[0].team_id]: kA, [s.teams[1].team_id]: kB };
  const pk = [kA, kB].sort().join('|'); if (!pair.has(pk)) pair.set(pk, { wins: {}, games: [] });
  const bk = pair.get(pk);
  for (const id of s.matches || []) { const m = detailById.get(id); const wt = m?.teams?.find((t) => t.win); const wk = wt ? idToKey[wt.team_id] : null; if (wk) bk.wins[wk] = (bk.wins[wk] || 0) + 1; bk.games.push({ id, ts: m?.timestamp || '' }); }
}

// Division 2 only: its playoff pairings are cross-group, so pair-based aggregation is
// unambiguous. Div 1 and Div 3 reuse the same teams in group + playoffs, so their results
// are recorded by hand in s7PlayoffResults.js (using the playoff game ids only).
for (const div of [2]) {
  const seeds = SEEDS[div]; const matches = BRACKETS[div]; const cache = {};
  const resolve = (key) => {
    if (cache[key]) return cache[key];
    const m = matches[key];
    const parts = m.p.map((spec) => { if (spec.seed != null) return spec.seed; const fr = resolve(spec.from); return fr.decided ? (spec.take === 'winner' ? fr.winnerSeed : fr.loserSeed) : null; });
    const [sA, sB] = parts;
    let r;
    if (sA == null || sB == null) { r = { decided: false, known: false }; }
    else {
      const kA = seeds[sA], kB = seeds[sB]; const b = pair.get([kA, kB].sort().join('|'));
      const need = m.bo === 'Bo5' ? 3 : 2; const wA = b?.wins[kA] || 0, wB = b?.wins[kB] || 0;
      const decided = Math.max(wA, wB) >= need;
      const matchIds = b ? [...b.games].sort((x, y) => (x.ts < y.ts ? -1 : x.ts > y.ts ? 1 : x.id - y.id)).map((g) => g.id) : [];
      r = { decided, known: true, sA, sB, wA, wB, winnerSeed: wA >= wB ? sA : sB, loserSeed: wA >= wB ? sB : sA, score: `${Math.max(wA, wB)}-${Math.min(wA, wB)}`, matchIds, played: (b?.games.length || 0) > 0 };
    }
    cache[key] = r; return r;
  };
  console.log(`\n========== DIVISION ${div === 2 ? '2' : div} ==========`);
  const pending = [];
  for (const key of Object.keys(matches)) {
    const r = resolve(key); const m = matches[key];
    if (r.decided) {
      console.log(`  [DONE] ${key} (${m.label}): ${nm(seeds[r.winnerSeed])} ${r.score} ${nm(seeds[r.loserSeed])}`);
    } else if (r.known) {
      const status = r.played ? `in progress ${r.wA}-${r.wB}` : 'not played';
      console.log(`  [PENDING] ${key} (${m.label}, ${m.bo}): ${nm(seeds[r.sA])} vs ${nm(seeds[r.sB])} — ${status}`);
      pending.push(`Div ${div} ${m.label}: ${nm(seeds[r.sA])} vs ${nm(seeds[r.sB])} (${m.bo})${r.played ? ` [in progress ${r.wA}-${r.wB}]` : ''}`);
    } else {
      console.log(`  [WAITING] ${key} (${m.label}): teams TBD (awaiting earlier rounds)`);
    }
  }
  // paste-ready decided entries
  const decided = Object.keys(matches).filter((k) => resolve(k).decided);
  if (decided.length) {
    console.log(`  --- paste for s7PlayoffResults.js div ${div} ---`);
    for (const key of decided) { const r = resolve(key); console.log(`    ${key}: { winnerSeed: ${r.winnerSeed}, score: '${r.score}', matchIds: [${r.matchIds.join(', ')}] }, // ${nm(seeds[r.winnerSeed])}`); }
  }
}
