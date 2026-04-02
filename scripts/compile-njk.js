import fs from 'fs';
import path from 'path';
import nunjucks from 'nunjucks';
import { routes } from '../src/routes.js';

const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'development';

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

routes.forEach(route => {
  try {
    const templatePath = route.template.replace(/\\/g, '/');
    console.log('Rendering template:', templatePath);

    const rendered = env.render(templatePath, {
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
  fs.cpSync(srcAssets, path.join(DIST_DIR, 'assets'), { recursive: true });

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
