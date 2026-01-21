import { spawn } from "node:child_process";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

function toWslPath(winPath) {
  // Convert: D:\EstateCare\studio -> /mnt/d/EstateCare/studio
  const m = /^([A-Za-z]):\\(.*)$/.exec(winPath);
  if (!m) {
    return winPath.replaceAll("\\", "/");
  }
  const drive = m[1].toLowerCase();
  const rest = m[2].replaceAll("\\", "/");
  return `/mnt/${drive}/${rest}`;
}

function safeRm(relPath) {
  try {
    fs.rmSync(path.join(process.cwd(), relPath), { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function run(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      ...options,
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

const isWindows = process.platform === "win32";

if (!isWindows) {
  const code = await run("npm", ["run", "dev:d1:linux"]);
  process.exit(code);
}

// Windows: @cloudflare/next-on-pages uses bash and is unreliable natively.
// Run inside WSL, but pre-clean generated dirs on Windows first to avoid EACCES issues on /mnt/*.
safeRm(".next");
safeRm(path.join(".vercel", "output"));

const cwdWin = process.cwd();
const cwdWsl = toWslPath(cwdWin);

// Run inside WSL so @cloudflare/next-on-pages (bash-based) can cd successfully.
// Note: assumes Node/npm are available in WSL.
const bashCommand = `cd ${cwdWsl} && npm run dev:d1:linux`;

const code = await run("wsl.exe", ["bash", "-lc", bashCommand]);
process.exit(code);
