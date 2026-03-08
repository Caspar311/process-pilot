import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/webhook': {
        target: 'https://n8n.triphaus.online',
        changeOrigin: true,
        secure: true,
      },
      '/webhook-test': {
        target: 'https://n8n.triphaus.online',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
