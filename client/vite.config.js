import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE ? visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true }) : null,
  ].filter(Boolean),
  server: {
    proxy: {
      '/api': 'http://localhost:4007',
      '/images': 'http://localhost:4007',
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
