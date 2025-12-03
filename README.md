# Dota 2 Ireland

Community website for the Irish Dota 2 scene. Features events, merchandise, and the Irish Dota League.

## Tech Stack

- React 19
- Vite
- React Router
- Tailwind CSS
- Auth0 (authentication)
- Supabase (database)
- Vercel (hosting)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
  components/   - Reusable UI components
  pages/        - Page components
  hooks/        - Custom React hooks
  lib/          - Utilities (Supabase, Auth)
  services/     - API services
  data/         - Static match data
public/
  img/          - Images and assets
```

## Environment Variables

Create a `.env` file with:

```
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
