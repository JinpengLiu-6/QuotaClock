import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

function extensionBuildGuard(): Plugin {
  const assets = [['src/manifest.json', 'dist/manifest.json']] satisfies Array<
    [string, string]
  >;

  return {
    name: 'copy-extension-assets',
    apply: 'build',
    closeBundle() {
      for (const [from, to] of assets) {
        const target = resolve(rootDir, to);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(resolve(rootDir, from), target);
      }

      const generatedPopup = resolve(rootDir, 'dist/src/popup/popup.html');
      if (existsSync(generatedPopup)) {
        copyFileSync(generatedPopup, resolve(rootDir, 'dist/popup.html'));
        rmSync(resolve(rootDir, 'dist/src'), { recursive: true, force: true });
      }

      const contentScript = resolve(rootDir, 'dist/content/contentScript.js');
      const contentScriptCode = readFileSync(contentScript, 'utf8');

      if (/\bimport\s*(?:\(|[\s{*])/.test(contentScriptCode)) {
        throw new Error('contentScript.js must not contain import syntax. Chrome content scripts are classic scripts.');
      }
    },
  };
}

export default defineConfig({
  plugins: [vue(), extensionBuildGuard()],
  publicDir: 'public',
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(rootDir, 'src/popup/popup.html'),
        serviceWorker: resolve(rootDir, 'src/background/serviceWorker.ts'),
        contentScript: resolve(rootDir, 'src/content/contentScript.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'serviceWorker') {
            return 'background/serviceWorker.js';
          }

          if (chunkInfo.name === 'contentScript') {
            return 'content/contentScript.js';
          }

          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
