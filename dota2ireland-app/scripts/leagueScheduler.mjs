// Pure, deterministic group-stage scheduler (no I/O). See s7_availability_spec.md §4.
// solveGroup(input) -> ScheduleResult

export const LEAGUE_START = '2026-06-01';        // Monday
export const GAME_DURATION_MINUTES = 120;

const WEEKDAY_SLOTS = ['18:00', '19:00', '20:00', '21:00'];
const WEEKEND_SLOTS = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

// tie-break order when several slots are equally good (most-playable wins first)
const WEEKDAY_PREF = [2, 4, 1, 3, 5, 6, 0]; // Tue,Thu,Mon,Wed,Fri,Sat,Sun (JS getDay: 0=Sun)
const TIME_PREF = ['20:00', '19:00', '21:00', '18:00', '17:00', '16:00', '14:00', '12:00'];

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── date / slot helpers ──────────────────────────────────────────────────────
function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function jsDay(iso) { return new Date(iso + 'T12:00:00').getDay(); }
function slotsForDate(iso) { const d = jsDay(iso); return (d === 0 || d === 6) ? WEEKEND_SLOTS : WEEKDAY_SLOTS; }
function weekDates(weekIdx) {
  const start = addDays(LEAGUE_START, 7 * weekIdx);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
function endTime(start) {
  const [h, m] = start.split(':').map(Number);
  const t = h * 60 + m + GAME_DURATION_MINUTES;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

// ── round robin (circle method) ──────────────────────────────────────────────
function roundRobin(teamIds) {
  const arr = [...teamIds];
  if (arr.length % 2 !== 0) arr.push('BYE');
  const n = arr.length;
  let cur = [...arr];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const matches = [];
    let bye = null;
    for (let i = 0; i < n / 2; i++) {
      const a = cur[i], b = cur[n - 1 - i];
      if (a === 'BYE') bye = b;
      else if (b === 'BYE') bye = a;
      else matches.push([a, b]);
    }
    rounds.push({ matches, bye });
    cur = [cur[0], cur[n - 1], ...cur.slice(1, n - 1)]; // keep element 0 fixed, rotate rest
  }
  return rounds;
}

// ── team unavailability ──────────────────────────────────────────────────────
function teamBlocked(team, availMap) {
  const s = new Set();
  for (const p of team.players) for (const slot of (availMap[p.authId] || [])) s.add(slot);
  return s;
}

function feasibleSlots(blockedA, blockedB, weekIdx) {
  const out = [];
  for (const date of weekDates(weekIdx)) {
    for (const time of slotsForDate(date)) {
      const key = `${date} ${time}`;
      if (!blockedA.has(key) && !blockedB.has(key)) out.push({ date, time, key });
    }
  }
  return out;
}

// all permutations of [0..k-1]
function permutations(k) {
  const res = [];
  const a = Array.from({ length: k }, (_, i) => i);
  const c = new Array(k).fill(0);
  res.push([...a]);
  let i = 0;
  while (i < k) {
    if (c[i] < i) {
      const swap = i % 2 === 0 ? 0 : c[i];
      [a[swap], a[i]] = [a[i], a[swap]];
      res.push([...a]);
      c[i]++; i = 0;
    } else { c[i] = 0; i++; }
  }
  return res;
}

export function solveGroup({ teams, availability, weekCount }) {
  const teamIds = teams.map(t => t.id);
  const byId = Object.fromEntries(teams.map(t => [t.id, t]));
  const blockedByTeam = Object.fromEntries(teams.map(t => [t.id, teamBlocked(t, availability)]));

  const rounds = roundRobin(teamIds);
  const numRounds = rounds.length;

  // slack[r][w]  = sum over round r's matches of feasible-slot count in week w
  // zeros[r][w]  = number of round r's matches with NO feasible slot in week w (unplaceable)
  // feas[r][w]   = per-match feasible slot lists for round r in week w
  const slack = [];
  const zeros = [];
  const feas = [];
  for (let r = 0; r < numRounds; r++) {
    slack[r] = []; zeros[r] = []; feas[r] = [];
    for (let w = 0; w < weekCount; w++) {
      const perMatch = rounds[r].matches.map(([a, b]) =>
        feasibleSlots(blockedByTeam[a], blockedByTeam[b], w));
      feas[r][w] = perMatch;
      slack[r][w] = perMatch.reduce((s, list) => s + list.length, 0);
      zeros[r][w] = perMatch.filter(list => list.length === 0).length;
    }
  }

  // round -> week bijection. Objective, in priority order:
  //   1. MINIMISE unplaceable matches (weeks where a match has no slot for either roster)
  //   2. maximise the MINIMUM per-round slack (worst-case protection)
  //   3. maximise total slack
  //   4. first in deterministic order
  let best = null;
  for (const perm of permutations(Math.max(numRounds, weekCount))) {
    const assign = perm.slice(0, numRounds);
    if (new Set(assign).size !== numRounds) continue; // weeks must be distinct
    if (assign.some(w => w >= weekCount)) continue;
    let minSlack = Infinity, total = 0, unplaceable = 0;
    for (let r = 0; r < numRounds; r++) {
      const s = slack[r][assign[r]];
      minSlack = Math.min(minSlack, s);
      total += s;
      unplaceable += zeros[r][assign[r]];
    }
    if (!best
      || unplaceable < best.unplaceable
      || (unplaceable === best.unplaceable && minSlack > best.minSlack)
      || (unplaceable === best.unplaceable && minSlack === best.minSlack && total > best.total)) {
      best = { assign, minSlack, total, unplaceable };
    }
  }

  const roundToWeek = best.assign;                 // roundToWeek[r] = week index
  const weekToRound = {};
  roundToWeek.forEach((w, r) => { weekToRound[w] = r; });

  const weeks = [];
  const conflicts = [];

  for (let w = 0; w < weekCount; w++) {
    const r = weekToRound[w];
    const round = rounds[r];
    const games = [];

    const weekSlotKeys = [];
    for (const date of weekDates(w)) for (const time of slotsForDate(date)) weekSlotKeys.push({ date, time, key: `${date} ${time}` });

    // Each match picks from its OWN feasible (full-roster) slots, preferring:
    //   1. a day not already used by another match this week  (spread games out)
    //   2. weekday preference (Tue/Thu/Mon before the weekend) (favour weeknights)
    //   3. time preference
    // This adds day-of-week variance instead of stacking every game on one weekend slot,
    // without ever sacrificing a full-roster slot (we only reorder among feasible options).
    const usedDates = new Set();

    round.matches.forEach(([a, b], mi) => {
      const matchFeas = feas[r][w][mi];
      const optionsThisWeek = matchFeas.length;
      const pick = [...matchFeas].sort((x, y) => {
        const used = (usedDates.has(x.date) ? 1 : 0) - (usedDates.has(y.date) ? 1 : 0);
        if (used) return used;
        const wd = WEEKDAY_PREF.indexOf(jsDay(x.date)) - WEEKDAY_PREF.indexOf(jsDay(y.date));
        if (wd) return wd;
        return TIME_PREF.indexOf(x.time) - TIME_PREF.indexOf(y.time);
      })[0];

      if (!pick) {
        // unplaceable this week -> conflict; name blocking players (both teams)
        const weekKeys = new Set(weekSlotKeys.map(s => s.key));
        const blockingPlayers = [];
        for (const teamId of [a, b]) {
          for (const p of byId[teamId].players) {
            const hit = (availability[p.authId] || []).filter(s => weekKeys.has(s));
            if (hit.length) blockingPlayers.push({ authId: p.authId, playerName: p.name, teamId, slots: hit });
          }
        }
        conflicts.push({
          match: `${byId[a].name} vs ${byId[b].name}`,
          teamAId: a, teamBId: b,
          reason: `No slot in week ${w + 1} works for both rosters`,
          blockingPlayers,
        });
        return;
      }

      usedDates.add(pick.date);
      games.push({
        match: `${byId[a].name} vs ${byId[b].name}`,
        teamAId: a, teamBId: b,
        date: pick.date,
        weekday: WEEKDAY_NAMES[jsDay(pick.date)],
        start: pick.time,
        end: endTime(pick.time),
        optionsThisWeek,
      });
    });

    weeks.push({
      week: w + 1,
      mondayOf: addDays(LEAGUE_START, 7 * w),
      games,
      byeTeamId: round.bye && round.bye !== 'BYE' ? round.bye : null,
    });
  }

  return {
    divisionId: teams[0]?.divisionId ?? null,
    ok: conflicts.length === 0,
    weeks,
    conflicts,
  };
}
