import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import viteNunjucks from 'vite-plugin-nunjucks';
// vite.config.js - with custom HMR plugin for Nunjucks
import fs from 'fs';
import nunjucks from 'nunjucks';
import { routes } from './src/routes.js';

// Custom plugin to watch and trigger HMR for Nunjucks templates
function nunjucksHmrPlugin() {
  const templateDirs = [
    path.resolve(__dirname, 'src/pages'),
    path.resolve(__dirname, 'src/layouts'),
    path.resolve(__dirname, 'src/components')
  ];

  // Setup nunjucks environment (same as compile-njk.js)
  const nunjucksEnv = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(templateDirs, { noCache: true }),
    { autoescape: true }
  );

  // Function to re-compile all templates
  function recompileTemplates() {
    console.log('[Nunjucks HMR] Re-compiling templates...');
    routes.forEach(route => {
      try {
        const templatePath = route.template.replace(/\\/g, '/');
        const rendered = nunjucksEnv.render(templatePath, {
          title: route.name,
          routes,
          currentPath: route.path,
          year: new Date().getFullYear(),
          asset: (filename) => `/assets/${filename}`
        });

        const fileName = route.path === '/' ? 'index.html' : route.path.replace(/^\//, '') + '.html';
        const outPath = path.resolve(__dirname, 'dist', fileName);
        fs.writeFileSync(outPath, rendered, 'utf8');
        console.log(`[Nunjucks HMR] Updated: ${fileName}`);
      } catch (err) {
        console.error(`[Nunjucks HMR] Error compiling ${route.template}:`, err.message);
      }
    });
  }

  return {
    name: 'nunjucks-hmr',
    configureServer(server) {
      // Initial compile on startup
      recompileTemplates();

      // Watch template directories for changes
      templateDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          server.watcher.add(dir);

          const handleChange = (filePath) => {
            if (filePath.endsWith('.njk')) {
              console.log(`[Nunjucks HMR] Template changed: ${filePath}`);
              // Re-compile templates first
              recompileTemplates();
              // Then trigger browser reload
              server.ws.send('full-reload', '*');
            }
          };

          server.watcher.on('change', handleChange);
          server.watcher.on('add', handleChange);
        }
      });
    }
  };
}
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  console.log('FULL ENV:', env);
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
        ext: '.njk',
        compileOptions: {
          cache: false
        },
        nunjucksEnvironment: (envNunjucks) => {
          envNunjucks.addGlobal('API_URL', env.VITE_API_URL);
          envNunjucks.addGlobal('API_TIMEOUT', env.VITE_API_TIMEOUT);
          envNunjucks.addGlobal('API_HEADERS', env.VITE_API_HEADERS);
          envNunjucks.addGlobal('DEBUG', env.VITE_DEBUG);
        }
      }),
      nunjucksHmrPlugin()
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
