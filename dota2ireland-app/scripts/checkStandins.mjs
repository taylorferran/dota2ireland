// For the final Div2B schedule, list any player blocked at their match's exact slot
// (i.e. who needs a standin). Cross-references division-22.json availability.
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync(new URL('../division-22.json', import.meta.url), 'utf8'));
const avail = input.availability;
const team = (id) => input.teams.find(t => t.id === id);

// Final published schedule (matches src/data/matchScheduleSeason7.ts Div2B block)
const SCHED = [
  ['w1', 'the_dark_side', 'fost_team', '2026-06-06 20:00'],
  ['w1', 'mmr_famine', 'random', '2026-06-02 19:00'],
  ['w2', 'the_dark_side', 'random', '2026-06-13 20:00'],
  ['w2', 'fost_team', 'the_chumps_people', '2026-06-13 20:00'],
  ['w3', 'the_dark_side', 'mmr_famine', '2026-06-15 19:00'],
  ['w3', 'the_chumps_people', 'random', '2026-06-15 20:00'],
  ['w4', 'the_dark_side', 'the_chumps_people', '2026-06-26 20:00'],
  ['w4', 'fost_team', 'mmr_famine', '2026-06-27 20:00'],
  ['w5', 'the_chumps_people', 'mmr_famine', '2026-07-04 20:00'],
  ['w5', 'random', 'fost_team', '2026-07-05 20:00'],
];

const blockedPlayers = (id, slot) => team(id).players.filter(p => (avail[p.authId] || []).includes(slot));

let any = false;
for (const [wk, a, b, slot] of SCHED) {
  const out = [...blockedPlayers(a, slot).map(p => `${p.name} (${team(a).name})`),
               ...blockedPlayers(b, slot).map(p => `${p.name} (${team(b).name})`)];
  const label = `${wk}  ${team(a).name} vs ${team(b).name}  @ ${slot}`;
  if (out.length) { any = true; console.log(`STANDIN  ${label}\n         -> ${out.join(', ')}`); }
  else console.log(`ok       ${label}`);
}
if (!any) console.log('\nNo standins required.');
