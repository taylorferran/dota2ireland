// For a single matchup in a given week, rank slots by combined roster availability
// (to choose the least-bad slot for a match that needs a standin).
// usage: node scripts/bestSlotForMatch.mjs <input.json> <teamIdA> <teamIdB> <weekIndex0based>
import { readFileSync } from 'fs';
import { LEAGUE_START } from './leagueScheduler.mjs';

const input = JSON.parse(readFileSync(new URL(`../${process.argv[2]}`, import.meta.url), 'utf8'));
const [, , , idA, idB, wArg] = process.argv;
const week = Number(wArg);
const WKDAY = ['18:00', '19:00', '20:00', '21:00'];
const WKEND = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const jsDay = (iso) => new Date(iso + 'T12:00:00').getDay();
const slotsFor = (iso) => { const d = jsDay(iso); return (d === 0 || d === 6) ? WKEND : WKDAY; };

const avail = input.availability;
const team = (id) => input.teams.find(t => t.id === id);
const A = team(idA), B = team(idB);
const freeAt = (t, key) => t.players.filter(p => !(avail[p.authId] || []).includes(key));

const rows = [];
const start = addDays(LEAGUE_START, 7 * week);
for (let d = 0; d < 7; d++) {
  const date = addDays(start, d);
  for (const time of slotsFor(date)) {
    const key = `${date} ${time}`;
    const fa = freeAt(A, key), fb = freeAt(B, key);
    rows.push({ date, time, day: NAMES[jsDay(date)], a: fa.length, b: fb.length, missA: A.players.filter(p => !fa.includes(p)).map(p => p.name), missB: B.players.filter(p => !fb.includes(p)).map(p => p.name) });
  }
}
rows.sort((x, y) => (y.a + y.b) - (x.a + x.b));
console.log(`Best slots for ${A.name} vs ${B.name}, week ${week + 1} (higher = fewer standins):\n`);
for (const r of rows.slice(0, 8)) {
  console.log(`${r.day} ${r.date} ${r.time}  ${A.name}: ${r.a}/5${r.missA.length ? ' (out: ' + r.missA.join(', ') + ')' : ''}  |  ${B.name}: ${r.b}/5${r.missB.length ? ' (out: ' + r.missB.join(', ') + ')' : ''}`);
}
