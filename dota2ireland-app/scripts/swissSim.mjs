// Monte Carlo simulation of a 15-team Swiss group, weekly Bo2 (captains mode),
// to estimate how many weeks are needed to cleanly SEED all teams for playoffs.
//
// Scoring modelled two ways:
//   match  = current league rule: Bo2 win (2-0) = 3, draw (1-1) = 1, loss = 0
//   game   = finer alternative:   1 point per game won (so a match is worth 0/1/2)
//
// A Bo2 between teams A and B is two independent games; per-game win prob uses an
// Elo curve. Swiss pairing: sort by points, pair nearest neighbours, avoid
// rematches, one bye per round (lowest team without a prior bye) scored as a 2-0 win.

const teamArg = process.argv.find((a) => /^--teams=\d+$/.test(a));
const TEAMS = teamArg ? parseInt(teamArg.split('=')[1], 10) : 15;
const SIMS = 20000;
const MAX_ROUNDS = TEAMS - 1; // full round robin upper bound

// ---- helpers ---------------------------------------------------------------

// Deterministic-ish PRNG (mulberry32) so runs are reproducible.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gameWinProb(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

// Spread of team strengths. Div2-ish: moderately competitive, real gaps top to
// bottom. std ~120 Elo => top team beats bottom team a single game ~75-80%.
function makeStrengths(rng) {
  const s = [];
  for (let i = 0; i < TEAMS; i++) {
    // Box-Muller normal
    const u1 = Math.max(rng(), 1e-9), u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    s.push(1500 + z * 120);
  }
  return s;
}

// Swiss pairing for one round. Returns {pairs:[[i,j]...], bye: index|null}
function pair(order, played, hadBye) {
  const remaining = [...order];
  let bye = null;
  if (remaining.length % 2 === 1) {
    // Bye to the lowest-ranked team that hasn't had one yet.
    for (let k = remaining.length - 1; k >= 0; k--) {
      if (!hadBye[remaining[k]]) { bye = remaining[k]; remaining.splice(k, 1); break; }
    }
    if (bye === null) { bye = remaining.pop(); } // everyone has had a bye
  }
  const pairs = [];
  const used = new Array(TEAMS).fill(false);
  for (let i = 0; i < remaining.length; i++) {
    const a = remaining[i];
    if (used[a]) continue;
    used[a] = true;
    // find nearest later team not yet used and not already played
    let partner = -1, fallback = -1;
    for (let j = i + 1; j < remaining.length; j++) {
      const b = remaining[j];
      if (used[b]) continue;
      if (fallback === -1) fallback = b;
      if (!played[a].has(b)) { partner = b; break; }
    }
    if (partner === -1) partner = fallback; // forced rematch (rare, late rounds)
    if (partner !== -1) { used[partner] = true; pairs.push([a, partner]); }
  }
  return { pairs, bye };
}

// Kendall tau-b style concordance between produced ranking and true strength.
function rankAgreement(finalOrder, strengths) {
  // true rank: higher strength = better. Compare all pairs.
  let concordant = 0, discordant = 0;
  for (let i = 0; i < finalOrder.length; i++) {
    for (let j = i + 1; j < finalOrder.length; j++) {
      const a = finalOrder[i], b = finalOrder[j]; // a is ranked above b
      if (strengths[a] > strengths[b]) concordant++;
      else if (strengths[a] < strengths[b]) discordant++;
    }
  }
  const total = concordant + discordant;
  return total ? (concordant - discordant) / total : 1;
}

// ---- simulation ------------------------------------------------------------

const SCORING = process.argv.includes('--game') ? 'game' : 'match';

// Per-round accumulators
const acc = Array.from({ length: MAX_ROUNDS + 1 }, () => ({
  distinct: 0,        // distinct point totals (max 15 = perfectly separated)
  maxTie: 0,          // largest group sharing a point total
  tiedTeams: 0,       // teams sitting in a tie of size >= 2
  cutTie: 0,          // teams ambiguous around an 8-team playoff cut (rank 8/9)
  tau: 0,             // ranking vs true strength agreement (1 = perfect)
  topClean: 0,        // fraction of sims with a unique #1
}));

