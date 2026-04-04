import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import viteNunjucks from 'vite-plugin-nunjucks';

export default defineConfig(({ mode }) => {
  // Load env variables for the current mode
  // The third argument '' ensures all VITE_ variables are loaded
  const env = loadEnv(mode, process.cwd(), '');

  console.log('FULL ENV:', env); // DEBUG: check what Vite actually loads
  console.log('CWD:', process.cwd());

  return {
    root: 'dist',
    publicDir: path.resolve('./src/assets'),
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    },
    plugins: [
      viteNunjucks({
        templateDirs: [
          path.resolve(__dirname, 'src/pages'),
          path.resolve(__dirname, 'src/layouts'),
          path.resolve(__dirname, 'src/components')
        ],
        // Pass API_URL to Nunjucks templates
        nunjucksEnvironment: (envNunjucks) => {
          envNunjucks.addGlobal('API_URL', env.VITE_API_URL);
        }
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
      },
      devSourcemap: true
    },

    build: {
      outDir: '../dist_build',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'dist/index.html'),
          about: path.resolve(__dirname, 'dist/about.html')
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
        strict: false,
        allow: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'dist')
        ]
      }
    }
  };
});
