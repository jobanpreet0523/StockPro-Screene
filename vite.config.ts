import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default {
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        screener: path.resolve(__dirname, 'screener.html'),
        dashboard: path.resolve(__dirname, 'dashboard.html'),
        fo: path.resolve(__dirname, 'fo.html'),
        privacy: path.resolve(__dirname, 'privacy.html'),
        terms: path.resolve(__dirname, 'terms.html'),
        disclaimer: path.resolve(__dirname, 'disclaimer.html'),
        sebiDisclosure: path.resolve(__dirname, 'sebi-disclosure.html'),
        liveData: path.resolve(__dirname, 'live-data.js')
      }
    }
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
};
