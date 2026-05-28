# Dota League — Availability Form & Group-Stage Scheduler

**Build spec for Claude Code.** Stack: Next.js (App Router) + TypeScript + Node, on top of an **existing Supabase (Postgres) backend with auth already in place**. Users already log in and are already assigned to a team in Supabase — reuse that. Do **not** build new auth, player onboarding, or team assignment. Two deliverables in this phase: (1) a player availability form tied to the logged-in user, (2) a scheduler that turns all submitted availability into a group-stage schedule. Playoffs are out of scope for now but the data model leaves room for them.

> **Integration note for Claude Code:** rosters already exist in Supabase table **`teams_s7`** (see §2 for the exact shape). Players are embedded as a double-encoded `jsonb` array on each team row and identified by an Auth0-style `auth_id`; the "group" is `division_id`. There is **no** separate players or groups table. Build a small adapter that reads `teams_s7` and produces the working `Team`/`Player`/`Group` objects in §2; everything downstream (form, scheduler) consumes those. Only the *availability* and *schedule* tables in §6 are new.

---

## 1. Context & goal

A Dota league runs groups of **3–5 teams**, 5 players per team. Within a group every team plays every other team once (single round robin, one Bo2 per pairing). Matches are played **one per team per week**, in a fixed set of time slots (see config). We need to:

1. Collect each player's unavailability over the league window at **(date, time)-slot** granularity (they tick the slots they **cannot** play).
2. Derive team-level unavailability (a team needs all 5 players free in a slot).
3. Generate a schedule: assign each round-robin round to a week and each match to a **slot** both full rosters can make, and clearly flag any match that can't be placed.

### Window and the week-count constraint (read this first)

The league starts **Monday 1 June 2026**. A single round robin needs a number of distinct match-weeks equal to the number of *rounds*:

| Teams in group | Rounds (= weeks needed) | Byes |
|----------------|-------------------------|------|
| 3              | 3                       | 1 per round |
| 4              | 3                       | none |
| 5              | 5                       | 1 per round |

So **a 5-team group needs 5 weeks, not 4.** The collection window must be at least `max(rounds across all groups)` weeks long. Implementation rule: compute `weeksNeeded = max over groups of rounds(groupSize)` and collect availability for that many weeks. With any 5-team group present, that is **5 weeks: Mon 1 Jun → Sun 5 Jul 2026**. With only 3–4 team groups it is 3 weeks. Default the config to 5 weeks so every supported group size works; the form simply shows the right number of weeks.

```
Week 1: Mon 1 Jun  – Sun 7 Jun
Week 2: Mon 8 Jun  – Sun 14 Jun
Week 3: Mon 15 Jun – Sun 21 Jun
Week 4: Mon 22 Jun – Sun 28 Jun
Week 5: Mon 29 Jun – Sun 5 Jul   (only when a 5-team group exists)
```

Make the start date and week count config values (`LEAGUE_START` ISO date, `WEEK_COUNT` number) so future seasons need no code change.

---

## 2. Data model

### Real schema (Season 7)

The existing table is **`teams_s7`** with columns: `id uuid` (team id), `name text`, `division_id int4`, `captain_name text`, `players jsonb`, `wins int4`, `draws int4` (and likely `losses`). Critical quirks Claude Code must handle:

- **There is no separate players or groups table.** Players are embedded in `teams_s7.players`.
- **`players` is double-encoded:** it's a `jsonb` *array of JSON strings*. Each element must be `JSON.parse()`'d again to get an object like `{ name, auth_id, position, rank, steamProfile, dotabuffProfile, discordId?, country }`.
- **A player's identity is `auth_id`** — an Auth0-style subject string (e.g. `"google-oauth2|111304…"`, `"auth0|6934…"`), **not** a Supabase uuid. This is the join key between the logged-in session and a roster slot, and the key for availability.
- **A "group" is a `division_id`.** Teams in the same group = `teams_s7` rows sharing a `division_id`. The scheduler runs once per `division_id`.

### Working types (built by an adapter, not new tables)

`Team`/`Player`/`Group` below are **derived in code** by reading `teams_s7`; only `Availability` and the scheduler output are persisted as new rows.

