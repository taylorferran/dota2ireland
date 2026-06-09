// Create Discord scheduled events for a week's IDL games, in the format:
//   "D2C - Owen Morris and the CUMMERS vs 5 Stuns No Brains"
//   External event, location = the Twitch channel, start/end from the schedule.
//
// Run at the start of each week. Reads the published schedule from
// src/data/matchScheduleSeason7.ts and creates one event per game that week.
//
// SETUP (one time):
//   1. Create a Discord application + bot: https://discord.com/developers/applications
//   2. Invite the bot to your server with the "Manage Events" permission.
//   3. Add to .env.local:
//        DISCORD_BOT_TOKEN=...           (Bot -> Reset Token)
//        DISCORD_GUILD_ID=...            (right-click your server -> Copy Server ID)
//
// USAGE:
//   node scripts/createDiscordEvents.mjs <week>            # PREVIEW only (dry run)
//   node scripts/createDiscordEvents.mjs <week> --create   # actually create events
//   options: --division=D2C   only that division
//            --duration=3      event length in hours (default 3, matches 20:00-23:00)
//            --location=URL    stream link (default https://www.twitch.tv/dota2ireland)
//
// Times in the schedule are Europe/Dublin. All Season 7 games fall in summer time
// (IST = UTC+1), so we stamp them +01:00. Revisit if games are ever scheduled
// outside late-March..late-October.

import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const weekArg = args.find((a) => /^\d+$/.test(a));
const CREATE = args.includes('--create');
const DIV_FILTER = (args.find((a) => a.startsWith('--division=')) || '').split('=')[1];
const DURATION_H = Number((args.find((a) => a.startsWith('--duration=')) || '').split('=')[1] || 3);
const LOCATION = (args.find((a) => a.startsWith('--location=')) || '').split('=')[1] || 'https://www.twitch.tv/dota2ireland';
const DUBLIN_OFFSET = '+01:00'; // IST (summer); all S7 games are June-July

// --- env (reads .env.local and .env; .env.local wins) ---
const loadEnv = (file) => {
  try {
    return Object.fromEntries(
      readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
        .split('\n').filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
    );
  } catch { return {}; }
};
const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const TOKEN = env.DISCORD_BOT_TOKEN;
const GUILD = env.DISCORD_GUILD_ID;

// --- slug -> display name (from League.jsx) ---
const leagueSrc = readFileSync(new URL('../src/pages/League.jsx', import.meta.url), 'utf8');
const namesBlock = leagueSrc.slice(leagueSrc.indexOf('season7TeamNames = {'));
const slugToName = {};
for (const m of namesBlock.slice(0, namesBlock.indexOf('};')).matchAll(/(\w+):\s*"([^"]+)"/g)) slugToName[m[1]] = m[2];

// --- parse schedule ---
const DIV_LABEL = { 1: 'D1', 2: 'D2A', 22: 'D2B', 23: 'D2C', 3: 'D3' };
const schedSrc = readFileSync(new URL('../src/data/matchScheduleSeason7.ts', import.meta.url), 'utf8');
const games = [];
for (const m of schedSrc.matchAll(/division:\s*(\d+),\s*week:\s*(\d+),\s*team1Id:\s*'([^']+)',\s*team2Id:\s*'([^']+)',\s*date:\s*'([^']+)',\s*time:\s*'([^']+)'/g)) {
  games.push({ division: +m[1], week: +m[2], a: m[3], b: m[4], date: m[5], time: m[6] });
}

// --- pick week ---
const LEAGUE_START = '2026-06-01';
const autoWeek = () => {
  const days = Math.floor((Date.now() - new Date(LEAGUE_START + 'T00:00:00' + DUBLIN_OFFSET).getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
};
const week = weekArg ? Number(weekArg) : autoWeek();

let weekGames = games.filter((g) => g.week === week);
if (DIV_FILTER) weekGames = weekGames.filter((g) => DIV_LABEL[g.division] === DIV_FILTER.toUpperCase());
weekGames.sort((x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time));

const buildEvent = (g) => {
  const name = `${DIV_LABEL[g.division]} - ${slugToName[g.a]} vs ${slugToName[g.b]}`;
  const start = new Date(`${g.date}T${g.time}:00${DUBLIN_OFFSET}`);
  const end = new Date(start.getTime() + DURATION_H * 3600 * 1000);
  return {
    name,
    privacy_level: 2,            // GUILD_ONLY
    entity_type: 3,              // EXTERNAL
    entity_metadata: { location: LOCATION },
    scheduled_start_time: start.toISOString(),
    scheduled_end_time: end.toISOString(),
    description: `${DIV_LABEL[g.division]} Irish Dota League group stage. Watch live on Twitch.`,
  };
};

const fmt = (iso) => new Date(iso).toLocaleString('en-IE', { timeZone: 'Europe/Dublin', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

console.log(`\nWeek ${week}: ${weekGames.length} game(s)${DIV_FILTER ? ` in ${DIV_FILTER}` : ''}  |  ${CREATE ? 'CREATE (live)' : 'DRY RUN (preview only)'}\n`);
if (!weekGames.length) { console.log('No games found for that week.\n'); process.exit(0); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!CREATE) {
  for (const g of weekGames) { const e = buildEvent(g); console.log(`• ${e.name}\n    ${fmt(e.scheduled_start_time)} - ${fmt(e.scheduled_end_time).split(' ').pop()}  @ ${LOCATION}`); }
  console.log(`\nPreview only. Re-run with --create to publish these to Discord.\n`);
  process.exit(0);
}

if (!TOKEN || !GUILD) { console.error('Missing DISCORD_BOT_TOKEN and/or DISCORD_GUILD_ID in .env.local'); process.exit(1); }
const api = 'https://discord.com/api/v10';
const headers = { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' };

// existing events (skip duplicates by name)
const existingRes = await fetch(`${api}/guilds/${GUILD}/scheduled-events`, { headers });
if (!existingRes.ok) { console.error(`Failed to list events: ${existingRes.status} ${await existingRes.text()}`); process.exit(1); }
const existingNames = new Set((await existingRes.json()).map((e) => e.name));

// POST with automatic retry on 429 (Discord's scheduled-event create limit is strict).
const postEvent = async (event) => {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${api}/guilds/${GUILD}/scheduled-events`, { method: 'POST', headers, body: JSON.stringify(event) });
    if (res.status !== 429) return res;
    const body = await res.json().catch(() => ({}));
    const wait = Math.ceil(((body.retry_after ?? 5) + 1) * 1000);
    console.log(`  rate limited, waiting ${Math.ceil(wait / 1000)}s...`);
    await sleep(wait);
  }
  return null;
};

let created = 0, skipped = 0, failed = 0;
for (const g of weekGames) {
  const event = buildEvent(g);
  if (existingNames.has(event.name)) { console.log(`skip (exists): ${event.name}`); skipped++; continue; }
  const res = await postEvent(event);
  if (res && res.ok) { console.log(`created: ${event.name}  (${fmt(event.scheduled_start_time)})`); created++; }
  else { console.error(`FAILED: ${event.name} -> ${res ? `${res.status} ${await res.text()}` : 'gave up after retries'}`); failed++; }
  await sleep(2500); // base spacing between creates
}
console.log(`\nDone. created ${created}, skipped ${skipped}, failed ${failed}.\n`);
