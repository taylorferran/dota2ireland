// CLI wrapper: read division JSON, run solveGroup, write + print schedule.
// usage: node scripts/runScheduler.mjs division-22.json [weekCount]
import { readFileSync, writeFileSync } from 'fs';
import { solveGroup } from './leagueScheduler.mjs';

const inPath = process.argv[2] || 'division-22.json';
const weekCount = Number(process.argv[3] || 7);

const input = JSON.parse(readFileSync(inPath, 'utf8'));
const nameById = Object.fromEntries(input.teams.map(t => [t.id, t.name]));

const result = solveGroup({ teams: input.teams, availability: input.availability, weekCount });

const outPath = inPath.replace(/\.json$/, '-schedule.json');
writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`\n=== DIV ${result.divisionId} SCHEDULE  (ok: ${result.ok}) ===`);
for (const wk of result.weeks) {
  const monday = new Date(wk.mondayOf + 'T12:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  console.log(`\nWeek ${wk.week}  (w/c Mon ${monday})${wk.byeTeamId ? `   BYE: ${nameById[wk.byeTeamId]}` : ''}`);
  for (const g of wk.games) {
    const d = new Date(g.date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
    const tight = g.optionsThisWeek <= 1 ? '  ⚠ TIGHT' : '';
    console.log(`   ${d}  ${g.start}-${g.end}   ${g.match}   (${g.optionsThisWeek} slot option${g.optionsThisWeek === 1 ? '' : 's'})${tight}`);
  }
}
if (result.conflicts.length) {
  console.log(`\n=== ⛔ CONFLICTS (${result.conflicts.length}) ===`);
  for (const c of result.conflicts) {
    console.log(`\n${c.match} — ${c.reason}`);
    for (const bp of c.blockingPlayers) console.log(`   ${bp.playerName} (${nameById[bp.teamId]}) blocked ${bp.slots.length} of the week's slots`);
  }
}
console.log(`\nWrote ${outPath}`);
