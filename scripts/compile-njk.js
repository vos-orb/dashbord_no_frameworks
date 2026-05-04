import fs from 'fs';
import path from 'path';
import nunjucks from 'nunjucks';
import { routes } from '../src/routes.js';
import { execSync } from 'child_process';
import { loadEnv } from 'vite';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'development';
// Load env EXACTLY like Vite does
const envVars = loadEnv(mode, ROOT, 'VITE_');
// Optional: merge into process.env if you want
Object.assign(process.env, envVars);

const SRC_ROOT = path.resolve('./src');
const DIST_DIR = path.resolve('./dist');

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader([
    path.join(SRC_ROOT, 'pages'),
    path.join(SRC_ROOT, 'layouts'),
    path.join(SRC_ROOT, 'components')
  ], { noCache: true }),
  { autoescape: true }
);
//TODO TEST seems they are added from vite.config already and no need to di that again here
env.addGlobal('API_URL', process.env.VITE_API_URL);
env.addGlobal('API_TIMEOUT', process.env.VITE_API_TIMEOUT);
env.addGlobal('API_HEADERS', process.env.VITE_API_HEADERS);
env.addGlobal('DEBUG', process.env.VITE_DEBUG);

const themes = [
  { themeName: 'light', styleFile: 'main-light.scss'},
  { themeName: 'prom', styleFile: 'main-prom.scss'}
];
// Get theme from environment or use default
const selectedTheme = process.env.VITE_THEME || 'light';
console.warn('TEST VARIABLE VITE_THEME from env', selectedTheme);
const themeConfig = themes.find(t => t.themeName === selectedTheme) || themes[0];
env.addGlobal('THEME_NAME', themeConfig.themeName);

try {
  console.log('Compiling SCSS to CSS...');
  const themes = [
    { input: 'src/styles/main-light.scss', output: 'dist/assets/css/main-light.css' },
    { input: 'src/styles/main-prom.scss', output: 'dist/assets/css/main-prom.css' }
  ];

  themes.forEach(({ input, output }) => {
    execSync(`sass ${input}:${output} --no-source-map --style=compressed`, { stdio: 'inherit' });
  });
  console.log('✅ SCSS compiled successfully');

} catch (err) {
  console.error('SCSS compilation failed:', err);
  process.exit(1);
}

routes.forEach(route => {
  try {
    const templatePath = route.template.replace(/\\/g, '/');
    console.log('Rendering template:', templatePath);

    const rendered = env.render(templatePath, {
      debug: true,
      title: route.name,
      routes,
      currentPath: route.path,
      year: new Date().getFullYear(),
      asset: (filename) => `/assets/${filename}`
    });

    if (!rendered) throw new Error(`Rendered template is null: ${route.template}`);

    const fileName = route.path === '/' ? 'index.html' : route.path.replace(/^\//, '') + '.html';
    const outPath = path.join(DIST_DIR, fileName);

    fs.writeFileSync(outPath, rendered, 'utf8');
    console.log(`✅ Compiled: ${route.template} → ${fileName}`);
  } catch (err) {
    console.error(`Template render error: ${route.template}`);
    console.error(err);
    process.exit(1);
  }
});

if (!fs.existsSync(path.join(DIST_DIR, 'assets'))) {
  fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });
}

const srcAssets = path.join(SRC_ROOT, 'assets');
if (fs.existsSync(srcAssets)) {
  const files = fs.readdirSync(srcAssets);
  files.forEach(file => {
    if (!file.endsWith('.scss')) {
      const srcPath = path.join(srcAssets, file);
      const destPath = path.join(DIST_DIR, 'assets', file);
      if (fs.lstatSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
}
const JS_TARGET_DIR = path.join(DIST_DIR, 'assets', 'js');

// Ensure the target directory exists
if (!fs.existsSync(JS_TARGET_DIR)) {
  fs.mkdirSync(JS_TARGET_DIR, { recursive: true });
}

const sourceFilesToSync = [
  {
    src: path.join(SRC_ROOT, 'services'),
    dest: path.join(JS_TARGET_DIR, 'services')
  },
  {
    src: path.join(SRC_ROOT, 'routes.js'),
    dest: path.join(JS_TARGET_DIR, 'routes.js')
  },
  // Add this to make sure main.js is also in the right place if it's not already
  {
    src: path.join(SRC_ROOT, 'assets/js/main.js'),
    dest: path.join(JS_TARGET_DIR, 'main.js')
  }
];

sourceFilesToSync.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    const stats = fs.lstatSync(src);

    if (stats.isDirectory()) {
      // If it's a directory (like 'services'), copy it, then patch all JS files inside
      fs.cpSync(src, dest, { recursive: true, force: true });

      const patchDir = (dir) => {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.lstatSync(fullPath).isDirectory()) {
            patchDir(fullPath);
          } else if (file.endsWith('.js')) {
            patchFile(fullPath);
          }
        });
      };
      patchDir(dest);
      console.log(`✅ Synced and Patched Directory: ${path.basename(src)}`);
    } else {
      // If it's a single file (like routes.js or main.js)
      fs.copyFileSync(src, dest);
      if (src.endsWith('.js')) {
        patchFile(dest);
      }
      console.log(`✅ Synced and Patched File: ${path.basename(src)}`);
    }
  } else {
    console.warn(`⚠️ Warning: Source path not found: ${src}`);
  }
});

// Helper function to do the actual string replacement
function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Create the replacement object
  const envObj = JSON.stringify({
    VITE_API_URL: process.env.VITE_API_URL || '',
    VITE_API_TIMEOUT: process.env.VITE_API_TIMEOUT || '',
    VITE_DEBUG: process.env.VITE_DEBUG || 'false',
    VITE_API_URL_2: process.env.VITE_API_URL_2 || '',
    VITE_API_HEADERS: process.env.VITE_API_HEADERS || ''
  });

  if (content.includes('import.meta.env')) {
    content = content.replace(/import\.meta\.env/g, envObj);
    fs.writeFileSync(filePath, content);
  }
}

// ==========================================
// ADD THIS END
// ==========================================




console.log(`All templates compiled in ${mode} mode`);
