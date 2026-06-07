import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // חובה כדי שהדפדפן ימצא את הקבצים בשרת
  server: {
    proxy: {
      '/api': {
        target: 'https://task-4559.onrender.com', // הכתובת של האתר שלך ב-Render
        changeOrigin: true,
        secure: true,
      }
    }
  }
})