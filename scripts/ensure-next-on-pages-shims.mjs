import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeIfMissing(filePath, contents) {
  if (fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, contents, "utf8");
  return true;
}

function safeStat(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function walkDirs(rootDir, predicate, results = []) {
  const st = safeStat(rootDir);
  if (!st || !st.isDirectory()) return results;

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(rootDir, entry.name);
    if (predicate(full)) results.push(full);
    walkDirs(full, predicate, results);
  }
  return results;
}

function walkFiles(rootDir, predicate, results = []) {
  const st = safeStat(rootDir);
  if (!st) return results;

  if (st.isFile()) {
    if (!predicate || predicate(rootDir)) results.push(rootDir);
    return results;
  }

  if (!st.isDirectory()) return results;

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, predicate, results);
    } else if (entry.isFile()) {
      if (!predicate || predicate(full)) results.push(full);
    }
  }
  return results;
}

function patchImportsInFile(filePath) {
  try {
    const src = fs.readFileSync(filePath, "utf8");
    let next = src;

    // Older builds referenced an internal specifier without an extension.
    next = next.replaceAll(
      '"__next-on-pages-dist__/functions/src/async_hooks"',
      '"__next-on-pages-dist__/functions/src/async_hooks.js"'
    );

    // Newer builds can emit a direct Node builtin import which fails in workerd.
    // Patch to our local shim in the same directory.
    next = next
      .replaceAll('"node:async_hooks"', '"./async_hooks.js"')
      .replaceAll("'node:async_hooks'", "'./async_hooks.js'")
      .replaceAll('`node:async_hooks`', '`./async_hooks.js`')
      .replaceAll('"async_hooks"', '"./async_hooks.js"')
      .replaceAll("'async_hooks'", "'./async_hooks.js'")
      .replaceAll("`async_hooks`", "`./async_hooks.js`");

    // Handle dynamic import / require forms if present.
    next = next
      .replaceAll('import("node:async_hooks")', 'import("./async_hooks.js")')
      .replaceAll('import("async_hooks")', 'import("./async_hooks.js")')
      .replaceAll("require('node:async_hooks')", "require('./async_hooks.js')")
      .replaceAll('require("node:async_hooks")', 'require("./async_hooks.js")')
      .replaceAll("require('async_hooks')", "require('./async_hooks.js')")
      .replaceAll('require("async_hooks")', 'require("./async_hooks.js")');

    if (next === src) return false;
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  } catch {
    return false;
  }
}

function patchImportsInDir(dirPath) {
  let patchedAny = false;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".js")) continue;
      const fullPath = path.join(dirPath, entry.name);
      patchedAny = patchImportsInFile(fullPath) || patchedAny;
    }
  } catch {
    // ignore
  }
  return patchedAny;
}

const ASYNC_HOOKS_SHIM = `// Generated shim for Cloudflare Pages dev.
// Provides minimal AsyncLocalStorage used by Next/next-on-pages middleware bundles.

const GlobalALS = globalThis.AsyncLocalStorage;

export const AsyncLocalStorage = GlobalALS ?? class AsyncLocalStorage {
  constructor() {
    this._store = undefined;
  }

  disable() {
    this._store = undefined;
  }

  getStore() {
    return this._store;
  }

  enterWith(store) {
    this._store = store;
  }

  run(store, callback, ...args) {
    const prev = this._store;
    this._store = store;
    try {
      return callback(...args);
    } finally {
      this._store = prev;
    }
  }

  exit(callback, ...args) {
    const prev = this._store;
    this._store = undefined;
    try {
      return callback(...args);
    } finally {
      this._store = prev;
    }
  }

  static bind(fn) {
    return fn;
  }
};
`;

// Typical output location from `npx @cloudflare/next-on-pages`.
const vercelStatic = path.join(projectRoot, ".vercel", "output", "static");

// We patch the *functions* root (not only `functions/src`) because many app routes
// live under `functions/api/**` and `functions/**` and they also import async_hooks.
const candidateFunctionRoots = [];

const primaryFunctionsRoot = path.join(
  projectRoot,
  ".vercel",
  "output",
  "static",
  "__next-on-pages-dist__",
  "functions"
);

if (safeStat(primaryFunctionsRoot)?.isDirectory()) {
  candidateFunctionRoots.push(primaryFunctionsRoot);
}

// Also handle the common nested path `.vercel/output/static/_worker.js/__next-on-pages-dist__/functions`.
if (safeStat(vercelStatic)?.isDirectory()) {
  candidateFunctionRoots.push(
    ...walkDirs(vercelStatic, (dir) => dir.endsWith(path.join("__next-on-pages-dist__", "functions")))
  );
}

// Dedupe
const functionRoots = Array.from(new Set(candidateFunctionRoots));

if (functionRoots.length === 0) {
  console.warn(
    "[ensure-next-on-pages-shims] Could not find __next-on-pages-dist__/functions. " +
      "Did `npx @cloudflare/next-on-pages` run successfully?"
  );
  process.exit(0);
}

let wroteAny = false;
let patchedAny = false;
let scannedAny = false;
const shimDirs = new Set();

for (const functionsRoot of functionRoots) {
  scannedAny = true;

  // Patch all JS bundles under the functions root.
  const jsFiles = walkFiles(functionsRoot, (p) => p.endsWith(".js"));
  for (const filePath of jsFiles) {
    const patched = patchImportsInFile(filePath);
    if (patched) {
      patchedAny = true;
      shimDirs.add(path.dirname(filePath));
    }
  }

  // Always ensure `functions/src` has the shim because middleware imports it.
  const srcDir = path.join(functionsRoot, "src");
  if (safeStat(srcDir)?.isDirectory()) shimDirs.add(srcDir);
}

// Write the shim into every directory where we rewrote imports to `./async_hooks.js`.
for (const dir of shimDirs) {
  ensureDir(dir);

  // Some next-on-pages builds appear to resolve `import "async_hooks"` to an internal
  // module specifier without extension, so we emit both.
  const shimNoExt = path.join(dir, "async_hooks");
  const shimJs = path.join(dir, "async_hooks.js");

  const wrote1 = writeIfMissing(shimNoExt, ASYNC_HOOKS_SHIM);
  const wrote2 = writeIfMissing(shimJs, ASYNC_HOOKS_SHIM);
  wroteAny = wroteAny || wrote1 || wrote2;
}

if (!scannedAny) {
  console.log("[ensure-next-on-pages-shims] No next-on-pages function roots found to scan.");
  process.exit(0);
}

if (patchedAny) {
  console.log("[ensure-next-on-pages-shims] Patched async_hooks imports in next-on-pages bundles.");
} else {
  console.log("[ensure-next-on-pages-shims] No async_hooks imports needed patching.");
}

if (wroteAny) {
  console.log("[ensure-next-on-pages-shims] Wrote async_hooks shim into next-on-pages output.");
} else {
  console.log("[ensure-next-on-pages-shims] async_hooks shim already present in patched directories.");
}
