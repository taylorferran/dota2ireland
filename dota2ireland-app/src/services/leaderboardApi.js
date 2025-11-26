// Use proxied endpoints to avoid CORS issues
const API_TOKEN = import.meta.env.VITE_IMPRINT_API_TOKEN;
const LEAGUE_ID = 18171; // IDL Season 5

export const fetchLeaderboard = async () => {
  const response = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: {
      'token': API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      league_id: LEAGUE_ID,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
};

export const fetchHeroStatistics = async () => {
  const response = await fetch('/api/hero-statistics', {
    method: 'POST',
    headers: {
      'token': API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      league_id: LEAGUE_ID,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch hero statistics');
  }
  return response.json();
};

export const fetchTeams = async () => {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'token': API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      league_id: LEAGUE_ID,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }
  return response.json();
};

