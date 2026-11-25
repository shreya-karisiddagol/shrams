import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getBackendPort() {
  if (process.env.VITE_BACKEND_PORT) return process.env.VITE_BACKEND_PORT
  if (process.env.PORT) return process.env.PORT
  try {
    const envPath = path.resolve(__dirname, '../backend/.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      const match = content.match(/^PORT\s*=\s*(\d+)/m)
      if (match) return match[1]
    }
  } catch (_) {}
  return 5000
}

const BACKEND_PORT = getBackendPort()

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['@heroicons/react'],
        }
      }
    }
  }
})
