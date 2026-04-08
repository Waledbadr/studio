# Cloudflare Deployment Guide

This project can be deployed to Cloudflare Workers using OpenNext and Wrangler.

## Required setup

1. Copy example env files:
   - `.env.cloudflare.example` → `.env.cloudflare`
   - `.dev.vars.example` → `.dev.vars`

2. Fill in required values:
   - `AUTH_JWT_SECRET`
   - `GEMINI_API_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CF_API_TOKEN`

   The current Cloudflare account already has:
   - D1 database name: `estatecare`
   - R2 bucket name: `estatecare-storage`

3. Ensure `wrangler.jsonc` bindings match:
   - D1 binding: `D1` (database name `estatecare`)
   - R2 bucket binding: `R2_BUCKET` (bucket name `estatecare-storage`)

## Local development

Run:

```bash
npm run cf:dev
```

This starts the OpenNext development server with Cloudflare Workers compatibility.

## Build and deploy

- Build for Cloudflare:

```bash
npm run cf:build
```

- Deploy to Cloudflare:

```bash
npm run cf:deploy
```

## Automatic Cloudflare resource creation

The repository includes a helper script to create the Cloudflare resources:

```bash
node scripts/cf-setup.mjs
```

This script uses `wrangler` and requires the following environment variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CF_API_TOKEN`

After running the script, verify that the project bindings in `wrangler.jsonc` match the created resources.

## Notes

- `.env.cloudflare.example` is a template only. Do not commit secrets.
- `.dev.vars.example` is a template for local Wrangler variable overrides.
- `.dev.vars` is ignored by Git through `.gitignore`.
- The Cloudflare worker uses R2 for uploads and D1 for the database bindings.
