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

const norm = (s) => (s ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

/** Map of normalised team display name -> internal team key (from season7TeamNames). */
export function buildNameToKey(teamNames) {
  const map = new Map();
  for (const [key, name] of Object.entries(teamNames)) {
    map.set(norm(name), key);
  }
  return map;
}

function keyForTeam(team, nameToKey) {
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

/**
 * Build a lookup of completed series keyed by an order-independent team pair.
 *
 * @param {Array}  series      - the `series` array from /league/{id}/matches
 * @param {Map}    detailById  - Map<matchId, matchDetail> from /match/{id}
 * @param {Map}    nameToKey   - from buildNameToKey()
 * @returns {Map<string, object>} pairKey ("keyA|keyB" sorted) -> result
 */
export function indexSeries(series, detailById, nameToKey) {
  const byPair = new Map();

  for (const s of series) {
    // Skip series whose teams aren't in our league display (e.g. unmapped / wrong league)
    const keys = resolveSeriesKeys(s, nameToKey);
    if (!keys) continue;
    const [kA, kB] = keys;
    const teams = s.teams;

    const idToKey = { [teams[0].team_id]: kA, [teams[1].team_id]: kB };

    // The /league/{id}/matches `matches` array isn't ordered chronologically, so sort
    // by each game's start time (match ids are also chronological as a fallback).
    const orderedIds = [...(s.matches || [])].sort((a, b) => {
      const ta = detailById.get(a)?.timestamp;
      const tb = detailById.get(b)?.timestamp;
      if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
      return a - b;
    });

    const games = orderedIds.map((id, idx) => {
      const m = detailById.get(id);
      if (!m || !Array.isArray(m.teams)) {
        return { game: idx + 1, matchId: id, parsed: false };
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
        game: idx + 1,
        matchId: id,
        parsed: true,
        duration: m.duration ?? null,
        winnerId: winnerTeam ? winnerTeam.teamId : null,
        winnerKey: winnerTeam ? idToKey[winnerTeam.teamId] : null,
        winnerName: winnerTeam ? winnerTeam.name : null,
        teams: gameTeams,
      };
    });

    const winsByKey = { [kA]: 0, [kB]: 0 };
    for (const g of games) {
      if (g.parsed && g.winnerKey != null) winsByKey[g.winnerKey] += 1;
    }

    const expected = s.match_count || games.length;
    const complete =
      games.length > 0 &&
      games.length >= expected &&
      games.every((g) => g.parsed && g.winnerKey != null);

    byPair.set([kA, kB].sort().join('|'), {
      seriesId: s.series_id,
      keys: [kA, kB],
      winsByKey,
      games,
      complete,
    });
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
