// Flexible single round-robin scheduler: spread N*(N-1)/2 matches over MORE weeks
// than rounds, to keep games at full roster. Each team plays <= 1 match per week.
// Objective (in order): minimise standins (matches with no full-roster slot in their
// week) -> front-load into early weeks -> fewer total weeks used.
// usage: node scripts/spreadScheduler.mjs division-3.json [weekCount]
import { readFileSync, writeFileSync } from 'fs';
import { LEAGUE_START } from './leagueScheduler.mjs';

const inPath = process.argv[2] || 'division-3.json';
const weekCount = Number(process.argv[3] || 5);
const input = JSON.parse(readFileSync(new URL(`../${inPath}`, import.meta.url), 'utf8'));

// Optional pins: --pin=teamA,teamB,week (1-based). Forces a match into a given week.
// Useful when a team is already running a standin that week, so an unwinnable match
// is "free" to schedule there.
const pins = process.argv.filter(a => a.startsWith('--pin=')).map(a => {
  const [a1, b1, wk] = a.slice('--pin='.length).split(',');
  return { pair: [a1, b1].sort(), week: Number(wk) - 1 };
});
const pinFor = ([a, b]) => { const key = [a, b].sort().join('|'); return pins.find(p => p.pair.join('|') === key)?.week; };

const WKDAY = ['18:00', '19:00', '20:00', '21:00'];
const WKEND = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const WEEKDAY_PREF = [2, 4, 1, 3, 5, 6, 0];
const TIME_PREF = ['20:00', '19:00', '21:00', '18:00', '17:00', '16:00', '14:00', '12:00'];
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const jsDay = (iso) => new Date(iso + 'T12:00:00').getDay();
const slotsFor = (iso) => { const d = jsDay(iso); return (d === 0 || d === 6) ? WKEND : WKDAY; };
const endTime = (s) => { const [h, m] = s.split(':').map(Number); const t = h * 60 + m + 120; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

const avail = input.availability;
const byId = Object.fromEntries(input.teams.map(t => [t.id, t]));
const teamBlocked = (t) => { const s = new Set(); for (const p of t.players) for (const sl of (avail[p.authId] || [])) s.add(sl); return s; };
const blk = Object.fromEntries(input.teams.map(t => [t.id, teamBlocked(t)]));

// all single round-robin matchups
const ids = input.teams.map(t => t.id);
const matches = [];
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) matches.push([ids[i], ids[j]]);

const weekSlots = (w) => { const out = []; for (let d = 0; d < 7; d++) { const date = addDays(LEAGUE_START, 7 * w + d); for (const t of slotsFor(date)) out.push({ date, time: t, key: `${date} ${t}` }); } return out; };

// per match, per week: full-roster feasible slots
const feas = matches.map(([a, b]) =>
  Array.from({ length: weekCount }, (_, w) =>
    weekSlots(w).filter(s => !blk[a].has(s.key) && !blk[b].has(s.key))));

// search all week assignments (weekCount^matches is tiny here), enforce <=1 game/team/week
let best = null;
const M = matches.length;
const rec = (mi, weekOf, teamWeek) => {
  if (mi === M) {
    let standins = 0, weekSum = 0, maxWk = 0;
    for (let k = 0; k < M; k++) { if (feas[k][weekOf[k]].length === 0) standins++; weekSum += weekOf[k]; maxWk = Math.max(maxWk, weekOf[k]); }
    const cand = { weekOf: [...weekOf], standins, weekSum, maxWk };
    if (!best || cand.standins < best.standins
      || (cand.standins === best.standins && cand.weekSum < best.weekSum)
      || (cand.standins === best.standins && cand.weekSum === best.weekSum && cand.maxWk < best.maxWk)) best = cand;
    return;
  }
  const [a, b] = matches[mi];
  const pinned = pinFor(matches[mi]);
  for (let w = 0; w < weekCount; w++) {
    if (pinned !== undefined && w !== pinned) continue; // honour pin
    if (teamWeek.get(a + ':' + w) || teamWeek.get(b + ':' + w)) continue; // team already plays this week
    teamWeek.set(a + ':' + w, 1); teamWeek.set(b + ':' + w, 1);
    weekOf[mi] = w;
    rec(mi + 1, weekOf, teamWeek);
    teamWeek.delete(a + ':' + w); teamWeek.delete(b + ':' + w);
  }
};
rec(0, new Array(M), new Map());

// render: assign slots week-by-week with day variance; standin matches pick least-bad slot
const games = [];
for (let w = 0; w < weekCount; w++) {
  const used = new Set();
  matches.forEach(([a, b], mi) => {
    if (best.weekOf[mi] !== w) return;
    const options = feas[mi][w];
    let pick, standinOut = [];
    if (options.length) {
      pick = [...options].sort((x, y) => {
        const u = (used.has(x.date) ? 1 : 0) - (used.has(y.date) ? 1 : 0); if (u) return u;
        const wd = WEEKDAY_PREF.indexOf(jsDay(x.date)) - WEEKDAY_PREF.indexOf(jsDay(y.date)); if (wd) return wd;
        return TIME_PREF.indexOf(x.time) - TIME_PREF.indexOf(y.time);
      })[0];
    } else {
      // standin: choose slot in this week with the most players available across both teams
      const free = (id, key) => byId[id].players.filter(p => !(avail[p.authId] || []).includes(key));
      pick = [...weekSlots(w)].map(s => ({ s, n: free(a, s.key).length + free(b, s.key).length }))
        .sort((x, y) => y.n - x.n || TIME_PREF.indexOf(x.s.time) - TIME_PREF.indexOf(y.s.time))[0].s;
      standinOut = [...byId[a].players.filter(p => (avail[p.authId] || []).includes(pick.key)).map(p => `${p.name} (${byId[a].name})`),
                    ...byId[b].players.filter(p => (avail[p.authId] || []).includes(pick.key)).map(p => `${p.name} (${byId[b].name})`)];
    }
    used.add(pick.date);
    games.push({ week: w + 1, a, b, date: pick.date, weekday: DOW[jsDay(pick.date)], time: pick.time, end: endTime(pick.time), standin: options.length === 0, standinOut });
  });
}

games.sort((x, y) => x.week - y.week || x.date.localeCompare(y.date) || x.time.localeCompare(y.time));
console.log(`\n=== ${inPath} — single round robin over ${weekCount} weeks (standins: ${best.standins}) ===\n`);
let cur = 0;
for (const g of games) {
  if (g.week !== cur) { cur = g.week; const mon = new Date(addDays(LEAGUE_START, 7 * (cur - 1)) + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' }); console.log(`Week ${cur}  (w/c Mon ${mon})`); }
  const d = new Date(g.date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
  console.log(`   ${d}  ${g.time}-${g.end}   ${byId[g.a].name} vs ${byId[g.b].name}${g.standin ? `   ⚠ STANDIN: ${g.standinOut.join(', ')}` : ''}`);
}
writeFileSync(new URL(`../${inPath.replace(/\.json$/, '-spread.json')}`, import.meta.url).pathname, JSON.stringify(games, null, 2));
console.log('');
