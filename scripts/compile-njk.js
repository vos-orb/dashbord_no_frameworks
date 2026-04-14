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
  { themeName: 'dark', styleFile: 'main-dark.scss'},
  { themeName: 'ocean', styleFile: 'mian-ocean.scss'},
  { themeName: 'prom', styleFile: 'mian-ocean.scss'}
];
// Get theme from environment or use default
const selectedTheme = process.env.VITE_THEME || 'light';
console.warn('TEST VARIABLE VITE_THEME from env', selectedTheme);
const themeConfig = themes.find(t => t.themeName === selectedTheme) || themes[0];
env.addGlobal('THEME_NAME', themeConfig.themeName);

// Compile SCSS to CSS
try {
  console.log('Compiling SCSS to CSS...');
  execSync('sass src/styles:dist/assets/css --no-source-map --style=compressed', { stdio: 'inherit' });
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

// Copy assets with path fixes
if (!fs.existsSync(path.join(DIST_DIR, 'assets'))) {
  fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });
}

const srcAssets = path.join(SRC_ROOT, 'assets');
if (fs.existsSync(srcAssets)) {
  // Copy all assets except SCSS files (already compiled)
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

  // Fix SCSS import paths in main.js
  const mainJsPath = path.join(DIST_DIR, 'assets/js/main.js');
  if (fs.existsSync(mainJsPath)) {
    let content = fs.readFileSync(mainJsPath, 'utf8');
    content = content.replace(
      /import ['"]\/src\/styles/g,
      'import \'@/styles'
    );
    fs.writeFileSync(mainJsPath, content);
  }
}

console.log(`All templates compiled in ${mode} mode`);
