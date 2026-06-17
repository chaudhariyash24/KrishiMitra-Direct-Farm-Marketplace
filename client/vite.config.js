import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getServerPort() {
  try {
    const portFile = path.resolve(__dirname, '..', '.active_port');
    return parseInt(fs.readFileSync(portFile, 'utf-8').trim()) || 8000;
  } catch {
    return 8000;
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${getServerPort()}`,
        changeOrigin: true,
      },
    },
  },
})
