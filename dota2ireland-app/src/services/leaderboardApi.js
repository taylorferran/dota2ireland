// Use proxied endpoints to avoid CORS issues
const API_TOKEN = import.meta.env.VITE_IMPRINT_API_TOKEN;

// Season league IDs
export const SEASON_LEAGUE_IDS = {
  5: 18171, // IDL Season 5
  6: 19084, // IDL Season 6
};

export const fetchLeaderboard = async (leagueId) => {
  const response = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: {
      'token': API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      league_id: leagueId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
};

export const fetchHeroStatistics = async (leagueId) => {
  const response = await fetch('/api/hero-statistics', {
    method: 'POST',
    headers: {
      'token': API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      league_id: leagueId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch hero statistics');
  }
  return response.json();
};

export const fetchTeams = async (leagueId) => {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'token': API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      league_id: leagueId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }
  return response.json();
};