```ts
type ISODate = string;            // 'YYYY-MM-DD'
type AuthId  = string;            // Auth0 subject, e.g. "google-oauth2|111304…"

// Parsed from one element of teams_s7.players (after the second JSON.parse)
interface Player {
  authId: AuthId;                 // the join key
  name: string;
  position?: string;
}

// One teams_s7 row, normalized
interface Team {
  id: string;                     // teams_s7.id (uuid)
  name: string;                   // teams_s7.name
  divisionId: number;             // teams_s7.division_id  == the "group"
  players: Player[];              // parsed from teams_s7.players
}

// A group is just the set of teams in a division
interface Group {
  divisionId: number;
  teams: Team[];                  // 3–5
}

// New table. One row per player submission, keyed by auth_id.
// A slot is a "YYYY-MM-DD HH:MM" string in the league timezone.
interface Availability {
  authId: AuthId;                 // FK-ish; unique
  blockedSlots: SlotKey[];        // (date, time) slots this player CANNOT play
  submittedAt: string;            // ISO timestamp
}
type SlotKey = string;            // "2026-06-02 20:00", league-tz local

// Scheduler output
interface ScheduledGame {
  match: string;                  // "Radiant vs Dire"
  teamAId: string;
  teamBId: string;
  date: ISODate;
  weekday: string;                // "Tuesday"
  start: string;                  // "20:00" (league tz)
  end: string;                    // "22:00" (start + GAME_DURATION_MINUTES)
  optionsThisWeek: number;        // count of feasible SLOTS; <=1 == fragile
}
interface ScheduledWeek {
  week: number;                   // 1-based, in calendar order
  mondayOf: ISODate;
  games: ScheduledGame[];
  byeTeamId: string | null;
}
interface Conflict {
  match: string;
  teamAId: string;
  teamBId: string;
  reason: string;
  blockingPlayers: { authId: AuthId; playerName: string; teamId: string; slots: SlotKey[] }[];
}
interface ScheduleResult {
  divisionId: number;             // the group this schedule is for
  ok: boolean;
  weeks: ScheduledWeek[];
  conflicts: Conflict[];
}
```

### League config (constants)

```ts
const LEAGUE_START = "2026-06-01";          // Monday
const WEEK_COUNT   = 5;                       // derive from largest division (5-team => 5)
const LEAGUE_TZ    = "Europe/Dublin";         // CONFIRM. all slots are in this tz
const GAME_DURATION_MINUTES = 120;            // Bo2 ~ 2h; used to compute end times

const SLOTS_WEEKDAY = ["18:00","19:00","20:00","21:00"];               // Mon–Fri (<5pm removed)
const SLOTS_WEEKEND = ["12:00","14:00","16:00","17:00",
                       "18:00","19:00","20:00","21:00"];               // Sat–Sun

// tie-break order when several slots are equally good (most-playable wins first)
const WEEKDAY_PREF = [2,4,1,3,5,6,0];   // Tue,Thu,Mon,Wed,Fri,Sat,Sun  (JS getDay: 0=Sun)
const TIME_PREF    = ["20:00","19:00","21:00","18:00","17:00","16:00","14:00","12:00"];
```

`slotsForDate(d)` returns `SLOTS_WEEKEND` for Sat/Sun else `SLOTS_WEEKDAY`. Because the latest offered start is 21:00, a 2-hour Bo2 always finishes before midnight, so **the slot list itself is the latest-start cutoff** — no separate bound needed.

---

## 3. Section 1 — Availability form

**Route:** `/availability` — resolves the player from the **current session's `auth_id`**; no `[playerId]` param, no opaque link. If no session, redirect to the existing login.

**Resolving who the player is (the key step):** take the session's Auth0 subject (`auth_id`). Find the roster slot by scanning `teams_s7`: for each row, parse `players` (remember the double decode — `JSON.parse` the column, then `JSON.parse` each element), and match on `player.auth_id === session.auth_id`. The matching team gives you the player's `name`, `Team`, and the team's `division_id` (the group). If no team contains the auth_id, show a "you're not on a roster yet" state instead of the form. Implement this scan once as a reusable helper; the admin view and scheduler adapter need it too.

**Behaviour**

