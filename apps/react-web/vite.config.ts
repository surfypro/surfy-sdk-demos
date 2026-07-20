import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const demoServer = process.env.DEMO_SERVER_URL ?? 'http://localhost:8787'

/**
 * Browser hits same origin. Only real API endpoints are proxied to demo-server —
 * SPA routes live under `/api/...` and `/oauth/...` and must NOT be proxied.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: Boolean(process.env.PORT),
    proxy: {
      '/api/session': { target: demoServer, changeOrigin: true },
      '/api/health': { target: demoServer, changeOrigin: true },
      '/api/surfy-token': { target: demoServer, changeOrigin: true },
      '/api/v1': { target: demoServer, changeOrigin: true },
    },
  },
})
