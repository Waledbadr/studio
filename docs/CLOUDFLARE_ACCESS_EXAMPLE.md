# Example: Verifying Cloudflare Access JWT in Next.js middleware

This file shows a minimal approach (already added to `src/middleware.ts`) but here's the explanation and how to configure it.

1. Set environment variables:
   - `CLOUDFLARE_ACCESS_TEAM_DOMAIN` (e.g., `acme.cloudflareaccess.com`)
   - `CLOUDFLARE_ACCESS_AUD` — the Access app client id / audience

2. How the middleware works:
   - Skips public/static paths.
   - Reads token from header `cf-access-jwt-assertion` or `Authorization: Bearer ...`.
   - Uses `jose` to fetch the JWKS from `https://<TEAM>/cdn-cgi/access/certs` and verifies `iss`/`aud`.
   - On success, adds `x-access-user-email` and `x-access-user-sub` headers forwarded to the origin.

3. Notes & hardening:
   - Cache JWKS response where appropriate to reduce network overhead.
   - Optionally validate additional claims (groups, email_verified) as required.
   - If Access is fronting your site normally, requests without JWT should be blocked at Cloudflare edge; middleware verification provides defense in-depth and lets you run diagnostics in staging.

4. Local testing:
   - Run smoke tests against a staging deployment behind Access (CI or manual staging) — see `docs/D1_SMOKE_TESTS.md` for how.

If you want, I can also:
- Add a small unit test that mocks JWKS and verifies middleware logic, or
- Add caching for the JWKS to avoid remote fetch on every request.