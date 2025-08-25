/* Keep-alive pinger for Render */
const TARGET_URL = 'https://estatecare.onrender.com/';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const TIMEOUT_MS = 10_000; // 10 seconds

async function pingWithFetch() {
  const started = Date.now();
  const now = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(TARGET_URL, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'KeepAliveBot/1.0' },
    });
    console.log(`[${now}] GET ${TARGET_URL} -> ${res.status} ${res.statusText} in ${Date.now() - started}ms`);
  } catch (err) {
    console.error(`[${now}] Error: ${err?.name || 'Error'} - ${err?.message || err}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function pingWithHttps() {
  const now = new Date().toISOString();
  const started = Date.now();
  const { request } = await import('node:https');
  const url = new URL(TARGET_URL);
  await new Promise((resolve) => {
    const req = request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        headers: { 'User-Agent': 'KeepAliveBot/1.0' },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const { statusCode = 0, statusMessage = '' } = res;
        // Drain data to allow socket reuse
        res.on('data', () => {});
        res.on('end', () => {
          console.log(
            `[${now}] GET ${TARGET_URL} -> ${statusCode} ${statusMessage} in ${Date.now() - started}ms`,
          );
          resolve();
        });
      },
    );

    req.on('timeout', () => {
      console.error(`[${now}] Error: Timeout after ${TIMEOUT_MS}ms`);
      req.destroy(new Error('Request timeout'));
      resolve();
    });

    req.on('error', (err) => {
      console.error(`[${now}] Error: ${err?.name || 'Error'} - ${err?.message || err}`);
      resolve();
    });

    req.end();
  });
}

async function ping() {
  if (typeof fetch === 'function') {
    await pingWithFetch();
  } else {
    await pingWithHttps();
  }
}

process.on('unhandledRejection', (e) =>
  console.error(`[${new Date().toISOString()}] UnhandledRejection:`, e),
);
process.on('uncaughtException', (e) =>
  console.error(`[${new Date().toISOString()}] UncaughtException:`, e),
);

console.log(
  `[${new Date().toISOString()}] Keep-alive started. Ping every ${INTERVAL_MS / 60000} minutes.`,
);
ping(); // run immediately
setInterval(ping, INTERVAL_MS);
