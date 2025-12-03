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
    proxy: {
      '/api': {
        target: 'https://api.imprint.gg',
        changeOrigin: true,
        rewrite: (path) => {
          const rewrites = {
            '/api/leaderboard': '/league/players',
            '/api/hero-statistics': '/league/statistics/hero',
            '/api/teams': '/league/teams',
            '/api/match': '/match',
          };
          return rewrites[path] || path.replace(/^\/api/, '');
        }
      }
    }
  }
})
