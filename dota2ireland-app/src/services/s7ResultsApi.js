// Live Season 7 results: fetch the league series list + each game's winner from
// Imprint.gg, with a committed snapshot fallback (the "locked-in" final results
// written by scripts/syncS7Results.mjs) for when the live API is unavailable.
import { cachedJson, TTL } from './apiCache';
import { fetchMatchDetails } from './matchApi';

const API_TOKEN = import.meta.env.VITE_IMPRINT_API_TOKEN;

// Series list — refreshes every few minutes so new results appear without a deploy.
export const fetchLeagueSeries = (leagueId) =>
  cachedJson(`league-matches:${leagueId}`, async () => {
    const response = await fetch(`/api/league-matches?league_id=${leagueId}`, {
      method: 'GET',
      headers: { 'x-api-key': API_TOKEN },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch league matches');
    }
    return response.json();
  }, TTL.SHORT);

// Resolve a list of async tasks with bounded concurrency (so we don't fire 100+
// /match requests at once on first load).
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Returns { series, detailById } for a league — the raw inputs to indexSeries().
 * Tries the live Imprint API first; on failure falls back to the committed snapshot.
 *
 * The series list is one cheap call. The expensive part is the per-game /match calls
 * (one per game, needed because the list has no winners) — so `seriesFilter` lets the
 * caller restrict which series' games are fetched (e.g. only the division on screen).
 * Each /match response is cached for several days, so a completed game is rarely refetched.
 */
export async function loadS7Aggregate(leagueId, seriesFilter = null) {
  try {
    const list = await fetchLeagueSeries(leagueId);
    const series = Array.isArray(list?.series) ? list.series : [];
    const wanted = seriesFilter ? series.filter(seriesFilter) : series;
    const ids = [...new Set(wanted.flatMap((s) => s.matches || []))];
    const details = await mapLimit(ids, 8, (id) => fetchMatchDetails(id).catch(() => null));
    const detailById = new Map(ids.map((id, i) => [id, details[i]]));
    // Return ALL series (so the schedule can map every fixture) but only details for the
    // fetched subset — series without details simply stay un-scored until viewed.
    return { series, detailById };
  } catch (err) {
    console.warn('Live S7 results unavailable, falling back to snapshot:', err);
    try {
      const snap = (await import('../data/s7ResultsSnapshot.json')).default;
      const detailById = new Map(
        Object.entries(snap.details || {}).map(([k, v]) => [Number(k), v]),
      );
      return { series: snap.series || [], detailById };
    } catch {
      return { series: [], detailById: new Map() };
    }
  }
}
