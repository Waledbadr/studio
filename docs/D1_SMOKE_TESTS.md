# D1 Smoke Tests (CI)

Purpose:
- Provide a small set of smoke tests that exercise the D1-backed server actions (RPC `/api/d1`). These are run in CI only when a staging deployment is available.

How it works:
- CI runs the test suite by default (unit + integration tests).
- If the repository defines the secret `D1_SMOKE_BASE` (a full URL pointing to a staging deployment), the workflow will run the smoke tests against that base URL.

Required secrets (for CI):
- `D1_SMOKE_BASE` — the base URL of a staging deployment that has Cloudflare D1 bound and reachable by CI (e.g., `https://staging.example.com`).
- `D1_SMOKE_TOKEN` (optional) — a bearer token to send with smoke requests if your staging endpoint is protected. The tests will set `Authorization: Bearer $D1_SMOKE_TOKEN` when provided.

Local run (with token):

   RUN_D1_SMOKE=true D1_SMOKE_BASE=http://localhost:9002 D1_SMOKE_TOKEN=yourtoken npm run test:smoke

How to run smoke tests locally:
1. Start a dev server that has a D1 binding, e.g. locally using `wrangler pages dev` and a proper binding or use a deployed staging URL.
2. Run:

   RUN_D1_SMOKE=true D1_SMOKE_BASE=http://localhost:9002 npm run test:smoke

Notes & caveats:
- The smoke tests are intentionally small and assert high-level behavior only (e.g., `createMRV`, `getServiceOrders`).
- For end-to-end coverage of concurrency / race conditions, run additional tests against a dedicated staging environment with realistic data.
- Ensure the staging endpoint accepts requests from CI (auth / firewall) or provide an auth mechanism if needed.
