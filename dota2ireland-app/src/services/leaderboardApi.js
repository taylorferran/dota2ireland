// Use proxied endpoints to avoid CORS issues
import { cachedJson, TTL } from './apiCache';

const API_TOKEN = import.meta.env.VITE_IMPRINT_API_TOKEN;

// Season league IDs
export const SEASON_LEAGUE_IDS = {
  5: 18171, // IDL Season 5
  6: 19084, // IDL Season 6
  7: 19763, // IDL Season 7
};

export const fetchLeaderboard = (leagueId) =>
  cachedJson(`leaderboard:${leagueId}`, async () => {
    const response = await fetch(`/api/leaderboard?league_id=${leagueId}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_TOKEN,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return response.json();
  }, TTL.DYNAMIC);

export const fetchHeroStatistics = (leagueId) =>
  cachedJson(`hero-statistics:${leagueId}`, async () => {
    const response = await fetch(`/api/hero-statistics?league_id=${leagueId}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_TOKEN,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch hero statistics');
    }
    return response.json();
  }, TTL.DYNAMIC);

export const fetchTeams = (leagueId) =>
  cachedJson(`teams:${leagueId}`, async () => {
    const response = await fetch(`/api/teams?league_id=${leagueId}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_TOKEN,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }
    return response.json();
  }, TTL.DYNAMIC);

