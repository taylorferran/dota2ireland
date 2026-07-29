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
    wf: { winnerSeed: 1, score: '2-0', matchIds: [8896705539, 8896816547] }, // 2 Samuel's 2 Sexy (1) beat WONGWONGBAKERY (3)
    lf: { winnerSeed: 2, score: '2-1', matchIds: [8916745349, 8916857866, 8916937839] }, // Business Mices (2) beat WONGWONGBAKERY (3) — Losers Final
  },
  2: {
    // Round of 16
    r1m2: { winnerSeed: 8, score: '2-0', matchIds: [8893702286, 8893825683] }, // SecretShop (8) beat MMR Famine (9)
    r1m3: { winnerSeed: 5, score: '2-0', matchIds: [8890363896, 8890467133] }, // 5 Stuns No Brains (5) beat The Chump's People (12)
    r1m4: { winnerSeed: 4, score: '2-0', matchIds: [8887369973, 8887451835] }, // Fost Team (4) beat Cavan Creche (13)
    r1m5: { winnerSeed: 14, score: '2-1', matchIds: [8893710886, 8893812985, 8893920881] }, // The Dark Side of the Map (14) beat Mikes Army (3)
    // Walkover: JoonSquad forfeited, so no games were played (card isn't clickable).
    r1m6: { winnerSeed: 11, score: 'W/O', matchIds: [] }, // Owen Morris and the CUMMERS (11) beat JoonSquad (6) by forfeit
    r1m7: { winnerSeed: 10, score: '2-0', matchIds: [8885962091, 8886053554] }, // D2Ire Rejects (10) beat VELENO (7)
    r1m8: { winnerSeed: 2, score: '2-0', matchIds: [8892053305, 8892139106] }, // Random (2) beat Missprint Esports (15)
    // Quarterfinals
    qf1: { winnerSeed: 1, score: '2-1', matchIds: [8896772376, 8896866599, 8896942799] }, // Imprint Esports (1) beat SecretShop (8)
    qf2: { winnerSeed: 4, score: '2-1', matchIds: [8895360535, 8895418675, 8895502719] }, // Fost Team (4) beat 5 Stuns No Brains (5)
    qf3: { winnerSeed: 14, score: '2-1', matchIds: [8915315785, 8915412225] }, // The Dark Side of the Map (14) beat Owen Morris and the CUMMERS (11) — deciding game not ticketed on Imprint
    qf4: { winnerSeed: 10, score: '2-0', matchIds: [8895286756, 8895381918] }, // D2Ire Rejects (10) beat Random (2)
    // Semifinals
    sf1: { winnerSeed: 4, score: '2-1', matchIds: [8911902070, 8911991314, 8912074176] }, // Fost Team (4) beat Imprint Esports (1)
    sf2: { winnerSeed: 14, score: '2-1', matchIds: [8919842469, 8919944298, 8920048857] }, // The Dark Side of the Map (14) beat D2Ire Rejects (10)
  },
  3: {
    // 4-team double elim. Like Div 1, group and playoff share the same teams, so results are
    // recorded by hand using the playoff game ids only.
    sf1: { winnerSeed: 1, score: '2-0', matchIds: [8898361912, 8898408707] }, // Wreck the Herald (1) beat Bord na Mona (4)
    sf2: { winnerSeed: 2, score: '2-1', matchIds: [8905993532, 8906073420, 8906154295] }, // Grumpy Old Men (2) beat Team Sosal (3)
    lr1: { winnerSeed: 3, score: 'W/O', matchIds: [] }, // Team Sosal (3) advance — Bord na Mona (4) forfeited
  },
};
