import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DB_NAME = process.env.D1_DB_NAME || "estatecare";
const INPUT_SQL = process.env.SEED_SQL_PATH || path.resolve("migration_data.sql");

const CHUNK_DIR = path.resolve(".wrangler", "tmp", "seed-chunks");
const MAX_CHUNK_CHARS = Number(process.env.SEED_MAX_CHUNK_CHARS || 50_000);

function run(command, args) {
  const isWin = process.platform === "win32";

  // On Windows, spawning .cmd shims can be unreliable depending on PATH resolution.
  // Running through cmd.exe ensures consistent behavior.
  if (isWin) {
    const quote = (s) => {
      if (s === "") return '""';
      if (!/[\s"]/g.test(s)) return s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const full = [command, ...args].map(quote).join(" ");
    const result = spawnSync("cmd.exe", ["/d", "/s", "/c", full], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error(`${full} failed with code ${result.status}`);
    }
    return;
  }

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with code ${result.status}`);
  }
}

function ensureCleanDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

function splitSqlIntoChunksByLine(sqlText, maxChars) {
  const lines = sqlText.split(/\r?\n/);
  const chunks = [];
  let buffer = "";

  const flush = () => {
    const trimmed = buffer.trim();
    if (trimmed.length === 0) return;
    chunks.push(buffer.endsWith("\n") ? buffer : buffer + "\n");
    buffer = "";
  };

  for (const line of lines) {
    buffer += line + "\n";

    // Only flush on statement boundary to reduce chances of breaking SQL.
    // This is intentionally simple; our seed file is expected to have one statement per line or
    // at least end statements with ';' on a line.
    if (buffer.length >= maxChars && line.trim().endsWith(";")) {
      flush();
    }
  }

  flush();
  return chunks;
}

function main() {
  if (!fs.existsSync(INPUT_SQL)) {
    console.error(`Seed SQL not found: ${INPUT_SQL}`);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(INPUT_SQL, "utf8");
  ensureCleanDir(CHUNK_DIR);

  const chunks = splitSqlIntoChunksByLine(sqlText, MAX_CHUNK_CHARS);
  if (chunks.length === 0) {
    console.log("No SQL to apply.");
    return;
  }

  console.log(`Seeding local D1 '${DB_NAME}' from ${path.relative(process.cwd(), INPUT_SQL)}`);
  console.log(`Chunks: ${chunks.length} (max ~${MAX_CHUNK_CHARS} chars, boundary = line ending with ';')`);

  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = path.join(CHUNK_DIR, `seed-${String(i + 1).padStart(4, "0")}.sql`);
    fs.writeFileSync(chunkPath, chunks[i], "utf8");

    console.log(`\n==> Applying chunk ${i + 1}/${chunks.length}: ${path.relative(process.cwd(), chunkPath)}`);
    run("npx", [
      "wrangler",
      "d1",
      "execute",
      DB_NAME,
      "--local",
      "--yes",
      "--file",
      chunkPath,
    ]);
  }

  console.log("\nSeed complete. Verifying row counts...");
  const verifyPath = path.join(CHUNK_DIR, "verify-counts.sql");
  fs.writeFileSync(
    verifyPath,
    [
      "SELECT 'residences' AS t, COUNT(*) AS c FROM residences;",
      "SELECT 'workers' AS t, COUNT(*) AS c FROM workers;",
      "SELECT 'occupants' AS t, COUNT(*) AS c FROM occupants;",
      "SELECT 'inventory' AS t, COUNT(*) AS c FROM inventory;",
      "",
    ].join("\n"),
    "utf8",
  );
  run("npx", ["wrangler", "d1", "execute", DB_NAME, "--local", "--file", verifyPath]);
}

main();
