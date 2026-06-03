// Season 7 match schedule — populated after availability submissions close

export interface S7Match {
  id: string;
  division: 1 | 2 | 22 | 23 | 3;
  week: number;
  team1Id: string;
  team2Id: string;
  date: string;      // YYYY-MM-DD (Europe/Dublin)
  time: string;      // HH:MM (Europe/Dublin)
  completed: boolean;
  score?: [number, number];
  games?: {
    game: number;
    winner: string;
    dota2MatchId?: string;
  }[];
}

export const season7Schedule: S7Match[] = [

  // ── Division 1 ────────────────────────────────────────────────────────────
  // 6 teams · 5 weeks · 15 matches — generated via K6 1-factorization brute-force

  // Week 1 (2026-06-01 – 2026-06-07)
  { id: 's7-d1-w1-1', division: 1, week: 1, team1Id: 'wongwongbakery',         team2Id: 'last_hit_academy',      date: '2026-06-06', time: '12:00', completed: false },
  { id: 's7-d1-w1-2', division: 1, week: 1, team1Id: 'business_mices',         team2Id: 'shishuli',              date: '2026-06-07', time: '16:00', completed: false },
  { id: 's7-d1-w1-3', division: 1, week: 1, team1Id: 'the_mystery_machine',    team2Id: 'full_english_breakfast', date: '2026-06-07', time: '18:00', completed: false },

  // Week 2 (2026-06-08 – 2026-06-14)
  { id: 's7-d1-w2-1', division: 1, week: 2, team1Id: 'the_mystery_machine',    team2Id: 'wongwongbakery',        date: '2026-06-12', time: '18:00', completed: false },
  { id: 's7-d1-w2-2', division: 1, week: 2, team1Id: 'last_hit_academy',       team2Id: 'shishuli',              date: '2026-06-13', time: '12:00', completed: false },
  { id: 's7-d1-w2-3', division: 1, week: 2, team1Id: 'business_mices',         team2Id: 'full_english_breakfast', date: '2026-06-14', time: '16:00', completed: false },

  // Week 3 (2026-06-15 – 2026-06-21)
  { id: 's7-d1-w3-1', division: 1, week: 3, team1Id: 'full_english_breakfast', team2Id: 'wongwongbakery',        date: '2026-06-16', time: '18:00', completed: false },
  { id: 's7-d1-w3-2', division: 1, week: 3, team1Id: 'the_mystery_machine',    team2Id: 'shishuli',              date: '2026-06-18', time: '20:00', completed: false },
  { id: 's7-d1-w3-3', division: 1, week: 3, team1Id: 'business_mices',         team2Id: 'last_hit_academy',      date: '2026-06-20', time: '16:00', completed: false },

  // Week 4 (2026-06-22 – 2026-06-28)
  { id: 's7-d1-w4-1', division: 1, week: 4, team1Id: 'business_mices',         team2Id: 'the_mystery_machine',   date: '2026-06-22', time: '18:00', completed: false },
  { id: 's7-d1-w4-2', division: 1, week: 4, team1Id: 'wongwongbakery',         team2Id: 'shishuli',              date: '2026-06-23', time: '18:00', completed: false },
  { id: 's7-d1-w4-3', division: 1, week: 4, team1Id: 'full_english_breakfast', team2Id: 'last_hit_academy',      date: '2026-06-28', time: '16:00', completed: false },

  // Week 5 (2026-06-29 – 2026-07-05)
  { id: 's7-d1-w5-1', division: 1, week: 5, team1Id: 'the_mystery_machine',    team2Id: 'last_hit_academy',      date: '2026-06-30', time: '18:00', completed: false },
  { id: 's7-d1-w5-2', division: 1, week: 5, team1Id: 'full_english_breakfast', team2Id: 'shishuli',              date: '2026-06-30', time: '19:00', completed: false },
  { id: 's7-d1-w5-3', division: 1, week: 5, team1Id: 'business_mices',         team2Id: 'wongwongbakery',        date: '2026-07-04', time: '16:00', completed: false },

  // ── Division 2A ───────────────────────────────────────────────────────────
  // 5 teams · 5 weeks · 1 bye/week — re-seeded by MMR, generated via availability scheduler.
  // All 10 matches at full roster (no stand-ins).

  // Week 1 (2026-06-01 – 2026-06-07) · BYE: Cavan Creche
  { id: 's7-d2a-w1-1', division: 2, week: 1, team1Id: 'd2ire_rejects',  team2Id: 'mikes_army',         date: '2026-06-02', time: '20:00', completed: false },
  { id: 's7-d2a-w1-2', division: 2, week: 1, team1Id: 'joonsquad_next', team2Id: 'secretshop',         date: '2026-06-04', time: '20:00', completed: false },

  // Week 2 (2026-06-08 – 2026-06-14) · BYE: D2Ire Rejects
  { id: 's7-d2a-w2-1', division: 2, week: 2, team1Id: 'cavan_creche',   team2Id: 'joonsquad_next',     date: '2026-06-11', time: '20:00', completed: false },
  { id: 's7-d2a-w2-2', division: 2, week: 2, team1Id: 'secretshop',     team2Id: 'mikes_army',         date: '2026-06-11', time: '20:00', completed: false },

  // Week 3 (2026-06-15 – 2026-06-21) · BYE: SecretShop
  { id: 's7-d2a-w3-1', division: 2, week: 3, team1Id: 'mikes_army',     team2Id: 'joonsquad_next',     date: '2026-06-15', time: '20:00', completed: false },
  { id: 's7-d2a-w3-2', division: 2, week: 3, team1Id: 'd2ire_rejects',  team2Id: 'cavan_creche',       date: '2026-06-18', time: '20:00', completed: false },

  // Week 4 (2026-06-22 – 2026-06-28) · BYE: Mikes Army
  { id: 's7-d2a-w4-1', division: 2, week: 4, team1Id: 'cavan_creche',   team2Id: 'secretshop',         date: '2026-06-22', time: '20:00', completed: false },
  { id: 's7-d2a-w4-2', division: 2, week: 4, team1Id: 'd2ire_rejects',  team2Id: 'joonsquad_next',     date: '2026-06-25', time: '20:00', completed: false },

  // Week 5 (2026-06-29 – 2026-07-05) · BYE: JoonSquad
  { id: 's7-d2a-w5-1', division: 2, week: 5, team1Id: 'd2ire_rejects',  team2Id: 'secretshop',         date: '2026-06-30', time: '20:00', completed: false },
  { id: 's7-d2a-w5-2', division: 2, week: 5, team1Id: 'mikes_army',     team2Id: 'cavan_creche',       date: '2026-07-02', time: '20:00', completed: false },

  // ── Division 2B ───────────────────────────────────────────────────────────
  // 5 teams · 5 weeks · 1 bye/week — re-seeded by MMR, generated via availability scheduler (scripts/runScheduler.mjs)
  // 9/10 matches at full roster; Fost vs Chump's has no full-roster slot in any week (shinnie standin in wk2).

  // Week 1 (2026-06-01 – 2026-06-07) · BYE: The Chump's People
  { id: 's7-d2b-w1-1', division: 22, week: 1, team1Id: 'the_dark_side',     team2Id: 'fost_team',            date: '2026-06-06', time: '20:00', completed: false },
  { id: 's7-d2b-w1-2', division: 22, week: 1, team1Id: 'mmr_famine',        team2Id: 'random',               date: '2026-06-02', time: '19:00', completed: false },

  // Week 2 (2026-06-08 – 2026-06-14) · BYE: MMR Famine
  { id: 's7-d2b-w2-1', division: 22, week: 2, team1Id: 'the_dark_side',     team2Id: 'random',               date: '2026-06-13', time: '20:00', completed: false },
  { id: 's7-d2b-w2-2', division: 22, week: 2, team1Id: 'fost_team',         team2Id: 'the_chumps_people',    date: '2026-06-13', time: '20:00', completed: false }, // no full-roster slot any week — requires shinnie stand-in for Chump's People

  // Week 3 (2026-06-15 – 2026-06-21) · BYE: Fost team
  { id: 's7-d2b-w3-1', division: 22, week: 3, team1Id: 'the_dark_side',     team2Id: 'mmr_famine',           date: '2026-06-15', time: '19:00', completed: false },
  { id: 's7-d2b-w3-2', division: 22, week: 3, team1Id: 'the_chumps_people', team2Id: 'random',               date: '2026-06-15', time: '20:00', completed: false },

  // Week 4 (2026-06-22 – 2026-06-28) · BYE: Random
  { id: 's7-d2b-w4-1', division: 22, week: 4, team1Id: 'the_dark_side',     team2Id: 'the_chumps_people',    date: '2026-06-26', time: '20:00', completed: false },
  { id: 's7-d2b-w4-2', division: 22, week: 4, team1Id: 'fost_team',         team2Id: 'mmr_famine',           date: '2026-06-27', time: '20:00', completed: false },

  // Week 5 (2026-06-29 – 2026-07-05) · BYE: The Dark Side of the Map
  { id: 's7-d2b-w5-1', division: 22, week: 5, team1Id: 'the_chumps_people', team2Id: 'mmr_famine',           date: '2026-07-04', time: '20:00', completed: false },
  { id: 's7-d2b-w5-2', division: 22, week: 5, team1Id: 'random',            team2Id: 'fost_team',            date: '2026-07-05', time: '20:00', completed: false },

  // ── Division 2C ───────────────────────────────────────────────────────────
  // 5 teams · 5 weeks · 1 bye/week — re-seeded by MMR, generated via availability scheduler.
  // Week 1 locked/in-motion; weeks 2–5 solved around it with the KeY (Imprint) stand-in.
  // Stand-ins: KeY/Imprint (wk1,3,4); flipper/Missprint + Lord_Shadow/VELENO (wk5 Missprint v VELENO).

  // Week 1 (2026-06-01 – 2026-06-07) · BYE: Missprint Esports
  { id: 's7-d2c-w1-1', division: 23, week: 1, team1Id: 'owen_morris_cummers', team2Id: 'five_stuns_no_brains', date: '2026-06-01', time: '20:00', completed: true, score: [1, 1] }, // played 1-1 (hammurabi stand-in for 5 Stuns)
  { id: 's7-d2c-w1-2', division: 23, week: 1, team1Id: 'imprint_esports',     team2Id: 'veleno',              date: '2026-06-04', time: '21:00', completed: false }, // KeY away wk1 — requires stand-in for Imprint Esports

  // Week 2 (2026-06-08 – 2026-06-14) · BYE: Imprint Esports
  { id: 's7-d2c-w2-1', division: 23, week: 2, team1Id: 'veleno',              team2Id: 'owen_morris_cummers', date: '2026-06-09', time: '21:00', completed: false },
  { id: 's7-d2c-w2-2', division: 23, week: 2, team1Id: 'missprint_esports',   team2Id: 'five_stuns_no_brains', date: '2026-06-13', time: '18:00', completed: false },

  // Week 3 (2026-06-15 – 2026-06-21) · BYE: Owen Morris and the CUMMERS
  { id: 's7-d2c-w3-1', division: 23, week: 3, team1Id: 'missprint_esports',   team2Id: 'imprint_esports',     date: '2026-06-15', time: '20:00', completed: false }, // KeY stand-in for Imprint
  { id: 's7-d2c-w3-2', division: 23, week: 3, team1Id: 'veleno',              team2Id: 'five_stuns_no_brains', date: '2026-06-21', time: '21:00', completed: false }, // fragile — only 1 feasible slot

  // Week 4 (2026-06-22 – 2026-06-28) · BYE: VELENO
  { id: 's7-d2c-w4-1', division: 23, week: 4, team1Id: 'missprint_esports',   team2Id: 'owen_morris_cummers', date: '2026-06-22', time: '20:00', completed: false },
  { id: 's7-d2c-w4-2', division: 23, week: 4, team1Id: 'imprint_esports',     team2Id: 'five_stuns_no_brains', date: '2026-06-28', time: '20:00', completed: false }, // KeY stand-in for Imprint

  // Week 5 (2026-06-29 – 2026-07-05) · BYE: 5 Stuns No Brains
  { id: 's7-d2c-w5-1', division: 23, week: 5, team1Id: 'imprint_esports',     team2Id: 'owen_morris_cummers', date: '2026-07-02', time: '20:00', completed: false },
  { id: 's7-d2c-w5-2', division: 23, week: 5, team1Id: 'missprint_esports',   team2Id: 'veleno',              date: '2026-07-04', time: '20:00', completed: false }, // stand-ins: flipper (Missprint) + Lord_Shadow (VELENO)

  // ── Division 3 ────────────────────────────────────────────────────────────
  // 4 teams · single round robin spread over 5 weeks (front-loaded, no byes) to keep
  // games at full roster. yancy (Wreck) away until 17 Jun — Wreck's wk3 game is after that.
  // Grumpy vs Wreck has no full-roster slot any week (scheduled wk4 with stand-ins).

  // Week 1 (2026-06-01 – 2026-06-07)
  { id: 's7-d3-w1-1', division: 3, week: 1, team1Id: 'bord_na_mona',    team2Id: 'grumpy_old_men',    date: '2026-06-03', time: '21:00', completed: false },

  // Week 2 (2026-06-08 – 2026-06-14)
  { id: 's7-d3-w2-1', division: 3, week: 2, team1Id: 'grumpy_old_men',  team2Id: 'team_sosal',        date: '2026-06-09', time: '21:00', completed: false },

  // Week 3 (2026-06-15 – 2026-06-21)
  { id: 's7-d3-w3-1', division: 3, week: 3, team1Id: 'team_sosal',      team2Id: 'wreck_the_herald',  date: '2026-06-20', time: '19:00', completed: false }, // Sat, after yancy returns (17 Jun)

  // Week 4 (2026-06-22 – 2026-06-28)
  { id: 's7-d3-w4-1', division: 3, week: 4, team1Id: 'bord_na_mona',    team2Id: 'team_sosal',        date: '2026-06-24', time: '20:00', completed: false },
  { id: 's7-d3-w4-2', division: 3, week: 4, team1Id: 'grumpy_old_men',  team2Id: 'wreck_the_herald',  date: '2026-06-25', time: '19:00', completed: false }, // no full-roster slot any week — stand-ins: cherryghost (Grumpy), MalarkeyOten (Wreck)

  // Week 5 (2026-06-29 – 2026-07-05)
  { id: 's7-d3-w5-1', division: 3, week: 5, team1Id: 'bord_na_mona',    team2Id: 'wreck_the_herald',  date: '2026-07-04', time: '19:00', completed: false },

];
