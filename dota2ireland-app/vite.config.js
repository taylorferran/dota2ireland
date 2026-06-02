import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'auth': ['@auth0/auth0-react'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://v2.api.imprint.gg',
        changeOrigin: true,
        rewrite: (path) => {
          const [pathname, queryString] = path.split('?');
          const params = new URLSearchParams(queryString);

          if (pathname === '/api/match') {
            return `/match/${params.get('match_id')}`;
          }
          if (pathname === '/api/leaderboard') {
            return `/league/${params.get('league_id')}/players`;
          }
          if (pathname === '/api/hero-statistics') {
            return `/league/${params.get('league_id')}/heroes`;
          }
          if (pathname === '/api/teams') {
            return `/league/${params.get('league_id')}/teams`;
          }
          if (pathname === '/api/league-matches') {
            return `/league/${params.get('league_id')}/matches`;
          }
          return path.replace(/^\/api/, '');
        }
      }
    }
  }
})
