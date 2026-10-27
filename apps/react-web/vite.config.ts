import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const demoServer = process.env.DEMO_SERVER_URL ?? 'http://localhost:8787'
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const sdkPackageDir = path.resolve(rootDir, '../../packages/surfy-sdk')

/**
 * Prebuilt `@surfy/surfy-sdk` entries cannot Fast Refresh — HMR re-executes the
 * module while `window.__THREE__` stays set. Full reload keeps a clean graph.
 */
function surfySdkFullReload(): Plugin {
  return {
    name: 'surfy-sdk-full-reload',
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(sdkPackageDir)) {
        return
      }
      server.ws.send({ type: 'full-reload', path: '*' })
      return []
    },
  }
}

/**
 * Browser hits same origin. Only real API endpoints are proxied to demo-server —
 * SPA routes are `/:section` (e.g. `/floor-2d`) and must NOT be proxied.
 */
export default defineConfig({
  plugins: [react(), surfySdkFullReload()],
  resolve: {
    dedupe: ['three', 'react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['three'],
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: Boolean(process.env.PORT),
    proxy: {
      '/api/session': { target: demoServer, changeOrigin: true },
      '/api/health': { target: demoServer, changeOrigin: true },
      '/api/surfy-token': { target: demoServer, changeOrigin: true },
      '/proxy': { target: demoServer, changeOrigin: true },
    },
  },
})
