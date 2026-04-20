const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const appsDir = path.join(rootDir, 'apps');
const accAppDir = path.join(appsDir, 'accommodation');
const matAppDir = path.join(appsDir, 'materials');
const tsAppDir = path.join(appsDir, 'timesheet');

// 1. Helper: Deep copy directory
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    if (['node_modules', '.next', '.open-next', '.turbo'].includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('1. Copying apps...');
copyDirSync(accAppDir, matAppDir);
copyDirSync(accAppDir, tsAppDir);

// 2. Helper: Update app configs
function configureApp(appDir, appName, workerName) {
  // Update package.json
  const pkgPath = path.join(appDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = `@estatecare/${appName}`;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  // Update open-next.config.ts name
  const openNextConfigPath = path.join(appDir, 'open-next.config.ts');
  if (fs.existsSync(openNextConfigPath)) {
    let content = fs.readFileSync(openNextConfigPath, 'utf8');
    // Regex slightly flexible
    content = content.replace(/name:\s*["'][^"']+["']/g, `name: "${workerName}"`);
    fs.writeFileSync(openNextConfigPath, content);
  }

  // Update wrangler.json name
  const wranglerJsonPath = path.join(appDir, 'wrangler.json');
  if (fs.existsSync(wranglerJsonPath)) {
    let content = JSON.parse(fs.readFileSync(wranglerJsonPath, 'utf8'));
    content.name = workerName;
    fs.writeFileSync(wranglerJsonPath, JSON.stringify(content, null, 2));
  }
}

console.log('2. Configuring apps (names & Cloudflare settings)...');
configureApp(matAppDir, 'materials', 'estatecare-materials');
configureApp(tsAppDir, 'timesheet', 'estatecare-timesheet');
// Also ensure accommodation has a clean worker name
configureApp(accAppDir, 'accommodation', 'estatecare-accommodation');

// 3. Helper: Delete folder safely
function deleteDirSafe(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(` -> Deleted: ${path.relative(rootDir, dirPath)}`);
  }
}

console.log('3. Cleaning up unrelated pages (App Routes) to achieve MICRO-FRONTEND sizes...');

// Clean Accommodation App
console.log('Cleaning Accommodation...');
deleteDirSafe(path.join(accAppDir, 'src', 'app', 'inventory'));
deleteDirSafe(path.join(accAppDir, 'src', 'app', 'timesheet'));
deleteDirSafe(path.join(accAppDir, 'src', 'app', 'maintenance'));

// Clean Materials App
console.log('Cleaning Materials...');
deleteDirSafe(path.join(matAppDir, 'src', 'app', 'accommodation'));
deleteDirSafe(path.join(matAppDir, 'src', 'app', 'timesheet'));
deleteDirSafe(path.join(matAppDir, 'src', 'app', 'maintenance'));
deleteDirSafe(path.join(matAppDir, 'src', 'app', 'residences'));

// Clean Timesheet App
console.log('Cleaning Timesheet...');
deleteDirSafe(path.join(tsAppDir, 'src', 'app', 'accommodation'));
deleteDirSafe(path.join(tsAppDir, 'src', 'app', 'inventory'));
deleteDirSafe(path.join(tsAppDir, 'src', 'app', 'maintenance'));
deleteDirSafe(path.join(tsAppDir, 'src', 'app', 'residences'));
deleteDirSafe(path.join(tsAppDir, 'src', 'app', 'users'));

console.log('+++ Migration & Cleanup Complete! +++');