/// <reference types="vitest/config" />
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * swAssetManifest — after build, writes sw-assets.json with all
 * production asset paths so the Service Worker can precache them.
 */
function swAssetManifest() {
  let outDir;
  return {
    name: 'sw-asset-manifest',
    configResolved(config) {
      outDir = config.build?.outDir ?? 'dist';
    },
    closeBundle() {
      const dist = path.resolve(__dirname, outDir);
      if (!fs.existsSync(dist)) return;
      const files = [];
      function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push('/' + path.relative(dist, full).replace(/\\/g, '/'));
        }
      }
      walk(dist);
      const webAssets = files.filter(a =>
        /\.(js|css|html|json|png|svg|ico|webp)$/i.test(a) &&
        !a.endsWith('sw-assets.json') &&
        !a.includes('/stats.html')
      );
      fs.writeFileSync(
        path.join(dist, 'sw-assets.json'),
        JSON.stringify(webAssets, null, 2)
      );
      console.log(`[sw-manifest] ${webAssets.length} assets written to sw-assets.json`);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
  },
  resolve: {
    alias: {
      // jsmediatags → ReactNativeFileReader.js importa react-native-fs
      // Shim vacío para build browser (S98)
      'react-native-fs': path.resolve(__dirname, 'src/shims/react-native-fs.js'),
    },
  },
  plugins: [
    swAssetManifest(),
    react(), // build-bust-2026-05-19
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      title: 'El Búnker — Bundle Analysis',
    }),
  ],
  define: {
    __BUNKER_SW_VERSION__: JSON.stringify(
      `${new Date().toISOString().slice(0,10)}-${Date.now()}`
    ),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
        },
      },
    },
  },
})
