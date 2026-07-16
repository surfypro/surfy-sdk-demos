import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const surfyUpstream = (env.SURFY_BASE_URL || env.VITE_SURFY_BASE_URL || '').replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      port: Number(process.env.PORT ?? 5173),
      strictPort: Boolean(process.env.PORT),
      proxy: {
        // Token mint — secrets stay in demo-server
        '/api/surfy-token': {
          target: process.env.DEMO_SERVER_URL ?? 'http://localhost:8787',
          changeOrigin: true,
        },
        '/api/health': {
          target: process.env.DEMO_SERVER_URL ?? 'http://localhost:8787',
          changeOrigin: true,
        },
        // Optional same-origin Surfy API proxy (when VITE_SURFY_BASE_URL is empty)
        ...(surfyUpstream
          ? {
              '/api/v1': {
                target: surfyUpstream,
                changeOrigin: true,
                secure: env.SURFY_TLS_INSECURE !== '1',
              },
            }
          : {}),
      },
    },
  }
})
