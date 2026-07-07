// Recorded Season 7 playoff results, keyed by division then match id (match ids come from
// the BRACKETS structure in S7PlayoffBracket.jsx). `winnerSeed` is the seed number of the
// winning team — the winner is shown advancing into the match its `win` target points to,
// and the loser is struck through. Add one line here as each playoff match is played.
//
// Division ids: 1 = Div 1, 2 = Div 2 (combined 2A/2B/2C), 3 = Div 3.
export const s7PlayoffResults = {
  2: {
    // Round of 16
    r1m7: { winnerSeed: 10, score: '2-0' }, // D2Ire Rejects (10) beat VELENO (7)
  },
};
