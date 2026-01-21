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
      .replaceAll('"async_hooks"', '"./async_hooks.js"')
      .replaceAll("'async_hooks'", "'./async_hooks.js'")
      .replaceAll("`async_hooks`", "`./async_hooks.js`");

    // Handle dynamic import / require forms if present.
    next = next
      .replaceAll('import("async_hooks")', 'import("./async_hooks.js")')
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
const primaryOut = path.join(
  projectRoot,
  ".vercel",
  "output",
  "static",
  "__next-on-pages-dist__",
  "functions",
  "src"
);

// If the primary location doesn't exist, try finding any copied/generated location.
const candidateDirs = [];
if (safeStat(primaryOut)?.isDirectory()) {
  candidateDirs.push(primaryOut);
} else {
  const vercelStatic = path.join(projectRoot, ".vercel", "output", "static");
  candidateDirs.push(
    ...walkDirs(vercelStatic, (dir) => dir.endsWith(path.join("__next-on-pages-dist__", "functions", "src")))
  );
}

if (candidateDirs.length === 0) {
  console.warn(
    "[ensure-next-on-pages-shims] Could not find __next-on-pages-dist__/functions/src. " +
      "Did `npx @cloudflare/next-on-pages` run successfully?"
  );
  process.exit(0);
}

let wroteAny = false;
let patchedAny = false;
for (const dir of candidateDirs) {
  ensureDir(dir);

  // Some next-on-pages builds appear to resolve `import \"async_hooks\"` to an internal
  // module specifier without extension, so we emit both.
  const shimNoExt = path.join(dir, "async_hooks");
  const shimJs = path.join(dir, "async_hooks.js");

  const wrote1 = writeIfMissing(shimNoExt, ASYNC_HOOKS_SHIM);
  const wrote2 = writeIfMissing(shimJs, ASYNC_HOOKS_SHIM);

  wroteAny = wroteAny || wrote1 || wrote2;

  // Patch generated bundles to import the explicit .js shim.
  // (We patch all JS files in the folder because the emitted specifier varies by version.)
  patchedAny = patchImportsInDir(dir) || patchedAny;
}

if (wroteAny) {
  console.log("[ensure-next-on-pages-shims] Wrote async_hooks shim into next-on-pages output.");
} else {
  console.log("[ensure-next-on-pages-shims] async_hooks shim already present.");
}

if (patchedAny) {
  console.log("[ensure-next-on-pages-shims] Patched middleware async_hooks import to use .js extension.");
}
