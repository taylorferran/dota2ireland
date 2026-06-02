import { cachedJson, TTL } from "./apiCache";

const API_TOKEN = import.meta.env.VITE_IMPRINT_API_TOKEN;

export const fetchMatchDetails = (matchId) =>
  cachedJson(`match:${parseInt(matchId, 10)}`, async () => {
    try {
      const response = await fetch(`/api/match?match_id=${parseInt(matchId, 10)}`, {
        method: "GET",
        headers: {
          "x-api-key": API_TOKEN,
        },
      });

      if (response.status === 503) {
        throw new Error("API service is temporarily unavailable");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch match data");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching match data:", error);
      throw error;
    }
  }, TTL.MATCH);

