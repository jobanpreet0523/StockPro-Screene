import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const configDir = fileURLToPath(new URL('.', import.meta.url));

const analyzePlugins = [];

const asyncApplicationCss: Plugin = {
  name: 'async-application-css',
  enforce: 'post',
  writeBundle(options) {
    const outputDir = options.dir || path.dirname(String(options.file || 'dist/index.html'));
    const htmlPath = path.join(outputDir, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const stylesheet = /<link rel="stylesheet" crossorigin href="(\/assets\/main-[^"]+\.css)">/;
    const match = html.match(stylesheet);
    if (!match) throw new Error('Generated application stylesheet was not found.');
    const asyncLink = `<link rel="stylesheet" crossorigin href="${match[1]}" media="print" onload="this.media='all'">`;
    const fallback = `<noscript><link rel="stylesheet" crossorigin href="${match[1]}"></noscript>`;
    fs.writeFileSync(htmlPath, html.replace(stylesheet, `${asyncLink}${fallback}`));
  },
};

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
    asyncApplicationCss,
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
        worker: path.resolve(configDir, 'src/_worker.js'),
      },
      output: {
        entryFileNames: (chunk) => chunk.name === 'worker' ? '_worker.js' : 'assets/[name]-[hash].js',
      },
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
