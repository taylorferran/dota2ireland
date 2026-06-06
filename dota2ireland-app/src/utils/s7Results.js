// Pure helpers that turn Imprint.gg league data into Season 7 match results.
//
// Imprint provides two things we combine here:
//   1. /league/{id}/matches  -> a list of `series` (each with two teams + game ids)
//   2. /match/{id}           -> a single game's detail, incl. which team has `win: true`
//
// Fixtures (who plays whom, when) live in `season7Schedule`; Imprint only knows the
// teams by Valve `team_id` / `team_name`. We map those onto our internal team keys by
// matching `team_name` against the season7TeamNames map, then attach scores + per-game
// detail to each scheduled fixture.
//
// These functions are framework-free so both the React app and the Node lock-in script
// (scripts/syncS7Results.mjs) can use them.

// Normalise a team name for matching: lowercase, drop punctuation (so "Mike's Army"
// matches "Mikes Army"), collapse whitespace. Exported so the standings/DB merge uses
// the exact same rule.
export const normTeamName = (s) =>
  (s ?? '')
    .toString()
    .toLowerCase()
    .replace(/['‘’]/g, '') // drop apostrophes so "Mike's Army" === "Mikes Army"
    .replace(/[^a-z0-9]+/g, ' ')     // other separators (_, -, .) become spaces: "Last_Hit_Academy" === "Last Hit Academy"
    .replace(/\s+/g, ' ')
    .trim();

const norm = normTeamName;

// Manual overrides for Valve team_ids that Imprint can't name correctly — e.g. a team
// played a game under the wrong / unregistered team set, so it comes through as
// "Unknown Team". Maps Valve team_id -> our internal team key. Checked before name matching.
const TEAM_ID_OVERRIDES = {
  10157436: 'random', // RANDOM played a game vs MMR Famine under the wrong team set
  9180502: 'wongwongbakery', // Imprint has them registered as "Wongs Bakery"
};

/** Map of normalised team display name -> internal team key (from season7TeamNames). */
export function buildNameToKey(teamNames) {
  const map = new Map();
  for (const [key, name] of Object.entries(teamNames)) {
    map.set(norm(name), key);
  }
  return map;
}

function keyForTeam(team, nameToKey) {
  if (team?.team_id != null && TEAM_ID_OVERRIDES[team.team_id]) return TEAM_ID_OVERRIDES[team.team_id];
  return nameToKey.get(norm(team?.team_name)) ?? null;
}

/**
 * Resolve a series' two teams to our internal team keys, in teams[] order.
 * Returns [keyA, keyB] or null if the series isn't a 2-team series we can map.
 */
export function resolveSeriesKeys(series, nameToKey) {
  const teams = Array.isArray(series?.teams) ? series.teams : [];
  if (teams.length !== 2) return null;
  const kA = keyForTeam(teams[0], nameToKey);
  const kB = keyForTeam(teams[1], nameToKey);
  return kA && kB ? [kA, kB] : null;
}

// S7 group stage is best-of-2. Imprint sometimes returns one series with 2 games and
// sometimes splits a Bo2 into two single-game series, so we can't trust one series = one
// fixture — we merge all games for a matchup and treat the first 2 as the Bo2.
const SERIES_LENGTH = 2;

// Build the per-game result object from a /match detail. `idToKey` maps Valve team_id -> key.
function buildGame(id, m, idToKey) {
  if (!m || !Array.isArray(m.teams)) {
    return { matchId: id, parsed: false, timestamp: null };
  }
  const gameTeams = m.teams.map((t) => ({
    teamId: t.team_id,
    name: t.team_name,
    win: !!t.win,
    kills: t.kills,
    players: (t.players || [])
      .map((p) => ({
        accountId: p.account_id,
        name: p.account_name,
        position: p.position,
        hero: p.hero?.name ?? null,
        heroIcon: p.hero?.icon_src ?? null,
        heroPortrait: p.hero?.static_portrait_src ?? null,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        rating: p.imprint_rating,
      }))
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
  }));
  const winnerTeam = gameTeams.find((t) => t.win);
  return {
    matchId: id,
    parsed: true,
    timestamp: m.timestamp ?? null,
    duration: m.duration ?? null,
    winnerId: winnerTeam ? winnerTeam.teamId : null,
    winnerKey: winnerTeam ? idToKey[winnerTeam.teamId] : null,
    winnerName: winnerTeam ? winnerTeam.name : null,
    teams: gameTeams,
  };
}

/**
 * Build a lookup of series results keyed by an order-independent team pair.
 *
 * Games are merged across every series that shares a matchup (Imprint may split a Bo2
 * into multiple single-game series), deduped by match id, ordered chronologically, and
 * the first SERIES_LENGTH used as the Bo2.
 *
 * @param {Array}  series      - the `series` array from /league/{id}/matches
 * @param {Map}    detailById  - Map<matchId, matchDetail> from /match/{id}
 * @param {Map}    nameToKey   - from buildNameToKey()
 * @returns {Map<string, object>} pairKey ("keyA|keyB" sorted) -> result
 */
export function indexSeries(series, detailById, nameToKey) {
  // 1) Bucket every mappable game by matchup, deduped by match id.
  const buckets = new Map(); // pairKey -> { keys:[kA,kB], games: Map<id, game> }
  for (const s of series) {
    // Skip series whose teams aren't in our league display (e.g. unmapped / wrong league)
    const keys = resolveSeriesKeys(s, nameToKey);
    if (!keys) continue;
    const [kA, kB] = keys;
    const teams = s.teams;
    const idToKey = { [teams[0].team_id]: kA, [teams[1].team_id]: kB };
    const pairKey = [kA, kB].sort().join('|');

    if (!buckets.has(pairKey)) buckets.set(pairKey, { keys: [kA, kB], games: new Map() });
    const bucket = buckets.get(pairKey);
    for (const id of s.matches || []) {
      if (!bucket.games.has(id)) bucket.games.set(id, buildGame(id, detailById.get(id), idToKey));
    }
  }

  // 2) Per matchup: order games by start time, cap at the Bo2 length, tally the score.
  const byPair = new Map();
  for (const [pairKey, bucket] of buckets) {
    const [kA, kB] = bucket.keys;
    const games = [...bucket.games.values()]
      .sort((a, b) => {
        if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? -1 : 1;
        return a.matchId - b.matchId;
      })
      .slice(0, SERIES_LENGTH)
      .map((g, i) => ({ ...g, game: i + 1 }));

    const winsByKey = { [kA]: 0, [kB]: 0 };
    for (const g of games) {
      if (g.parsed && g.winnerKey != null) winsByKey[g.winnerKey] += 1;
    }

    // Complete once we have the full Bo2 with a winner recorded for each game.
    const complete =
      games.length >= SERIES_LENGTH && games.every((g) => g.parsed && g.winnerKey != null);

    byPair.set(pairKey, { keys: [kA, kB], winsByKey, games, complete });
  }

  return byPair;
}

/**
 * Attach `completed` / `score` / `games` to scheduled fixtures that have a finished
 * series result. Fixtures without a complete result are returned unchanged.
 */
export function enrichSchedule(schedule, byPair) {
  return schedule.map((m) => {
    const r = byPair.get([m.team1Id, m.team2Id].sort().join('|'));
    if (!r || !r.complete) return m;
    return {
      ...m,
      completed: true,
      score: [r.winsByKey[m.team1Id] ?? 0, r.winsByKey[m.team2Id] ?? 0],
      games: r.games,
    };
  });
}

/**
 * Group an enriched schedule into the `divisionMatches` shape consumed by
 * calculateAllDivisionStandings (keyed by division id).
 */
export function toDivisionMatches(enrichedSchedule) {
  const out = {};
  for (const m of enrichedSchedule) {
    if (!out[m.division]) out[m.division] = [];
    out[m.division].push({
      id: m.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      week: m.week,
      completed: !!m.completed,
      score: m.score,
    });
  }
  return out;
}
