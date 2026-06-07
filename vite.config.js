import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // זה קריטי! זה גורם ל-index.html לחפש קבצים בתיקייה של עצמו
  server: {
    proxy: {
      '/api': {
        target: 'https://task-4559.onrender.com',
        changeOrigin: true,
      }
    }
  }
})