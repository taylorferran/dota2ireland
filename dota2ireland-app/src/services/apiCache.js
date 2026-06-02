// localStorage-backed cache for Imprint.gg API responses, with per-entry TTL.
//
// Why localStorage (survives page reloads) rather than a session-only cache:
//   - completed match details rarely change, so they get a multi-day TTL and are only
//     refetched occasionally — Imprint can revise ratings after re-running their models,
//     so this is a few days rather than "forever";
//   - leaderboards / teams / hero stats change as matches are played, so they get a
//     short TTL and refresh automatically once it expires.
//
// An in-memory promise map also dedupes concurrent requests for the same key, so two
// components asking for the same data at once share a single network call. Failed
// requests are never cached.

const PREFIX = 'imprintCache:';
const inflight = new Map();

// Named TTLs (ms) for callers.
export const TTL = {
  SHORT: 5 * 60 * 1000,               // 5 min   — live results / series list (in-progress)
  DYNAMIC: 30 * 60 * 1000,            // 30 min  — leaderboards, teams, hero stats
  MATCH: 5 * 24 * 60 * 60 * 1000,     // 5 days  — completed match details (ratings may be revised on model re-runs)
};

const readStore = (key) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const { data, expires } = JSON.parse(raw);
    if (expires && Date.now() > expires) {
      localStorage.removeItem(PREFIX + key);
      return undefined;
    }
    return data;
  } catch {
    return undefined; // unavailable / corrupt entry -> treat as a miss
  }
};

const writeStore = (key, data, ttlMs) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      expires: ttlMs ? Date.now() + ttlMs : null,
    }));
  } catch {
    // quota exceeded / private mode / unavailable -> skip persisting, still works live
  }
};

export const cachedJson = (key, fetcher, ttlMs) => {
  const cached = readStore(key);
  if (cached !== undefined) return Promise.resolve(cached);

  if (inflight.has(key)) return inflight.get(key);

  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      writeStore(key, data, ttlMs);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err; // never cache failures
    });

  inflight.set(key, promise);
  return promise;
};

// Manual eviction (e.g. a future "refresh" button). Pass a key to clear one entry,
// or no argument to clear the whole Imprint cache.
export const clearApiCache = (key) => {
  try {
    if (key === undefined) {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } else {
      localStorage.removeItem(PREFIX + key);
    }
  } catch {
    // ignore
  }
  if (key === undefined) inflight.clear();
  else inflight.delete(key);
};