for (let s = 0; s < SIMS; s++) {
  const rng = makeRng(s * 2654435761 + 12345);
  const strengths = makeStrengths(rng);

  const pts = new Array(TEAMS).fill(0);
  const gameWins = new Array(TEAMS).fill(0); // tiebreak proxy
  const played = Array.from({ length: TEAMS }, () => new Set());
  const hadBye = new Array(TEAMS).fill(false);

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // order: by points desc, then gameWins desc, then random jitter
    const order = [...Array(TEAMS).keys()].sort((a, b) => {
      if (pts[b] !== pts[a]) return pts[b] - pts[a];
      if (gameWins[b] !== gameWins[a]) return gameWins[b] - gameWins[a];
      return rng() - 0.5;
    });

    const { pairs, bye } = pair(order, played, hadBye);
    if (bye !== null) {
      hadBye[bye] = true;
      // bye = free 2-0 win
      if (SCORING === 'match') pts[bye] += 3; else pts[bye] += 2;
      gameWins[bye] += 2;
    }
    for (const [a, b] of pairs) {
      played[a].add(b); played[b].add(a);
      const p = gameWinProb(strengths[a], strengths[b]);
      let aw = 0;
      for (let g = 0; g < 2; g++) if (rng() < p) aw++;
      gameWins[a] += aw; gameWins[b] += (2 - aw);
      if (SCORING === 'match') {
        if (aw === 2) pts[a] += 3;
        else if (aw === 0) pts[b] += 3;
        else { pts[a] += 1; pts[b] += 1; }
      } else {
        pts[a] += aw; pts[b] += (2 - aw);
      }
    }

    // ---- measure seeding clarity after this round ----
    const counts = {};
    for (let t = 0; t < TEAMS; t++) counts[pts[t]] = (counts[pts[t]] || 0) + 1;
    const groups = Object.values(counts);
    const distinct = groups.length;
    const maxTie = Math.max(...groups);
    const tiedTeams = groups.filter((g) => g >= 2).reduce((x, y) => x + y, 0);

    // ranking with tiebreakers applied (points -> gameWins). Residual ties =
    // teams that even gameWins can't separate.
    const ranked = [...Array(TEAMS).keys()].sort((a, b) => {
      if (pts[b] !== pts[a]) return pts[b] - pts[a];
      return gameWins[b] - gameWins[a];
    });
    // cut ambiguity: are ranks 8 and 9 tied on (pts, gameWins)?
    const r8 = ranked[7], r9 = ranked[8];
    const cutTie = (pts[r8] === pts[r9] && gameWins[r8] === gameWins[r9]) ? 1 : 0;

    const top = ranked[0], second = ranked[1];
    const topClean = !(pts[top] === pts[second] && gameWins[top] === gameWins[second]) ? 1 : 0;

    const a = acc[round];
    a.distinct += distinct;
    a.maxTie += maxTie;
    a.tiedTeams += tiedTeams;
    a.cutTie += cutTie;
    a.tau += rankAgreement(ranked, strengths);
    a.topClean += topClean;
  }
}

// ---- report ----------------------------------------------------------------

console.log(`\nSwiss simulation: ${TEAMS} teams, weekly Bo2, ${SIMS.toLocaleString()} sims, scoring = ${SCORING.toUpperCase()}`);
console.log(`(distinct = avg # of distinct point totals out of ${TEAMS}; higher = better separated)`);
console.log(`(tiebreak = points, then total game wins)\n`);
console.log('Wk | distinct | largest tie | teams in a tie | unique #1 | 8/9 cut tied | rank vs skill');
console.log('---+----------+-------------+----------------+-----------+--------------+--------------');
for (let r = 1; r <= MAX_ROUNDS; r++) {
  const a = acc[r];
  const f = (x) => (x / SIMS);
  console.log(
    `${String(r).padStart(2)} |   ${f(a.distinct).toFixed(1).padStart(5)}  |    ${f(a.maxTie).toFixed(2).padStart(4)}     |     ${f(a.tiedTeams).toFixed(1).padStart(4)}       |   ${(f(a.topClean) * 100).toFixed(0).padStart(3)}%    |    ${(f(a.cutTie) * 100).toFixed(0).padStart(3)}%      |    ${f(a.tau).toFixed(3)}`
  );
}
console.log('');
