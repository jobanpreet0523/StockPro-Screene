import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

const configDir = fileURLToPath(new URL('.', import.meta.url));

const analyzePlugins = [];

if (process.env.ANALYZE_BUNDLE === 'true') {
  try {
    const { visualizer } = await import('rollup-plugin-visualizer');
    analyzePlugins.push(visualizer({ filename: 'dist/bundle-report.html', template: 'treemap', gzipSize: true, brotliSize: true }));
  } catch {
    console.warn('Bundle analysis skipped: rollup-plugin-visualizer is not installed.');
  }
}

export default {
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    ...analyzePlugins,
  ],
  resolve: {
    alias: {
      '@': path.resolve(configDir, '.'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(configDir, 'index.html'),
      }
    }
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      }
    }
  },
};
