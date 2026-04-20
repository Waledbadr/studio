const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'packages', 'ui');
const uiSrcDir = path.join(uiDir, 'src');
const uiCompDir = path.join(uiSrcDir, 'components', 'ui');
const uiLibDir = path.join(uiSrcDir, 'lib');
const accUiDir = path.join(__dirname, 'apps', 'accommodation', 'src', 'components', 'ui');
const accLibDir = path.join(__dirname, 'apps', 'accommodation', 'src', 'lib');

[uiSrcDir, uiCompDir, uiLibDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 1. Setup packages/ui/package.json
const uiPkg = {
  name: "@estatecare/ui",
  version: "0.0.0",
  main: "./src/index.ts",
  types: "./src/index.ts",
  exports: {
    "./*": "./src/components/ui/*.tsx",
    "./lib/*": "./src/lib/*.ts"
  },
  dependencies: {
    "clsx": "latest",
    "tailwind-merge": "latest"
  },
  peerDependencies: {
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0",
    "next": "^14.0.0 || ^15.0.0"
  }
};
fs.writeFileSync(path.join(uiDir, 'package.json'), JSON.stringify(uiPkg, null, 2));

// 2. Setup packages/ui/tsconfig.json
const uiTsConfig = {
  extends: "../../apps/accommodation/tsconfig.json",
  compilerOptions: {
    baseUrl: ".",
    paths: {
      "@estatecare/ui/*": ["./src/*"]
    }
  },
  include: ["src"]
};
fs.writeFileSync(path.join(uiDir, 'tsconfig.json'), JSON.stringify(uiTsConfig, null, 2));

// 3. Move UI components
if (fs.existsSync(accUiDir)) {
  fs.cpSync(accUiDir, uiCompDir, { recursive: true });
  fs.rmSync(accUiDir, { recursive: true, force: true });
  console.log('Moved UI components to packages/ui');
}

// 4. Copy utility to UI
const accUtils = path.join(accLibDir, 'utils.ts');
const uiUtils = path.join(uiLibDir, 'utils.ts');
if (fs.existsSync(accUtils)) {
  // We copy it so apps can still use it, but UI also needs it.
  fs.copyFileSync(accUtils, uiUtils);
  console.log('Copied utils.ts to packages/ui');
}

// 5. Update apps/accommodation/package.json to depend on @estatecare/ui
const accPkgPath = path.join(__dirname, 'apps', 'accommodation', 'package.json');
const accPkg = JSON.parse(fs.readFileSync(accPkgPath, 'utf8'));
if (!accPkg.dependencies) accPkg.dependencies = {};
accPkg.dependencies["@estatecare/ui"] = "*";
fs.writeFileSync(accPkgPath, JSON.stringify(accPkg, null, 2));

// 6. Update Tailwind config in accommodation to scan packages/ui
const twConfigPath = path.join(__dirname, 'apps', 'accommodation', 'tailwind.config.ts');
if (fs.existsSync(twConfigPath)) {
  let twContent = fs.readFileSync(twConfigPath, 'utf8');
  if (!twContent.includes('../../packages/ui/src/')) {
    twContent = twContent.replace(
      /content:\s*\[/,
      "content: [\n    \"../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}\","
    );
    fs.writeFileSync(twConfigPath, twContent);
    console.log('Updated tailwind.config.ts');
  }
}

// 7. Find and replace imports in apps/accommodation
function replaceImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceImports(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const original = content;
      
      // Replace components/ui imports
      content = content.replace(/@\/components\/ui/g, '@estatecare/ui');
      
      // In the moved UI files, we need to fix local internal paths. Actually, since we 
      // replace them inside apps/, the UI components themselves were already moved to package.
      // So they might still contain @/lib/utils. We will just update them in uiDir too.
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

console.log('Rewriting imports in apps/accommodation...');
replaceImports(path.join(__dirname, 'apps', 'accommodation', 'src'));

// Now fix internal imports INSIDE packages/ui
function fixUiImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixUiImports(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const original = content;
      // replace @/lib/utils with ../../lib/utils or relative (since they are in src/components/ui)
      content = content.replace(/@\/lib\/utils/g, '../../lib/utils');
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

console.log('Fixing internal imports in packages/ui...');
fixUiImports(uiCompDir);

console.log('UI Package extraction complete!');