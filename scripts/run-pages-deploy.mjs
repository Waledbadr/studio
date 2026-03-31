import { spawn } from "node:child_process";
import process from "node:process";

function toWslPath(winPath) {
  const m = /^([A-Za-z]):\\(.*)$/.exec(winPath);
  if (!m) return winPath.replaceAll("\\", "/");
  const drive = m[1].toLowerCase();
  const rest = m[2].replaceAll("\\", "/");
  return `/mnt/${drive}/${rest}`;
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
  const code = await run("npm", ["run", "deploy:linux"]);
  process.exit(code);
}

const wslCheck = await run("wsl.exe", ["--status"], { stdio: "ignore" });
if (wslCheck !== 0) {
  console.error("WSL is required for npm run deploy on Windows.");
  console.error("Install WSL, then run: wsl --install");
  process.exit(1);
}

const cwdWsl = toWslPath(process.cwd());
const bashCommand = `cd '${cwdWsl}' && npm run deploy:linux`;
const code = await run("wsl.exe", ["bash", "-lc", bashCommand]);

if (code !== 0) {
  console.error("Deployment failed in WSL mode. Ensure Node/npm are installed inside WSL.");
}

process.exit(code);
