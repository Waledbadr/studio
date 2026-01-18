# Deployment Guide (Cloudflare Pages + D1 + R2)

This document provides comprehensive instructions for deploying EstateCare to Cloudflare Pages with D1 database and R2 storage.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Cloudflare Pages Setup](#cloudflare-pages-setup)
- [Environment Variables](#environment-variables)
- [Database & Storage Bindings](#database--storage-bindings)
- [Build & Deploy](#build--deploy)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Required:**
- Cloudflare account with Pages, D1, and R2 enabled
- Node.js 18+ installed locally
- Git repository connected to Cloudflare Pages
- Wrangler CLI installed (`npm install -g wrangler`)

---

## Cloudflare Pages Setup

### 1. Create Cloudflare Pages Project

1. Navigate to **Cloudflare Dashboard** → **Pages**
2. Click **"Create a project"**
3. Connect your Git repository (GitHub/GitLab)
4. Select repository: `estatecare-studio`

### 2. Configure Build Settings

**Framework preset:** `Next.js`

**Build configuration:**
```bash
Build command:    npx @cloudflare/next-on-pages
Build output:     .vercel/output/static
Root directory:   /
Node version:     18
```

**Environment variables (Build time):**
```bash
NODE_VERSION=18
NEXT_PUBLIC_USE_D1=true
```

> ⚠️ **Important:** The build command `npx @cloudflare/next-on-pages` is defined in `package.json` line 9 as the `deploy` script.

---

## Environment Variables

### Required Environment Variables (Production)

Add these in **Cloudflare Dashboard** → **Pages** → **Settings** → **Environment Variables**:

#### JWT Authentication (Required)
```bash
JWT_PRIVATE_KEY=your-secret-key-min-32-chars-long-for-hs256
JWT_ISSUER=estatecare.production
JWT_AUD=estatecare-client
```

**Generation commands:**
```bash
# Generate a secure 64-character secret key
openssl rand -base64 48

# Alternative: use Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

#### Optional JWT Settings
```bash
JWT_ACCESS_EXPIRES=15m        # Access token lifetime (default: 15m)
JWT_REFRESH_EXPIRES=30d       # Refresh token lifetime (default: 30d)
BCRYPT_ROUNDS=10              # Password hashing rounds (default: 10)
```

#### Cloudflare Access (Optional)
If using Cloudflare Access for SSO:
```bash
CLOUDFLARE_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
CLOUDFLARE_ACCESS_AUD=your-access-aud-tag
```

#### CI/CD Secrets (for GitHub Actions/Wrangler)
Store these as **GitHub Secrets** or **Cloudflare API Tokens**:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token-with-pages-d1-r2-permissions
```

---

## Database & Storage Bindings

### D1 Database Binding Configuration

#### 1. Create D1 Database
```bash
# Create the database
wrangler d1 create estatecare-d1

# Copy the database_id from output
```

#### 2. Update `wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"                              # ← Binding name (REQUIRED)
database_name = "estatecare-d1"             # ← Database name
database_id = "your-d1-database-id"         # ← From wrangler d1 create
migrations_dir = "drizzle/migrations"       # ← Migrations folder
```

#### 3. Run Database Migrations
```bash
# Generate migration files (if schema changed)
npx drizzle-kit generate:sqlite

# Apply migrations to D1
wrangler d1 migrations apply estatecare-d1 --remote
```

#### 4. Configure Pages Binding
In **Cloudflare Dashboard** → **Pages** → **Settings** → **Functions**:

**D1 Database Binding:**
- **Variable name:** `DB` (must match `wrangler.toml`)
- **D1 database:** `estatecare-d1`

✅ **Verification checklist:**
- [ ] D1 database created with `wrangler d1 create`
- [ ] `database_id` updated in `wrangler.toml`
- [ ] Migrations applied with `wrangler d1 migrations apply`
- [ ] Binding `DB` → `estatecare-d1` configured in Pages dashboard
- [ ] Binding name matches code: `env.DB` in `src/lib/d1-actions.ts`

---

### R2 Storage Binding Configuration

#### 1. Create R2 Bucket
```bash
# Create the bucket
wrangler r2 bucket create estatecare-storage

# Verify creation
wrangler r2 bucket list
```

#### 2. Update `wrangler.toml`
```toml
[[r2_buckets]]
binding = "STORAGE_BUCKET"                  # ← Binding name (REQUIRED)
bucket_name = "estatecare-storage"          # ← Bucket name
```

#### 3. Configure Pages Binding
In **Cloudflare Dashboard** → **Pages** → **Settings** → **Functions**:

**R2 Bucket Binding:**
- **Variable name:** `STORAGE_BUCKET` (must match `wrangler.toml`)
- **R2 bucket:** `estatecare-storage`

✅ **Verification checklist:**
- [ ] R2 bucket created with `wrangler r2 bucket create`
- [ ] Binding `STORAGE_BUCKET` → `estatecare-storage` configured in Pages dashboard
- [ ] Binding name matches code: `env.STORAGE_BUCKET` in `src/lib/storage.ts`

---

## Build & Deploy

### Local Build Test (Recommended)
```bash
# Install dependencies
npm install

# Test build locally
npx @cloudflare/next-on-pages

# Verify output directory
ls -la .vercel/output/static
```

### Manual Deployment via Wrangler
```bash
# Build for Cloudflare Pages
npx @cloudflare/next-on-pages

# Deploy to production
npx wrangler pages deploy .vercel/output/static \
  --project-name estatecare-studio \
  --branch main

# Deploy to preview
npx wrangler pages deploy .vercel/output/static \
  --project-name estatecare-studio \
  --branch preview
```

### Automatic Deployment (Git Push)
Cloudflare Pages automatically deploys on:
- **Production:** Push to `main` branch
- **Preview:** Push to any other branch or PR

---

## Post-Deployment Verification

### 1. Health Check
```bash
# Check API health endpoint
curl https://your-pages-project.pages.dev/api/health

# Expected response:
{
  "ok": true,
  "timestamp": "2026-01-19T...",
  "d1": "connected"
}
```

### 2. Authentication Test
```bash
# Test login endpoint
curl -X POST https://your-pages-project.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@estatecare.com","password":"admin123"}'

# Expected: JWT tokens returned
```

### 3. D1 Database Verification
```bash
# Query D1 directly via Wrangler
wrangler d1 execute estatecare-d1 \
  --command "SELECT COUNT(*) as count FROM users"

# Check via dashboard: Cloudflare → D1 → estatecare-d1 → Console
```

### 4. R2 Storage Verification
```bash
# List R2 bucket objects
wrangler r2 object list estatecare-storage

# Test upload via app (if UI available)
# Or use Cloudflare Dashboard → R2 → estatecare-storage
```

---

## Troubleshooting

### Common 500 Errors

#### Error: "D1 binding missing" or "env.DB is undefined"
**Symptoms:** API routes return 500, logs show "D1 binding missing"

**Solutions:**
1. ✅ Verify D1 binding in Pages dashboard:
   ```
   Pages → Settings → Functions → D1 Database Bindings
   Variable name: DB
   D1 database: estatecare-d1
   ```
2. ✅ Check `wrangler.toml` binding name matches:
   ```toml
   [[d1_databases]]
   binding = "DB"  # ← Must be "DB"
   ```
3. ✅ Redeploy after adding binding (bindings require redeploy)

#### Error: "STORAGE_BUCKET is undefined"
**Symptoms:** File uploads fail, storage operations return errors

**Solutions:**
1. ✅ Verify R2 binding in Pages dashboard:
   ```
   Pages → Settings → Functions → R2 Bucket Bindings
   Variable name: STORAGE_BUCKET
   R2 bucket: estatecare-storage
   ```
2. ✅ Check bucket exists: `wrangler r2 bucket list`
3. ✅ Redeploy after adding binding

#### Error: "JWT verification failed" or "Invalid token"
**Symptoms:** Login works but subsequent requests fail with 401

**Solutions:**
1. ✅ Verify environment variables are set:
   ```
   Pages → Settings → Environment Variables
   JWT_PRIVATE_KEY = [set]
   JWT_ISSUER = [set]
   JWT_AUD = [set]
   ```
2. ✅ Ensure same secret is used for signing and verifying
3. ✅ Check token expiration settings (default: 15m for access tokens)
4. ✅ Verify middleware is reading cookies correctly (already defensive)

#### Error: "getRequestContext() is not available"
**Symptoms:** Runtime errors about missing context, especially in server actions

**Solutions:**
1. ✅ Ensure using Cloudflare Pages adapter (not Vercel/Node.js)
2. ✅ Verify build command uses `@cloudflare/next-on-pages`
3. ✅ Check all D1 actions receive `env` parameter (fixed in recent updates)
4. ✅ Review `src/lib/runtime-env.ts` for proper context handling

#### Build Failures
**Symptoms:** Build fails with "Module not found" or TypeScript errors

**Solutions:**
1. ✅ Run `npm install` to ensure dependencies are installed
2. ✅ Check Node.js version: `node --version` (must be 18+)
3. ✅ Verify `@cloudflare/next-on-pages` is in dependencies
4. ✅ Run local build test: `npx @cloudflare/next-on-pages`
5. ✅ Check TypeScript errors: `npm run typecheck`

---

### Log Inspection

#### Cloudflare Dashboard Logs
1. Navigate to **Pages** → **[Your Project]** → **Deployments**
2. Click on deployment → **Functions** tab → **Real-time logs**
3. Enable logging: **Settings** → **Functions** → **Enable logging**

#### Wrangler Tail (Real-time logs)
```bash
# Tail production logs
wrangler pages deployment tail --project-name estatecare-studio

# Tail specific deployment
wrangler pages deployment tail \
  --project-name estatecare-studio \
  --deployment-id <deployment-id>

# Filter for errors only
wrangler pages deployment tail \
  --project-name estatecare-studio \
  --status error
```

#### Common Log Patterns to Search For
```bash
# D1 connection issues
grep -i "d1.*error\|binding.*missing"

# JWT auth failures
grep -i "jwt.*failed\|unauthorized\|token.*invalid"

# Storage errors
grep -i "storage.*error\|r2.*failed\|bucket.*missing"

# getRequestContext errors
grep -i "context.*not.*available\|getRequestContext"
```

---

### Performance Issues

#### Slow API Responses
**Solutions:**
1. ✅ Check D1 query performance in dashboard
2. ✅ Add indexes to frequently queried columns
3. ✅ Use `drizzle-orm` query optimization
4. ✅ Enable caching where appropriate

#### Cold Starts
**Note:** Cloudflare Pages Functions have minimal cold start time compared to traditional serverless. If experiencing issues:
1. ✅ Minimize bundle size (check `.vercel/output/static` size)
2. ✅ Use dynamic imports for large dependencies
3. ✅ Consider using Workers for critical paths

---

## Additional Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **D1 Documentation:** https://developers.cloudflare.com/d1/
- **R2 Documentation:** https://developers.cloudflare.com/r2/
- **Next.js on Cloudflare:** https://github.com/cloudflare/next-on-pages

---

## Rollback Procedure

### Quick Rollback
```bash
# List recent deployments
wrangler pages deployment list --project-name estatecare-studio

# Rollback to previous deployment
wrangler pages deployment rollback <deployment-id> \
  --project-name estatecare-studio
```

### Via Dashboard
1. **Pages** → **[Your Project]** → **Deployments**
2. Find previous successful deployment
3. Click **"Rollback to this deployment"**

### Database Rollback (D1)
⚠️ **Warning:** D1 migrations cannot be automatically rolled back.

**Best practice:**
1. Always backup data before major migrations
2. Test migrations in preview environment first
3. Keep migration rollback SQL scripts ready
4. Use `drizzle-kit` to generate down migrations

---

## Support & Contact

For production deployment assistance:
- Open an issue on GitHub repository
- Review logs with patterns above
- Check Cloudflare community forums
- Contact maintainer (see README.md)

**Remember:** Always test in preview environment before production deployment!