# Cloudflare Pages Deployment Guide

## Overview
This application uses Cloudflare D1 (SQLite) as the primary database. When deploying to Cloudflare Pages, you must explicitly link the D1 database binding to your Pages project.

## Prerequisites
- Cloudflare account with Pages enabled
- Cloudflare D1 database created (should already exist: `estatecare`)
- Wrangler CLI installed locally (`npm i -g @cloudflare/wrangler`)

## Step-by-Step Deployment

### 1. Verify D1 Database Exists
```bash
# List all D1 databases in your account
npx wrangler d1 list

# Look for "estatecare" in the output
# If not found, create it:
npx wrangler d1 create estatecare
```

### 2. Get Your Database ID
From the output above, note the **database_id**. It should match the one in `wrangler.toml`:
```
database_id = "df5d6fab-efb5-4b09-b3a0-be536d7edaaf"
```

### 3. Build the Application
```bash
npm run build:pages
```

This will:
- Build Next.js application
- Run `@cloudflare/next-on-pages` to process the build
- Generate `.vercel/output/static` directory

### 4. Deploy to Pages
```bash
npm run deploy
```

Or manually:
```bash
npx wrangler pages deploy .vercel/output/static --project-name estatecare-studio
```

### 5. Link D1 Database in Cloudflare Dashboard

**Method A: Via Cloudflare Dashboard (Recommended)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **estatecare-studio**
3. Go to **Settings** → **Functions** → **D1 Bindings**
4. Click **Add Bindings**
5. Create a binding with:
   - **Variable name**: `DB`
   - **Database**: Select `estatecare` from the dropdown
6. Click **Deploy** (if it asks) or the binding will apply to future deployments

**Method B: Via Wrangler CLI**

Create a `wrangler.json` file in your project root:

```json
{
  "pages_build_output_dir": ".vercel/output/static",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "estatecare",
      "database_id": "df5d6fab-efb5-4b09-b3a0-be536d7edaaf"
    }
  ]
}
```

Then deploy:
```bash
npx wrangler pages deploy .vercel/output/static --project-name estatecare-studio
```

### 6. Verify Deployment
1. Visit your Pages URL: `https://studio-6r5.pages.dev/`
2. Login (or register if it's the first time)
3. Navigate to any section (e.g., Residences, Accommodation, Inventory)
4. Check the browser console for success messages:
   - ✅ `[D1 Poll] Starting initial sync and poll`
   - ✅ `[D1 Sync] Sync complete`

## Troubleshooting

### Error: "Backend is not configured. Please ensure D1 bindings are available"

**Cause**: The D1 binding is not linked to your Pages project.

**Solution**:
1. Go to Cloudflare Dashboard
2. Select **Pages** → **estatecare-studio**
3. Go to **Settings** → **Functions** → **D1 Bindings**
4. Verify that a binding named `DB` is linked to the `estatecare` database
5. If not present, click **Add Bindings** and configure it (see Step 5 above)
6. Wait 1-2 minutes and refresh your deployed site

### Console warnings: "[Dashboard] DB not available" or "[Capacity Warning] Residence..."

**Cause**: The database queries are timing out or D1 is still syncing.

**Solution**:
- These are usually temporary and resolve within 1-2 minutes
- Check that the D1 binding exists in Settings > Functions > D1 Bindings
- If persistent, check Cloudflare Status page for any outages

### API returns HTTP 503: "D1 binding not available"

**Cause**: The `/api/d1` route can't access the D1 binding.

**Solution**:
1. Verify the binding exists in the Pages project settings
2. Ensure the binding variable name is exactly `DB` (case-sensitive)
3. Check that your D1 database is not in a paused state:
   ```bash
   npx wrangler d1 info estatecare
   ```
4. Redeploy the Pages project to force binding refresh:
   ```bash
   npm run deploy
   ```

## Environment Variables

The following environment variables are automatically available in the Edge runtime via D1:

- `DB` - The D1 database binding (no configuration needed if linked via dashboard)

No additional env vars need to be set for D1 to work once the binding is configured.

## Authentication

The app uses JWT-based authentication. You can set these optional environment variables in Pages Settings:

- `JWT_PRIVATE_KEY` - For signing JWTs (optional; app generates a default)
- `JWT_ISSUER` - Issuer claim (default: `estatecare.local`)
- `JWT_AUD` - Audience claim (default: `estatecare-client`)

Or use Cloudflare Access (requires `CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `CLOUDFLARE_ACCESS_AUD`).

## Local Development with D1

For local development with full D1 integration:

```bash
npm run dev:d1
```

This uses Wrangler's Pages dev mode which provides local D1 bindings.

## Production Checklist

- [ ] D1 database `estatecare` exists
- [ ] Database ID is correct in `wrangler.toml`
- [ ] D1 binding `DB` is linked in Pages Settings
- [ ] Build succeeds: `npm run build:pages`
- [ ] Deployment succeeds: `npm run deploy`
- [ ] Login page works
- [ ] Can see data in Residences/Accommodation sections
- [ ] No "Backend not configured" errors
- [ ] Console shows D1 sync success messages

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare D1 with Next.js](https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/)
- [Next-on-Pages Documentation](https://github.com/cloudflare/next-on-pages)

## Support

If you continue to experience issues:

1. Check the console in your browser's Developer Tools (F12)
2. Check Cloudflare Dashboard > Pages > estatecare-studio > Analytics for error logs
3. Verify wrangler.toml has the correct database_id
4. Try redeploying: `npm run deploy`
