// Build scheduler input JSON for a division from Supabase (read-only).
// usage: node scripts/buildDivisionInput.mjs <divisionId>  ->  division-<id>.json
//
// Maps DB team name -> URL slug (matching season7TeamNames in League.jsx) so the
// produced schedule uses the same team ids as src/data/matchScheduleSeason7.ts.
import { readFileSync, writeFileSync } from 'fs';

const divisionId = Number(process.argv[2] || 22);

// .env.local loader (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// DB name -> slug. Covers every Division 2 team (all three groups).
const NAME_TO_SLUG = {
  'JoonSquad: Next Jooneration': 'joonsquad_next',
  'Imprint Esports': 'imprint_esports',
  'The Dark Side of the Map': 'the_dark_side',
  'Fost team': 'fost_team',
  'MMR Famine': 'mmr_famine',
  'SecretShop': 'secretshop',
  'Owen Morris and the CUMMERS': 'owen_morris_cummers',
  'Random': 'random',
  'D2Ire Rejects': 'd2ire_rejects',
  'Mikes Army': 'mikes_army',
  '5 Stuns No Brains': 'five_stuns_no_brains',
  'Missprint Esports': 'missprint_esports',
  'Cavan Creche': 'cavan_creche',
  "The Chump's People": 'the_chumps_people',
  'VELENO': 'veleno',
  // Division 3
  'Bord na Mona': 'bord_na_mona',
  'Grumpy Old Men': 'grumpy_old_men',
  'Team Sosal': 'team_sosal',
  'Wreck the Herald': 'wreck_the_herald',
};

const J = (x) => { if (Array.isArray(x)) return x; if (typeof x === 'string') { try { return JSON.parse(x); } catch { return null; } } return x; };
const parsePlayers = (t) => (J(t.players) || []).map(J).filter(Boolean);

const teamsRaw = await (await fetch(`${URL_}/rest/v1/teams_s7?select=id,name,division_id,players&division_id=eq.${divisionId}`, { headers })).json();
const availRaw = await (await fetch(`${URL_}/rest/v1/s7_availability?select=auth_id,blocked_slots`, { headers })).json();

const availability = {};
for (const row of availRaw) availability[row.auth_id] = row.blocked_slots || [];

const teams = teamsRaw.map(t => {
  const name = t.name.trim();
  const slug = NAME_TO_SLUG[name];
  if (!slug) throw new Error(`No slug mapping for team "${name}"`);
  return {
    id: slug,
    name,
    divisionId,
    players: parsePlayers(t).map(p => ({ authId: p.auth_id, name: p.name })),
  };
});

// Report availability coverage so we know if anyone hasn't submitted.
let missing = 0;
for (const t of teams) for (const p of t.players) if (!(p.authId in availability)) missing++;

const outPath = new URL(`../division-${divisionId}.json`, import.meta.url).pathname;
writeFileSync(outPath, JSON.stringify({ teams, availability }, null, 2));
console.log(`Div ${divisionId}: ${teams.length} teams, ${teams.reduce((s, t) => s + t.players.length, 0)} players, ${missing} without an availability submission.`);
console.log(`Wrote ${outPath}`);
