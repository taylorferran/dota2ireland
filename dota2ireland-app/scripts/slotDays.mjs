// For each scheduled match, show its feasible full-roster slots split by weeknight vs weekend.
import { readFileSync } from 'fs';
import { LEAGUE_START } from './leagueScheduler.mjs';

const input = JSON.parse(readFileSync(new URL('../division-22.json', import.meta.url), 'utf8'));
const avail = input.availability;
const team = (id) => input.teams.find(t => t.id === id);
const WKDAY = ['18:00', '19:00', '20:00', '21:00'];
const WKEND = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const jsDay = (iso) => new Date(iso + 'T12:00:00').getDay();
const slotsFor = (iso) => { const d = jsDay(iso); return (d === 0 || d === 6) ? WKEND : WKDAY; };
const blocked = (t) => { const s = new Set(); for (const p of t.players) for (const sl of (avail[p.authId] || [])) s.add(sl); return s; };

// [week(0-based), teamA, teamB]
const MATCHES = [
  [0, 'the_dark_side', 'fost_team'], [0, 'mmr_famine', 'random'],
  [1, 'the_dark_side', 'random'], [1, 'fost_team', 'the_chumps_people'],
  [2, 'the_dark_side', 'mmr_famine'], [2, 'the_chumps_people', 'random'],
  [3, 'the_dark_side', 'the_chumps_people'], [3, 'fost_team', 'mmr_famine'],
  [4, 'the_chumps_people', 'mmr_famine'], [4, 'random', 'fost_team'],
];

for (const [w, a, b] of MATCHES) {
  const A = blocked(team(a)), B = blocked(team(b));
  const wknight = [], wkend = [];
  const start = addDays(LEAGUE_START, 7 * w);
  for (let d = 0; d < 7; d++) {
    const date = addDays(start, d), day = jsDay(date);
    for (const t of slotsFor(date)) {
      const k = `${date} ${t}`;
      if (!A.has(k) && !B.has(k)) (day === 0 || day === 6 ? wkend : wknight).push(`${DOW[day]} ${t}`);
    }
  }
  console.log(`wk${w + 1}  ${team(a).name} vs ${team(b).name}`);
  console.log(`     weeknight (${wknight.length}): ${wknight.slice(0, 8).join(', ') || '—'}`);
  console.log(`     weekend   (${wkend.length}): ${wkend.slice(0, 8).join(', ') || '—'}`);
}
