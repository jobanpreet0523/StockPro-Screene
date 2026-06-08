import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        screener: 'screener.html',
        dashboard: 'dashboard.html',
        fo: 'fo.html',
      }
    }
  }
})
