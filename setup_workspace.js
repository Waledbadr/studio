const fs = require('fs');
const path = require('path');

const appsAccDir = path.join(__dirname, 'apps', 'accommodation');
if (!fs.existsSync(appsAccDir)) {
  fs.mkdirSync(appsAccDir, { recursive: true });
}

// 1. Move Next.js files and folders
const filesToMove = [
  'src',
  'public',
  'next.config.ts',
  'tailwind.config.ts',
  'tsconfig.json',
  'components.json',
  'postcss.config.mjs',
  'open-next.config.ts',
  'wrangler.json',
  'wrangler.toml',
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'next-env.d.ts'
];

for (const file of filesToMove) {
  const oldPath = path.join(__dirname, file);
  const newPath = path.join(appsAccDir, file);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${file} to apps/accommodation/`);
  }
}

// 2. Create the app's package.json
const rootPkg = require('./package.json');
const appPkg = { ...rootPkg, name: "@estatecare/accommodation" };
fs.writeFileSync(path.join(appsAccDir, 'package.json'), JSON.stringify(appPkg, null, 2));
console.log('Created apps/accommodation/package.json');

// 3. Rewrite Root package.json
const newRootPkg = {
  name: "estatecare-workspace",
  private: true,
  workspaces: [
    "apps/*",
    "packages/*"
  ],
  scripts: {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  devDependencies: {
    "turbo": "latest"
  }
};
fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(newRootPkg, null, 2));
console.log('Updated root package.json for workspaces');

console.log('Migration step 1 complete!');