import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import viteNunjucks from 'vite-plugin-nunjucks';

export default defineConfig(({ mode }) => {
  // Load env variables for the current mode
  // The third argument '' ensures all VITE_ variables are loaded
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: 'dist',
    publicDir: path.resolve('./src/assets'),
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(env.VITE_API_TIMEOUT),
      'import.meta.env.VITE_API_HEADERS': JSON.stringify(env.VITE_API_HEADERS),
      'import.meta.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG)
    },
    plugins: [
      viteNunjucks({
        templateDirs: [
          path.resolve(__dirname, 'src/pages'),
          path.resolve(__dirname, 'src/layouts'),
          path.resolve(__dirname, 'src/components')
        ],
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
          additionalData: `
            @use "sass:color";
            @import "@/styles/_variables.scss";
            @import "@/styles/_shared.scss";
          `,
          api: 'modern-compiler'
        }
      },
      devSourcemap: true
    },
    optimizeDeps: {
      include: ['@/styles/main.scss'],
      exclude: []
    },
    build: {
      outDir: '../dist_build',
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        input: {
          balance: path.resolve(__dirname, 'dist/balance.html'),
          analysis: path.resolve(__dirname, 'dist/analysis.html'),
          tradingHistory: path.resolve(__dirname, 'dist/trading-history.html'),
          currentPositions: path.resolve(__dirname, 'dist/current-positions.html'),
          designSystem: path.resolve(__dirname, 'dist/design-system.html')
        },
        output: {
          assetFileNames: 'assets/[name]-[hash].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },

    server: {
      port: 3001,
      fs: {
        strict: true,
        allow: [
          path.resolve(__dirname, 'dist'),
          path.resolve(__dirname, 'src')
        ]
      },
      hmr: {
        overlay: true
      }
    }
  };
});
