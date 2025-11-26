import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
