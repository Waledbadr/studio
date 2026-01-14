# Deployment Guide (Cloudflare D1 + Pages)

This document lists the recommended steps to deploy EstateCare using Cloudflare Pages / D1 and the project's environment expectations.

Important env variables
- NEXT_PUBLIC_USE_D1=true (enables D1-backed mode where applicable)
- CLOUDFLARE_ACCOUNT_ID: Cloudflare account id (required for Wrangler/CI).
- CLOUDFLARE_D1_TOKEN: API token with D1 access (store securely in CI / Cloudflare dashboard).
- JWT_PRIVATE_KEY / JWT_PUBLIC_KEY (or JWT_SECRET) — required for RS256 JWT auth in production.
- STORAGE_PATH: local filesystem path where uploads are stored (e.g., /var/estatecare/storage). Ensure the runtime supports persistent writable storage at this path. If your deployment target doesn't provide writable local storage (e.g., Cloudflare Pages), use an external blob store instead.

Secrets: store all sensitive secrets in your deployment platform's secret store (GitHub Actions secrets, Render/Firebase/Cloudflare dashboard, etc.). Do NOT commit private keys or tokens to the repository.

Wrangler configuration
1. Add your Cloudflare account id to `wrangler.toml` (account_id field).
2. Ensure `[[d1_databases]]` entry points to the correct `database_id` and `database_name`.
3. If using GitHub Actions, add secrets:
   - CLOUDFLARE_ACCOUNT_ID
   - CLOUDFLARE_D1_TOKEN
   - JWT_PRIVATE_KEY / JWT_PUBLIC_KEY
   - STORAGE_PATH (optional)

CI / Deploy steps (recommended)
1. Ensure the repository has the required secrets set in CI (see above).
2. In CI, build the Next.js app (`npm run build`) and run tests (`npm test`).
3. Run a health check against the preview deployment or a staging environment:
   - GET `https://<your-deploy-host>/api/health` → expect { "ok": true, "d1": "connected" }
4. Run migrations for D1 (if any) using `drizzle` or `drizzle-kit`.
5. Publish via Wrangler or your preferred flow (e.g., `wrangler publish`), or use the Pages deploy workflow if using Cloudflare Pages.

Runbook / Post-deploy checks
- Verify environment variables are present in the target environment.
- Check `/api/health` for D1 connectivity.
- Confirm file uploads work and files are served via `/api/files/...` (if using local storage, confirm storage path is writable and health checks for storage pass).
- Check logs for any errors during startup.

Rollback
- Keep a backup of important data before migrating Firestore data to D1.
- If deploy introduces regressions, revert to prior tag and investigate migration logs.

Notes & Caveats
- Cloudflare Pages does not provide writable persistent local storage; `STORAGE_PATH` is intended for environments that do (e.g., dedicated VMs, containers, or platforms that mount a volume). If you need persistent blob storage on Cloudflare, use R2 or an external storage service and adapt `src/lib/storage.ts` accordingly.
- If your deployment uses Cloudflare Access or Workers, ensure the `JWT_PUBLIC_KEY` is installed where verification needs to run.

Contact
For help with a production rollout or D1 migrations, open an issue or contact the maintainer listed in README.md.