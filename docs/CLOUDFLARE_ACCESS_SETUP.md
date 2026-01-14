# Cloudflare Access Integration Guide

This guide shows a minimal, secure way to protect the EstateCare app with **Cloudflare Access** (Zero Trust). We'll:

- create a Cloudflare Access application
- configure identity provider(s)
- optionally allow service tokens
- verify Access JWTs in a Next.js `middleware` (edge) to allow only authorized requests

---

## Key concepts
- Cloudflare Access acts as an identity gateway in front of your application.
- When enabled with **JWT mode**, Access attaches a JWT to requests (header `cf-access-jwt-assertion`) that you can verify on the origin to get the authenticated user identity.
- You can also protect the app using Access policies (emails, groups) so only those users can reach your app.

---

## Cloudflare setup (high level)
1. In Cloudflare dashboard -> Zero Trust -> Access -> Applications -> **Add an application**.
2. Choose **Self-hosted**.
3. Set the application domain (e.g. `https://app.example.com`) or the origin URL used by your staging environment.
4. Set Polices: allow specific email addresses, groups, or everyone in your organization.
5. Under **Session duration** and **JWT** options, enable JWT (if you plan to verify tokens on the origin). Note the **Aud**/Client ID shown in the application — you'll use it to validate the JWT audience.
6. The Access **JWKS** endpoint is at:

   https://<YOUR_ACCESS_DOMAIN>/cdn-cgi/access/certs

   where `<YOUR_ACCESS_DOMAIN>` is the *Team* domain shown in the Access app or the tenant host (e.g. `acme.cloudflareaccess.com`).

---

## Required environment variables
- `CLOUDFLARE_ACCESS_TEAM_DOMAIN` — e.g., `acme.cloudflareaccess.com` (used for JWKS and issuer)
- `CLOUDFLARE_ACCESS_AUD` — the Access application's `aud`/client id
- `CLOUDFLARE_ACCESS_ALLOWLIST` (optional) — comma-separated emails or groups to allow on origin-side checks

Add them to your `.env`/secrets in production.

---

## Next.js middleware example (what we provide)
We add a `src/middleware.ts` that:
- skips static and public paths
- reads the JWT from `cf-access-jwt-assertion` header or `Authorization: Bearer ...`
- verifies the JWT signature using the JWKS endpoint and ensures `iss` and `aud` match your config
- rejects with 401 when invalid, otherwise continues request and adds `x-access-user-email` header with payload `email` claim

We will add a file `src/middleware.ts` to the repo with example verification using the `jose` library.

---

## Local dev notes
- Cloudflare Access is an edge gateway — to run it locally use `wrangler pages dev` or run smoke tests against a staging deployment URL where Access is enabled.
- You can still run the app local with `NEXT_PUBLIC_USE_D1=true` — the middleware will require valid JWTs only in environments where `CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `CLOUDFLARE_ACCESS_AUD` are set.

---

If you'd like, I can add:
- the `src/middleware.ts` implementation and install `jose`,
- a small integration test that calls the middleware with a test JWT signed using the JWKS (mocked),
- example NGINX / wrangler instructions to forward the Access header in staging.

Tell me which of those you'd like me to implement next.