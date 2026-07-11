import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
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
