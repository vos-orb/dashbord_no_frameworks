import { defineConfig } from 'vite';
import viteNunjucks from 'vite-plugin-nunjucks';
import path from 'path';
import fs from 'fs';

const DIST_DIR = path.resolve('./dist');
const ASSETS_DIR = path.resolve(DIST_DIR, 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

export default defineConfig({
  root: 'dist',
  publicDir: path.resolve('./src/assets'),

  plugins: [
    viteNunjucks({
      templateDirs: [
        path.resolve(__dirname, 'src/pages'),
        path.resolve(__dirname, 'src/layouts'),
        path.resolve(__dirname, 'src/components')
      ]
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use 'variables' as *;`
      }
    }
  },

  build: {
    outDir: '../dist_build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'dist/index.html'),
        about: path.resolve(__dirname, 'dist/about.html')
      }
    }
  },

  server: {
    port: 3001,
    fs: {
      strict: false,
      allow: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'dist')
      ]
    }
  }
});
