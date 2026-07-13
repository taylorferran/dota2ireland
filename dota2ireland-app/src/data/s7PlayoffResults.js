// Recorded Season 7 playoff results, keyed by division then match id (match ids come from
// the BRACKETS structure in S7PlayoffBracket.jsx). `winnerSeed` is the seed number of the
// winning team — the winner is shown advancing into the match its `win` target points to,
// and the loser is struck through. `matchIds` are the dota2 match ids of each game in the
// series (in game order); clicking the series in the bracket lazily loads their detail
// (players, heroes, K/D/A, Imprint scores, Dotabuff links). Add one line as each match plays.
//
// Division ids: 1 = Div 1, 2 = Div 2 (combined 2A/2B/2C), 3 = Div 3.
export const s7PlayoffResults = {
  1: {
    // 3-team double elim. Group and playoff share the same teams, so results are recorded
    // by hand (not auto-discovered) using the playoff game ids only.
    ws: { winnerSeed: 3, score: '2-1', matchIds: [8891970909, 8892064896, 8892144571] }, // WONGWONGBAKERY (3) beat Business Mices (2)
  },
  2: {
    // Round of 16 (r1m6 Joonsquad vs Owen Morris not played yet)
    r1m2: { winnerSeed: 8, score: '2-0', matchIds: [8893702286, 8893825683] }, // SecretShop (8) beat MMR Famine (9)
    r1m3: { winnerSeed: 5, score: '2-0', matchIds: [8890363896, 8890467133] }, // 5 Stuns No Brains (5) beat The Chump's People (12)
    r1m4: { winnerSeed: 4, score: '2-0', matchIds: [8887369973, 8887451835] }, // Fost Team (4) beat Cavan Creche (13)
    r1m5: { winnerSeed: 14, score: '2-1', matchIds: [8893710886, 8893812985, 8893920881] }, // The Dark Side of the Map (14) beat Mikes Army (3)
    r1m7: { winnerSeed: 10, score: '2-0', matchIds: [8885962091, 8886053554] }, // D2Ire Rejects (10) beat VELENO (7)
    r1m8: { winnerSeed: 2, score: '2-0', matchIds: [8892053305, 8892139106] }, // Random (2) beat Missprint Esports (15)
  },
};
