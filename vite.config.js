import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The React app is no longer the site root — it builds to music.html and is
// served at /music (vercel.json sets cleanUrls). The root landing page and the
// other standalone pages are plain HTML under public/.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { music: 'music.html' },
    },
  },
})
