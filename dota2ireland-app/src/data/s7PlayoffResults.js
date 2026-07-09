// Recorded Season 7 playoff results, keyed by division then match id (match ids come from
// the BRACKETS structure in S7PlayoffBracket.jsx). `winnerSeed` is the seed number of the
// winning team — the winner is shown advancing into the match its `win` target points to,
// and the loser is struck through. `matchIds` are the dota2 match ids of each game in the
// series (in game order); clicking the series in the bracket lazily loads their detail
// (players, heroes, K/D/A, Imprint scores, Dotabuff links). Add one line as each match plays.
//
// Division ids: 1 = Div 1, 2 = Div 2 (combined 2A/2B/2C), 3 = Div 3.
export const s7PlayoffResults = {
  2: {
    // Round of 16
    r1m4: { winnerSeed: 4, score: '2-0', matchIds: [8887369973, 8887451835] }, // Fost Team (4) beat Cavan Creche (13)
    r1m7: { winnerSeed: 10, score: '2-0', matchIds: [8886053554, 8885962091] }, // D2Ire Rejects (10) beat VELENO (7)
  },
};
