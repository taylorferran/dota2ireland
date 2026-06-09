import { cachedJson, TTL } from "./apiCache";

const API_TOKEN = import.meta.env.VITE_IMPRINT_API_TOKEN;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const fetchMatchDetails = (matchId) =>
  cachedJson(`match:${parseInt(matchId, 10)}`, async () => {
    const url = `/api/match?match_id=${parseInt(matchId, 10)}`;
    const MAX_RETRIES = 2;

    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await fetch(url, { method: "GET", headers: { "x-api-key": API_TOKEN } });
      } catch (error) {
        // Network/TLS drop (Imprint resetting bursty connections). Retry with backoff
        // before giving up — these are transient and usually succeed on a second try.
        if (attempt >= MAX_RETRIES) {
          console.error("Error fetching match data (network):", error);
          throw error;
        }
        await sleep(300 * (attempt + 1));
        continue;
      }

      // In production a dropped upstream call surfaces as a 5xx from the proxy (not a
      // network error), so retry those too before failing.
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(300 * (attempt + 1));
        continue;
      }

      if (response.status === 503) {
        throw new Error("API service is temporarily unavailable");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch match data");
      }

      return await response.json();
    }
  }, TTL.MATCH);

