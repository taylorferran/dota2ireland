// Probe: for every matchup in a division input, count feasible full-roster slots per week.
import { readFileSync } from 'fs';
import { LEAGUE_START } from './leagueScheduler.mjs';

const input = JSON.parse(readFileSync(new URL(`../${process.argv[2] || 'division-22.json'}`, import.meta.url), 'utf8'));
const WEEKS = Number(process.argv[3] || 5);
const WKDAY = ['18:00', '19:00', '20:00', '21:00'];
const WKEND = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const jsDay = (iso) => new Date(iso + 'T12:00:00').getDay();
const slotsFor = (iso) => { const d = jsDay(iso); return (d === 0 || d === 6) ? WKEND : WKDAY; };

const avail = input.availability;
const blocked = (t) => { const s = new Set(); for (const p of t.players) for (const sl of (avail[p.authId] || [])) s.add(sl); return s; };
const blk = Object.fromEntries(input.teams.map(t => [t.id, blocked(t)]));
const name = Object.fromEntries(input.teams.map(t => [t.id, t.name]));
const ids = input.teams.map(t => t.id);

for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const A = blk[ids[i]], B = blk[ids[j]];
    const counts = [];
    for (let w = 0; w < WEEKS; w++) {
      let n = 0; const start = addDays(LEAGUE_START, 7 * w);
      for (let d = 0; d < 7; d++) { const date = addDays(start, d); for (const t of slotsFor(date)) { const k = `${date} ${t}`; if (!A.has(k) && !B.has(k)) n++; } }
      counts.push(n);
    }
    const flag = counts.some(c => c === 0) ? '  <-- has a 0-slot week' : '';
    console.log(`${name[ids[i]]} vs ${name[ids[j]]}`.padEnd(52), 'weeks:', counts.map(c => String(c).padStart(2)).join(' '), flag);
  }
}
