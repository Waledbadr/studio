import { spawn } from "node:child_process";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

function toWslPath(winPath) {
  const m = /^([A-Za-z]):\\(.*)$/.exec(winPath);
  if (!m) return winPath.replaceAll("\\", "/");
  return `/mnt/${m[1].toLowerCase()}/${m[2].replaceAll("\\", "/")}`;
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

function spawnProc(cmd, args, options = {}) {
  return spawn(cmd, args, {
    stdio: "inherit",
    ...options,
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const isWindows = process.platform === "win32";
const cwd = process.cwd();
const cwdWsl = isWindows ? toWslPath(cwd) : cwd;
const staticOutput = path.join(cwd, ".vercel", "output", "static");
const workerEntrypoint = path.join(staticOutput, "_worker.js");
const backendPort = "8788";

async function ensurePagesOutput() {
  if (fs.existsSync(workerEntrypoint)) {
    console.log("[dev:d1:fast] Reusing existing .vercel/output/static build.");
    return;
  }

  console.log("[dev:d1:fast] Pages output not found. Building once...");
  const buildCmd = "npm run pages:build && node scripts/ensure-next-on-pages-shims.mjs";

  if (isWindows) {
    const wslCheck = await run("wsl.exe", ["--status"], { stdio: "ignore" });
    if (wslCheck !== 0) {
      console.error("[dev:d1:fast] WSL is required on Windows. Install WSL and retry.");
      process.exit(1);
    }

    const cwdWsl = toWslPath(cwd);
    const code = await run("wsl.exe", ["bash", "-lc", `cd '${cwdWsl}' && ${buildCmd}`]);
    if (code !== 0) process.exit(code);
    return;
  }

  const code = await run("bash", ["-lc", buildCmd]);
  if (code !== 0) process.exit(code);
}

function startBackend() {
  const backendCmd = `npx wrangler@4.78.0 pages dev .vercel/output/static --port ${backendPort}`;
  if (isWindows) {
    return spawnProc("wsl.exe", ["bash", "-lc", `cd '${cwdWsl}' && ${backendCmd}`]);
  }
  return spawnProc("bash", ["-lc", backendCmd]);
}

function startFrontend() {
  const env = {
    ...process.env,
    SKIP_CLOUDFLARE_SETUP: "true",
    DEV_API_PROXY_ORIGIN: `http://127.0.0.1:${backendPort}`,
  };

  if (isWindows) {
    const bashCmd = `cd '${cwdWsl}' && SKIP_CLOUDFLARE_SETUP=true DEV_API_PROXY_ORIGIN=http://127.0.0.1:${backendPort} npm run dev`;
    return spawnProc("wsl.exe", ["bash", "-lc", bashCmd], { env });
  }

  return spawnProc("npm", ["run", "dev"], { env });
}

await ensurePagesOutput();

console.log(`[dev:d1:fast] Starting Cloudflare backend on :${backendPort} (remote D1 still active)...`);
const backend = startBackend();

await sleep(2500);

console.log("[dev:d1:fast] Starting Next.js frontend with HMR...");
const frontend = startFrontend();

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (!frontend.killed) frontend.kill(signal);
  } catch {}
  try {
    if (!backend.killed) backend.kill(signal);
  } catch {}
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

backend.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`[dev:d1:fast] Backend stopped (code ${code ?? 1}).`);
    shutdown("SIGTERM");
  }
});

frontend.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`[dev:d1:fast] Frontend stopped (code ${code ?? 1}).`);
    shutdown("SIGTERM");
  }
});
