import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

function copyExtensionAssets(): Plugin {
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
    },
  };
}

export default defineConfig({
  plugins: [vue(), copyExtensionAssets()],
  publicDir: 'public',
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        hudEntry: resolve(rootDir, 'src/content/hudEntry.ts'),
        popup: resolve(rootDir, 'src/popup/popup.html'),
        serviceWorker: resolve(rootDir, 'src/background/serviceWorker.ts'),
        contentScript: resolve(rootDir, 'src/content/contentScript.ts'),
        codexParser: resolve(rootDir, 'src/content/codexParserEntry.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'serviceWorker') {
            return 'background/serviceWorker.js';
          }

          if (chunkInfo.name === 'contentScript') {
            return 'content/contentScript.js';
          }

          if (chunkInfo.name === 'hudEntry') {
            return 'content/hudEntry.js';
          }

          if (chunkInfo.name === 'codexParser') {
            return 'content/codexParser.js';
          }

          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
