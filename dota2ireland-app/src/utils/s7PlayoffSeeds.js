// Derive current Season 7 playoff seeds from live group standings.
// Kept separate from the bracket component so both League.jsx and the component can use it
// without tripping react-refresh's "only export components" rule.
import { season7TeamNames } from '../data/season7Teams.js';

const nameOf = (id) => season7TeamNames[id] || id;
const cmp = (a, b) => b.points - a.points || b.wins - a.wins || b.draws - a.draws || a.losses - b.losses;

// Locked-in playoff seeds, set once a division's group stage is final. When present these
// override the live-standings derivation for that division. Seed number -> internal team key.
const S7_LOCKED_SEEDS = {
  // Division 1 — final seeding confirmed after group stage.
  1: { 1: 'full_english_breakfast', 2: 'business_mices', 3: 'wongwongbakery' },
  // Division 2 — locked from final group standings via the cross-group draw (see
  // deriveDiv2Draw). Group winners Imprint / Random / Mikes Army seed 1-3; Imprint byes.
  2: {
    1: 'imprint_esports', 2: 'random', 3: 'mikes_army', 4: 'fost_team',
    5: 'five_stuns_no_brains', 6: 'joonsquad_next', 7: 'veleno', 8: 'secretshop',
    9: 'mmr_famine', 10: 'd2ire_rejects', 11: 'owen_morris_cummers', 12: 'the_chumps_people',
    13: 'cavan_creche', 14: 'the_dark_side', 15: 'missprint_esports',
  },
  // Division 3 — final group standings: Wreck 7, Grumpy 5, Team Sosal 4, Bord na Mona 0.
  3: { 1: 'wreck_the_herald', 2: 'grumpy_old_men', 3: 'team_sosal', 4: 'bord_na_mona' },
};

/**
 * Turn standings (keyed by division id) into a { seedNumber: teamName } map for a
 * playoff division. Division 2 combines groups 2 / 22 / 23.
 */
export function deriveS7Seeds(division, standings) {
  if (S7_LOCKED_SEEDS[division]) {
    const s = {};
    Object.entries(S7_LOCKED_SEEDS[division]).forEach(([n, key]) => { s[n] = nameOf(key); });
    return s;
  }
  if (!standings) return {};

  if (division === 1) {
    // Only the three teams that did not disband contest the Division 1 playoff.
    const remain = ['full_english_breakfast', 'business_mices', 'wongwongbakery'];
    const ranked = (standings[1] || []).filter((t) => remain.includes(t.id)).sort(cmp);
    const ids = [...ranked.map((t) => t.id), ...remain.filter((id) => !ranked.some((t) => t.id === id))];
    return { 1: nameOf(ids[0]), 2: nameOf(ids[1]), 3: nameOf(ids[2]) };
  }

  if (division === 3) {
    const s = {};
    [...(standings[3] || [])].sort(cmp).slice(0, 4).forEach((t, i) => { s[i + 1] = t.name; });
    return s;
  }

  if (division === 2) {
    return deriveDiv2Draw(standings);
  }

  return {};
}

// ── Division 2 draw ─────────────────────────────────────────────────────────
// 15 teams from three groups (2A / 2B / 2C) into one single-elimination bracket.
// Ranking is by group placement, then record (points -> wins -> ...). On top of that
// we arrange the seeds so opponents come from different groups as much as possible:
// every Round-of-16 match cross-group where achievable, and each quarter of the bracket
// spread across groups. The overall top team byes the Round of 16.
//
// The bracket's fixed seed pairings (must match S7PlayoffBracket's Division 2 data):
const DIV2_R1 = [[8, 9], [5, 12], [4, 13], [3, 14], [6, 11], [7, 10], [2, 15]]; // seed 1 byes
const DIV2_QUARTERS = [[1, 8, 9], [4, 5, 12, 13], [3, 6, 11, 14], [2, 7, 10, 15]];

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    permutations(rest).forEach((p) => out.push([x, ...p]));
  });
  return out;
}

function deriveDiv2Draw(standings) {
  const groups = [2, 22, 23].map((g) => [...(standings[g] || [])].sort(cmp));
  // Placement tiers: tier i holds the i-th-placed team from each group (winners, then
  // runners-up, ...). Each carries its group index so we can keep groups apart.
  const tiers = [];
  for (let i = 0; i < 5; i += 1) {
    const t = [];
    groups.forEach((g, gi) => { if (g[i]) t.push({ name: g[i].name, group: gi, stat: g[i] }); });
    t.sort((a, b) => cmp(a.stat, b.stat));
    tiers.push(t);
  }
  const overallBest = tiers[0][0]?.name ?? null;

  // Each tier occupies a fixed block of seed numbers: tier 0 -> seeds 1-3, tier 1 -> 4-6, ...
  // We try every assignment of a tier's teams to its three seed slots and pick the one that
  // minimises same-group collisions in the bracket.
  const tierCandidates = tiers.map((teams, i) => {
    const slots = [3 * i + 1, 3 * i + 2, 3 * i + 3];
    const padded = [...teams, null, null, null].slice(0, 3);
    return permutations(padded).map((p) => {
      const m = {};
      slots.forEach((s, k) => { m[s] = p[k]; });
      return m;
    });
  });

  const penalty = (seedTeam) => {
    let p = 0;
    // Round-of-16 same-group matchup is the worst outcome.
    DIV2_R1.forEach(([a, b]) => {
      const ga = seedTeam[a]?.group, gb = seedTeam[b]?.group;
      if (ga != null && gb != null && ga === gb) p += 100;
    });
    // The overall best team should keep the bye.
    if (overallBest && seedTeam[1]?.name !== overallBest) p += 50;
    // Spread groups across each quarter so quarterfinals stay cross-group too.
    DIV2_QUARTERS.forEach((q) => {
      for (let x = 0; x < q.length; x += 1) {
        for (let y = x + 1; y < q.length; y += 1) {
          const gx = seedTeam[q[x]]?.group, gy = seedTeam[q[y]]?.group;
          if (gx != null && gy != null && gx === gy) p += 10;
        }
      }
    });
    return p;
  };

  let best = null;
  let bestPen = Infinity;
  const search = (i, acc) => {
    if (i === tierCandidates.length) {
      const seedTeam = Object.assign({}, ...acc);
      const p = penalty(seedTeam);
      if (p < bestPen) { bestPen = p; best = seedTeam; } // strict < keeps points order on ties
      return;
    }
    tierCandidates[i].forEach((cand) => search(i + 1, [...acc, cand]));
  };
  search(0, []);

  const out = {};
  if (best) {
    for (let s = 1; s <= 15; s += 1) if (best[s]) out[s] = best[s].name;
  }
  return out;
}
