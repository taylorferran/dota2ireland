// Season 7 internal team key -> display name. Shared by the League page (display +
// standings/DB-name merge + Imprint name matching) and the sync script
// (scripts/syncS7Results.mjs), so both resolve teams identically.
//
// Keys are stable identifiers used by the schedule (matchScheduleSeason7.ts) and the
// results table; if a team is renamed, change the display value here and keep the key.
export const season7TeamNames = {
  bye_week: "Bye Week",
  // Division 1
  business_mices: "Business Mices",
  the_mystery_machine: "The Myst-ery Machine",
  full_english_breakfast: "2 Samuel's 2 Sexy", // renamed from "Full English Breakfast" (key kept stable)
  wongwongbakery: "WONGWONGBAKERY",
  last_hit_academy: "Last Hit Academy",
  shishuli: "ShiShuli",
  // Division 2 (split into Groups 2A / 2B / 2C by MMR seeding - see division_id in DB)
  joonsquad_next: "JoonSquad: Next Jooneration",
  runners: "RUNNERS",
  imprint_esports: "Imprint Esports",
  the_dark_side: "The Dark Side of the Map",
  fost_team: "Fost team",
  mmr_famine: "MMR Famine",
  secretshop: "SecretShop",
  random: "Random",
  d2ire_rejects: "D2Ire Rejects",
  mikes_army: "Mikes Army",
  five_stuns_no_brains: "5 Stuns No Brains",
  missprint_esports: "Missprint Esports",
  cavan_creche: "Cavan Creche",
  the_chumps_people: "The Chump's People",
  owen_morris_cummers: "Owen Morris and the CUMMERS",
  // Division 3
  grumpy_old_men: "Grumpy Old Men",
  bord_na_mona: "Bord na Mona",
  veleno: "VELENO",
  wreck_the_herald: "Wreck the Herald",
  team_sosal: "Team Sosal",
};

// Teams that have withdrawn mid-season. Every one of their games is treated as a 2-0
// forfeit for the opponent, and they're shown struck-through at the bottom of the table.
export const season7DroppedTeams = [
  'the_mystery_machine',
  'last_hit_academy',
  'shishuli',
];
