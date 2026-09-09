/**
 * 打包预备脚本：
 * 1. 将 backend/dist + node_modules(production) 复制到 desktop/build/server/
 * 2. 将 frontend/dist 复制到 desktop/build/web/
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');
const buildDir = path.join(__dirname, '..', 'build');

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

console.log('📦 Preparing desktop build...');

// Clean
rmrf(buildDir);

// 1. Server: copy backend/dist
const serverDir = path.join(buildDir, 'server');
const distSrc = path.join(backendDir, 'dist');
if (!fs.existsSync(distSrc)) {
  console.error('❌ backend/dist not found. Run `npm run build` in backend first.');
  process.exit(1);
}
copyDir(distSrc, serverDir);

// Copy backend package.json for production deps
const pkgJson = JSON.parse(fs.readFileSync(path.join(backendDir, 'package.json'), 'utf-8'));
// Move tsconfig-paths to dependencies (needed at runtime for @ alias resolution)
// npm will ignore it in dependencies if it also exists in devDependencies
delete pkgJson.devDependencies['tsconfig-paths'];
pkgJson.dependencies['tsconfig-paths'] = '^4.2.0';
fs.writeFileSync(path.join(serverDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

// Copy tsconfig.json with corrected paths for compiled output
// In dist, files are at root level (not in src/), so @/* must map to ./*
const tsconfigSrc = path.join(backendDir, 'tsconfig.json');
if (fs.existsSync(tsconfigSrc)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigSrc, 'utf-8'));
  tsconfig.compilerOptions.baseUrl = '.';
  tsconfig.compilerOptions.paths = { '@/*': ['./*'] };
  fs.writeFileSync(path.join(serverDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
}

// Copy env config for production runtime
const envDev = path.join(backendDir, '.env.development');
const envProd = path.join(backendDir, '.env.production');
const envSrc = fs.existsSync(envProd) ? envProd : envDev;
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, path.join(serverDir, '.env.production'));
}

// Install production deps in server dir
console.log('📦 Installing production dependencies...');
execSync('npm install --omit=dev', { cwd: serverDir, stdio: 'inherit' });

// Copy uploads directory if exists
const uploadsSrc = path.join(backendDir, 'uploads');
if (fs.existsSync(uploadsSrc)) {
  copyDir(uploadsSrc, path.join(serverDir, '..', 'uploads'));
}

// 2. Web: copy frontend/dist
const webSrc = path.join(frontendDir, 'dist');
if (!fs.existsSync(webSrc)) {
  console.error('❌ frontend/dist not found. Run `npm run build` in frontend first.');
  process.exit(1);
}
copyDir(webSrc, path.join(buildDir, 'web'));

console.log('✅ Desktop build prepared at desktop/build/');