- On load, resolve the player as above and fetch the league window. If they already submitted, pre-fill their previous selection so they can edit and resubmit.
- Render the window as a **day × time-slot grid**: one section per week ("Week 1 — w/c Mon 1 Jun"), each of the 7 days listing its slot chips. Weekday rows show the 4 weekday slots (18:00–21:00); weekend rows show the 8 weekend slots (12:00–21:00). Each slot is an individual toggle.
- A slot tapped = **blocked** (player cannot play that slot). UI copy: heading "Tick the times you **cannot** play." Blocked chips get a clear filled/struck style.
- **All times are Europe/Dublin**, stated plainly on the form ("All times are Dublin time (Europe/Dublin)"). No per-user timezone conversion — players in other countries read off Dublin time themselves. This keeps the form, storage, and scheduler all in one timezone with zero conversion logic. (If you ever add a non-Dublin-heavy division later, revisit this; for now it's a deliberate simplification.)
- Input helpers to keep it fast on mobile (the grid is ~36 slots/week): per-day "block all / clear all", per-week "block all / clear", and a **"copy week 1 pattern to all weeks"** action — most players have a recurring weekly availability, so this turns ~180 taps into a handful.
- Live running count: "You've blocked N of {total} slots." If a player blocks a large share (say >60%), show a soft inline warning ("this makes scheduling hard for your team") — never block submission.
- Submit posts `{ blockedSlots }` (league-tz `SlotKey[]`) to `POST /api/availability`. **The server derives `auth_id` from the session — never trust a client-supplied id.** Validate server-side: each slot must be a real slot inside the window (correct weekday/weekend slot set); dedupe. Upsert one `availability` row keyed by `auth_id` (see §6).
- After submit, confirm and read back the blocked slots.

**Admin progress view:** `/admin/availability`, gated by your existing admin role/claim. Build the player list by reading all `teams_s7` rows (optionally filtered by `division_id`), parsing each `players` array, and left-joining `availability` on `auth_id`. Show, per team, each player's submitted/not-submitted status and blocked-**slot** count. This is where you spot the one player who blocked most of their availability before the scheduler ever runs.

**Mobile-first.** Most players will fill this on a phone; the grid must be tappable and legible at ~380px wide.

---

## 4. Section 2 — Scheduler (local tool, no DB writes)

The scheduler is **not** a server feature and never writes to the database. It is a standalone script the admin runs **locally** on exported data; its output is JSON that the admin drops into the calendar page (§5). This removes any risk of an automated run overwriting live data.

`solveGroup(input): ScheduleResult` is a pure, deterministic, dependency-free function (validated Python reference provided; a Node/TS port is fine too). It has no I/O — a thin CLI wrapper does the file reading/writing.

**Inputs to `solveGroup`:** the division's `Team[]` (each with its parsed `Player[]`), the map `authId → blockedSlots`, `LEAGUE_START` (Monday ISO), `WEEK_COUNT`, and the slot config. `authId` and slots are treated as opaque keys.

**Getting the data to the tool.** The admin availability page (§3) has an **"Export division JSON"** button (admin-only) that downloads a single file containing, for the chosen `division_id`: the rosters (team id/name + each player's `auth_id`/name, parsed from `teams_s7`) and every player's `blockedSlots` from the `availability` table. The local script consumes that file:

```
python league_scheduler.py division-7.json > division-7-schedule.json
```

No DB credentials live in the script and there is no write path back to Supabase. (If you'd rather skip the export step, the script *can* read Supabase directly with a read-only key — but the export-file route is the safer default and matches "get the data, run it locally".)

**Algorithm**

1. **Team unavailability.** `teamBlocked(team) = union of blockedSlots over its players`.
2. **Round robin via the circle method.** For odd team counts add a dummy "BYE" slot; the team paired with BYE sits out that round. Produces `rounds`, `rounds.length = teams` (odd) or `teams-1` (even); the team absent from a round is that round's bye.
3. **Feasible slots.** Enumerate every `(date, time)` slot in week `w` using `slotsForDate(date)`. A slot is feasible for match `(a,b)` iff its `SlotKey` is in neither team's blocked set. Week `w` spans the 7 dates from `LEAGUE_START + 7*w`.
4. **Round → week assignment.** A round can occupy a week only if every match in it has ≥1 feasible slot that week — a bijection over ≤5 weeks (≤120 permutations). Brute-force all valid bijections; keep the one that **maximises the minimum** per-round slack (slack = feasible slots summed across the round's matches). Worst-case protection for the tightest match.
5. **Slot within a week.** Order candidate slots by (a) how many of the week's matches can play that exact slot, then (b) `WEEKDAY_PREF`, then (c) `TIME_PREF`; assign each match the first slot it can play. Clusters both matches onto a shared kickoff when possible. Each game records `start`, `end = start + GAME_DURATION_MINUTES`, and `optionsThisWeek` (flag ≤1 as fragile).
6. **Output.** Emit `ScheduleResult` (JSON) — `weeks[]` in calendar order with per-game date/start/end and the bye team, plus any `conflicts`.

**Conflict handling.** Don't throw. Return `ok:false` with a `Conflict[]`: for every match with zero feasible slots in every week, name the match and the players whose blocked slots cause it. The admin reads this from the JSON/printed output and negotiates with that one person before re-exporting and re-running.

---

## 5. Section 3 — Calendar page (manual, fed by the JSON)

No persisted schedule, no publish workflow, no public view, no DB write-back. After running the scheduler locally you have a `ScheduleResult` JSON; the calendar page simply renders it.

- The page is **data-driven from a static source**: commit the schedule JSON into the repo (e.g. `data/division-7-schedule.json`) or paste it into a constant, and the page renders week-by-week (or as a month grid) showing each game's date, start–end, the two teams, and the bye. No fetch, no Supabase read at render time.
- Updating the schedule = run the tool again, replace the JSON file, redeploy. That's the whole "lifecycle" — nothing can silently overwrite anything, because changes only happen when you deliberately swap the file.
- **Reschedules / one-off moves** are just hand-edits to that JSON (or to the calendar data) — you're in full manual control, which is exactly what you asked for.
- Optional, both cheap because every game has date + start + end: render a "TIGHT" marker for any game where `optionsThisWeek <= 1` (so you know which ones are fragile), and offer an **ICS download** built from the same JSON so players can add games to their own calendars.

**Submission deadline.** Keep a config/displayed `AVAILABILITY_DEADLINE` so players know when to submit by; after it you export and run. This is purely informational on the form — there's no automated server action tied to it.

---

## 6. Storage

Use the **existing Supabase (Postgres)** instance and its client. Rosters live in `teams_s7` (§2) — reuse, don't duplicate. Add exactly **one** new table:

- **`availability`** — `auth_id text primary key` (the Auth0 subject), `blocked_slots text[]` (each a `"YYYY-MM-DD HH:MM"` SlotKey in Europe/Dublin), `submitted_at timestamptz default now()`. One row per player, upserted on `auth_id`.

There is deliberately **no `schedule_result` table** — the schedule is produced locally and lives as a JSON file / the calendar page, not in the DB. The app's only DB write is a player upserting their own availability row.

**Admin export.** A read-only admin action gathers `teams_s7` (filtered by `division_id`) + matching `availability` rows and serves them as the single JSON file the local scheduler consumes (§4). Read-only; it never writes.

**Row-Level Security — note the Auth0 caveat.** Identity here is an Auth0 subject (`auth_id`), not a Supabase `auth.uid()` uuid, so the default `auth.uid()` RLS pattern does **not** apply directly. Two valid setups, pick to match how your stack already talks to Supabase:

- **Server-enforced (most likely correct for you):** all `availability` writes go through your Next.js route handler, which derives `auth_id` from the session and writes using a server-side Supabase client (service role). The server is the gate; client-side direct writes are disabled. Simplest given Auth0.
- **DB-enforced RLS:** only if your Supabase is configured to accept the Auth0 JWT — then policy `auth_id = auth.jwt() ->> 'sub'` restricts each user to their own row. Use this *in addition* to server enforcement if you want defense in depth.

In both cases, `availability` is the only table the app writes, and a player can only write their own row.

The scheduler (§4) lives outside the app entirely as a local tool, so it has no bearing on the app's DB access. For local dev of the *form*, a fixture of a 5-team division (real `teams_s7` shape, including the double-encoded `players`) plus a few `availability` rows makes the export → run → calendar flow demoable without touching production.

---

## 7. Validation & edge cases

- Reject availability slots that aren't real slots inside the window: the date must be in `[LEAGUE_START, LEAGUE_START + WEEK_COUNT*7)` **and** the time must belong to that date's slot set (weekday vs weekend). Dedupe.
- All slots are Europe/Dublin; no conversion. `SlotKey` strings are stored and compared as-is.
- A roster player object missing `auth_id` (data-quality issue in the messy `players` jsonb): that player can't log availability, so surface them in the admin view as "unlinked — fix roster" rather than silently dropping them; they'd otherwise be an invisible hole in the team's availability.
- `auth_id` is always taken from the session, never the request body; server enforcement (and optional JWT-sub RLS) is the backstop.
- A logged-in user whose `auth_id` is in no `teams_s7.players` array: show the "no roster" state, don't accept availability.
- A team whose parsed `players` array isn't exactly 5: allow but warn in admin (the union logic still works with any count).
- A `division_id` with <3 or >5 teams: the scheduler is specced for 3–5; flag it in admin and refuse to run with a clear message rather than producing garbage.
- A 5-team division while `WEEK_COUNT < 5`: hard validation error at run time — "Division X has 5 teams and needs 5 weeks; current window is {WEEK_COUNT}." This is the main footgun; fail loud.
- A player who hasn't submitted by export time: the export marks them missing; the local tool either skips the division until they submit or treats them as fully available — your call, passed as a flag to the script.
- A duplicate `auth_id` across two teams (data error): detect and flag in admin — a player should be on one roster only.
- Re-running the local tool is deterministic and side-effect-free; you choose when to swap the JSON the calendar page uses, so nothing changes underneath players unexpectedly.

---

## 8. Acceptance criteria

1. A logged-in player can open `/availability`, tick time slots across the full window, submit, reopen, and see their selection preserved — identity resolved from the session, not a URL.
2. Admin progress view shows submission status and per-player blocked-slot counts, built by parsing `teams_s7.players` and joining `availability` on `auth_id`.
3. Running the local tool on an exported 3-, 4-, or 5-team division produces a valid `ScheduleResult` JSON: exactly one match per team per week, every match in a slot both rosters can play, a start/end time per game, correct byes, and weeks in calendar order.
4. A player who blocks an entire team's options produces `ok:false` with that player named (by name + `auth_id`) and the offending slots in `blockingPlayers` — not a crash, not a silent partial schedule.
5. The scheduler has unit tests covering: a clean division, a "tight" division (matches with 1 slot flagged), and an impossible division (conflict reported with correct blocking player).
6. `solveGroup` is pure (no DB/network) and deterministic; the CLI wrapper only does file read/write.
7. The `teams_s7` adapter (used by the form and the export) correctly handles the double-encoded `players` array and resolves a session `auth_id` to the right team and `division_id`.
8. The admin export produces a single JSON file the local tool runs on with no further setup, and the calendar page renders a schedule JSON without any DB read at render time.

---

## 9. Out of scope (this phase)

- **Results entry & standings** — recording Bo2 outcomes (2-0 / 1-1 / 0-2) and updating `teams_s7.wins`/`draws`/`losses`. This is the obvious next phase and pairs naturally with the published schedule (each game becomes a result-entry row), but it's not needed to produce the schedule.
- Playoff bracket (single/double elim). The model intentionally separates `solveGroup` per division so a `solveBracket` can be added later reusing the same feasibility + slot-picking helpers.
- Authentication, player onboarding, and team assignment — all handled by your existing Supabase setup.
- Per-user timezone display — deliberately skipped; everything is Europe/Dublin.
- Public schedule view & in-app schedule persistence — deliberately dropped; the schedule is a local JSON rendered by a manually-updated calendar page.
- Notifications/reminders for non-submitters (the optional ICS download covers the gentler "add to calendar" need).

---

## Appendix — reference algorithm (validated, for porting)

The round-robin + assignment + slot-picking logic above was implemented and tested in Python (slot-based); the TypeScript port should match it exactly. Key invariants to preserve when porting:

- Circle method keeps element 0 fixed and rotates the rest: `arr = [arr[0], arr[last], ...arr[1..last-1]]` each round.
- The round→week search maximises the **minimum** per-round slack (worst-case protection), not the sum.
- Slot score is `(matchesPlayableInThatSlot, -weekdayPrefIndex, -timePrefIndex)`, sorted descending; matches are assigned the first feasible slot in that order so they cluster.
- Feasible slots are enumerated per date using the weekday/weekend slot set; the 21:00 cap is the implicit latest-start bound.
- Conflict diagnostics intersect each player's blocked **slots** with the relevant week and report only players with a non-empty intersection.

### Parsing `teams_s7.players` (the double decode)

The column is a `jsonb` array whose elements are themselves JSON *strings*, so two parses are needed:

```ts
function parseRoster(row: { id: string; name: string; division_id: number; players: unknown }): Team {
  // supabase-js already gives `players` as a JS array of strings for a jsonb column;
  // if it arrives as a string, JSON.parse once first.
  const raw = Array.isArray(row.players) ? row.players : JSON.parse(row.players as string);
  const players: Player[] = raw.map((el: string) => {
    const p = JSON.parse(el);                 // second decode: string -> object
    return { authId: p.auth_id, name: p.name, position: p.position };
  });
  return { id: row.id, name: row.name, divisionId: row.division_id, players };
}
```

Resolve the logged-in user by finding the team whose `players` contains a matching `authId`. Cache this; several routes need it.