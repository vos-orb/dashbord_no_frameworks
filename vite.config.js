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
        // Pass .env vars to Nunjucks templates
        nunjucksEnvironment: (envNunjucks) => {
          envNunjucks.addGlobal('API_URL', env.VITE_API_URL);
          envNunjucks.addGlobal('API_TIMEOUT', env.VITE_API_TIMEOUT);
          envNunjucks.addGlobal('API_HEADERS', env.VITE_API_HEADERS);
          envNunjucks.addGlobal('DEBUG', env.VITE_DEBUG);
          Object.keys(env).forEach(key => {
            if (key.startsWith('VITE_')) {
              envNunjucks.addGlobal(key, env[key]);
            }
          });
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
          additionalData: `@use '${path.resolve(__dirname, 'src/styles/variables')}' as *; @use '${path.resolve(__dirname, 'src/styles/_shared')}' as *;`,
          api: 'modern-compiler'
        }
      },
      devSourcemap: true
    },
    optimizeDeps: {
      exclude: ['**/*.scss']
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
