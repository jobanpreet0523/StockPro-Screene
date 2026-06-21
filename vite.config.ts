import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflareVitePlugin } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    cloudflareVitePlugin({
      platformProxy: {
        enabled: true,
      },
    }),
  ],
  base: '/',  // Critical: Ensures assets load from root
  build: {
    outDir: 'dist',
    sourcemap: true,  // Helps with debugging
  },
  server: {
    port: 3000,
    hmr: true,
  },
  worker: {
    format: 'es',
  },
});
