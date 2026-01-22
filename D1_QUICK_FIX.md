# EstateCare D1 Setup - Quick Reference Card

## The Problem
App shows: `Backend is not configured. Please ensure D1 bindings are linked...`

## The Solution (3 Steps)

### Step 1: Open Cloudflare Dashboard
https://dash.cloudflare.com

### Step 2: Navigate to Pages Project
1. Click **Pages** in left sidebar
2. Select **estatecare-studio**
3. Go to **Settings** tab
4. Find **Functions** section

### Step 3: Add D1 Binding
1. Click **D1 Bindings** (or **Add Bindings**)
2. Click **Add Binding**
3. Fill in:
   - **Variable name**: `DB`
   - **Database**: Select `estatecare` from dropdown
4. Click **Deploy** or **Save**

## Verify It Works
- Wait 1-2 minutes
- Refresh: https://studio-6r5.pages.dev/
- Error should disappear ✅

## Command Line Alternative
```bash
npm run verify:d1          # Check configuration
npm run build:pages        # Build app
npm run deploy             # Deploy to Cloudflare Pages
```

## If It Still Doesn't Work
1. Hard refresh browser: `Ctrl+Shift+R`
2. Check Cloudflare Status: https://status.cloudflare.com/
3. Read full guide: `D1_BACKEND_FIX.md`
4. Run verification: `npm run verify:d1`

## Key Files
- ✅ `CLOUDFLARE_PAGES_DEPLOYMENT.md` - Full setup guide
- ✅ `D1_BACKEND_FIX.md` - Troubleshooting
- ✅ `D1_BACKEND_FIX_SUMMARY.md` - Technical summary
- ✅ `scripts/verify-d1-config.mjs` - Auto-check script

## Database Info
- **Name**: estatecare
- **Type**: SQLite (Cloudflare D1)
- **Binding**: DB (must match exactly)
- **Project**: estatecare-studio

## Expected Success Messages
After fixing, you should see in browser console:
```
✅ [D1 Poll] Starting initial sync and poll
🔄 [D1 Sync] Starting sync from Cloudflare D1...
✅ [D1 Sync] Sync complete
```

And data should load in:
- Residences
- Accommodation
- Inventory
- All other sections

---
**Need help?** See: CLOUDFLARE_PAGES_DEPLOYMENT.md or D1_BACKEND_FIX.md
