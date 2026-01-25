# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (with API proxy to Imprint.gg)
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint

# Download team images (utility script)
npm run download-team-images
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19.2 SPA with React Router 7
- **Build Tool**: Vite 7 with code splitting (react-vendor, auth, supabase chunks)
- **Authentication**: Auth0 (OAuth) → Custom JWT signing → Supabase authenticated client
- **Database**: Supabase PostgreSQL (tables: `teams_s6`, `teams`, `lft_players`)
- **External API**: Imprint.gg (proxied through `/api/*` Vercel serverless functions)
- **Styling**: Tailwind CSS (via CDN in index.html)
- **Deployment**: Vercel with SPA routing fallback

### Hybrid Data Architecture

This app uses a **unique hybrid data pattern** - understanding this is critical:

1. **Match schedules & results**: Static TypeScript files in `src/data/matchDataSeason*.ts`
   - Version controlled, no database writes needed
   - Source of truth for match history
   - Imported directly into League.jsx

2. **Team rosters & player data**: Dynamic from Supabase (`teams_s6` table)
   - Players array stored as JSONB
   - Captain = first player in array
   - Player `auth_id` matches Auth0 `sub`

3. **Standings**: Calculated client-side in `src/utils/calculateStandings.js`
   - NOT stored in database
   - Computed from static match data at runtime
   - Algorithm: 3 pts/win, 1 pt/draw, sorted by points → wins → draws → losses

4. **Statistics**: Fetched from Imprint.gg API via `/api/*` proxies

### Authentication Flow

```
User clicks login → Auth0 login → Auth0Provider stores session →
useAuth() hook generates Supabase JWT (HS256, 1hr expiry) →
Pass custom JWT to getSupabaseClient(token) → Authenticated Supabase queries
```

**Key Files**:
- `src/lib/auth.js` - JWT signing with jose library
- `src/hooks/useAuth.js` - Combines Auth0 + Supabase token generation
- `src/lib/supabase.js` - Client factory (unauthenticated vs authenticated)

### Routing Structure

```
/ → Home
/events → Events
/merch → Merch
/league → Redirects to /league/s6 (current season)
/league/:season → e.g., /league/s6
/league/:season/:divisionOrView → e.g., /league/s6/d1 or /league/s6/register
/league/:season/:divisionOrView/:view → e.g., /league/s6/d1/standings
/imprint → Imprint.gg leaderboard
/contact → Contact
/casters → Hidden admin page (no nav link)
```

**Special Routes**:
- `register` - Team registration form (AddTeamForm)
- `join_team` - Join existing team (JoinTeamForm)
- `lft_form` - Post LFT listing (LFTForm)
- `lft` - View LFT listings
- `teams` - View all teams
- `my_team` - Team management (captain only)

### Multi-Season Architecture

Each season has:
- Separate Supabase table (`teams_s6`, `teams`, `teams_duplicate`)
- Separate match data file (`matchDataSeason6.ts`, `matchDataSeason5.ts`, etc.)
- Separate team name mappings (for Imprint.gg API correlation)

**Current active season**: Season 6 (`s6`)

When working on League.jsx, check the `season` parameter to determine which data sources to use.

### API Proxy Pattern

All `/api/*` endpoints are Vercel serverless functions that proxy to Imprint.gg API:

```
Frontend → /api/leaderboard → api/leaderboard.js → https://api.imprint.gg/league/players
Frontend → /api/teams → api/teams.js → https://api.imprint.gg/league/teams
Frontend → /api/match → api/match.js → https://api.imprint.gg/match
Frontend → /api/hero-statistics → api/hero-statistics.js → https://api.imprint.gg/league/statistics/hero
```

**Why proxied?**
- Hides `VITE_IMPRINT_API_TOKEN` from client
- Handles CORS
- Centralized error handling

**Development**: Vite dev server auto-proxies `/api/*` to Imprint.gg (see vite.config.js)

### Image Storage Strategy

**Current approach**: Local Git repository (`/public/img/teams/`)
- **Previously** used Supabase Storage (now migrated)
- Team logos served from `/img/teams/[team-id].png`
- `image-mapping.json` tracks migration status
- `src/utils/teamImages.js` provides helper functions

**Upload flow**:
1. User uploads image via form → Stored in `pending_image` field
2. Admin manually saves to `/public/img/teams/` and commits to Git
3. Update `image_url` field in database

### Critical Files

**League.jsx** (1314 lines) - Most complex file in codebase:
- Multi-season support (s4, s5, s6)
- Multi-division tabs (1-4)
- Three view modes: Standings, Matches, Team Rosters
- Integrates team registration, join team, LFT forms
- Match detail expansion with Imprint.gg stats
- Team management (captain-only features)
- URL-based state management

When modifying League.jsx:
- State is primarily driven by URL params (season, division, view)
- Navigation helpers: `navigateToSeason()`, `navigateToDivision()`, `navigateToView()`
- Data fetching happens in `useEffect` hooks watching URL params
- Forms are inline within the component (not separate routes)

**Data Types** (`src/types/tournament.ts`):
```typescript
interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  date: string;
  completed: boolean;
  week: number;
  games: { game1: Game, game2: Game, game3?: Game };
  score?: [number, number];
  isByeWeek?: boolean;
  isKnockout?: boolean;
}

interface Game {
  played: boolean;
  winner?: string; // team1Id or team2Id
  dota2MatchId?: string; // Imprint.gg match ID
}
```

**Team Data Structure** (Supabase `teams_s6`):
```javascript
{
  id: UUID,
  name: string,
  division_id: 1 | 2 | 3 | 4,
  captain_name: string,
  players: [
    {
      auth_id: string, // Auth0 sub
      name: string,
      rank: string,
      position: string,
      steamProfile: string,
      dotabuffProfile: string,
      country: string
    }
  ],
  wins: number,
  draws: number,
  losses: number,
  points: number,
  matches_played: number,
  image_url: string,
  pending_image: string
}
```

**Important**: `captain_name` is redundant - first player in `players` array is always the captain.

## Common Workflows

### Adding a New Match (Season 6)

1. Edit `src/data/matchDataSeason6.ts`
2. Add match object to appropriate division array
3. Set `completed: false` initially
4. When match is played, update `games` with winners and `dota2MatchId`
5. Set `completed: true` and add `score` array
6. Commit - standings auto-recalculate on client load

### Adding a New Season

1. Create new Supabase table `teams_s{N}`
2. Create `src/data/matchDataSeason{N}.ts` with division arrays
3. Update `League.jsx`:
   - Add season to URL redirects
   - Add table name mapping in data fetching logic
   - Add team name mapping for Imprint.gg correlation
4. Update default redirect in `App.jsx` routing

### Testing Authentication Flow

1. Start dev server: `npm run dev`
2. Click login (triggers Auth0 Universal Login)
3. Check browser console for `Supabase Token:` log (from useAuth hook)
4. Test authenticated features:
   - Register team (`/league/s6/register`)
   - Edit team roster (`/league/s6/my_team`)
   - Post LFT listing (`/league/s6/lft_form`)

### Debugging API Proxy Issues

**Development** (Vite proxy):
- Check browser Network tab for `/api/*` requests
- Vite rewrites `/api/leaderboard` → `https://api.imprint.gg/league/players`
- Token passed via `X-API-Token` header (from `VITE_IMPRINT_API_TOKEN`)

**Production** (Vercel serverless):
- Check Vercel function logs
- Token pulled from `VITE_IMPRINT_API_TOKEN` environment variable
- CORS headers set in each `api/*.js` file

## Environment Variables

Required in `.env.local` (development) and Vercel settings (production):

```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_SUPABASE_JWT_SECRET=your-jwt-secret  # Used to sign custom JWTs
VITE_AUTH0_DOMAIN=dev-xyz.auth0.com
VITE_AUTH0_CLIENT_ID=abc123...
VITE_IMPRINT_API_TOKEN=imprint_api_token  # For Imprint.gg API
```

**Security Notes**:
- `VITE_*` prefix makes vars available to client bundle
- JWT secret is exposed client-side (acceptable for this use case)
- Imprint API token is server-side only (via proxy functions)

## Code Style & Conventions

- **No TypeScript**: Codebase is primarily JavaScript (except type definitions in `src/types/`)
- **Tailwind classes**: Prefer utility classes over custom CSS
- **Theme colors**:
  - Primary: `#13ec5b` (green)
  - Accent: `#f97316` (orange)
  - Dark mode enforced via `dark` class on `<html>`
- **Hooks over classes**: All components are functional with hooks
- **ESLint**: Allows unused vars matching `^[A-Z_]` pattern (for constants)
- **No prop-types**: Validation handled manually in components

## Deployment

Deployed to Vercel automatically via Git integration:
- `main` branch → Production
- Preview deployments for PRs
- Build command: `npm run build`
- Output directory: `dist/`
- Serverless functions auto-detected in `api/` folder

## Known Quirks

1. **Standings are not stored** - Always calculated from match data at runtime
2. **Captain detection** - First player in `players` array, not `captain_name` field
3. **Bye weeks** - Marked with `isByeWeek: true`, excluded from standings calculations
4. **Knockout matches** - Marked with `isKnockout: true`, excluded from standings
5. **Image uploads** - Require manual Git commit by admin (not automated)
6. **Team names** - Must match between Supabase and `teamNameMapping` in League.jsx for Imprint.gg stats correlation
7. **Division IDs** - Integer 1-4, not strings like "d1"
