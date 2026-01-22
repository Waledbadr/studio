## EstateCare Copilot Instructions (D1-first)

### Architecture & data flow
- Next.js App Router app; main entry is `src/app/layout.tsx` with many Context providers under `src/context/*-context.tsx`.
- Persistence is Cloudflare **D1 (SQLite via Drizzle)**; schema is `src/db/schema.ts` and server-side ops live in `src/lib/d1-actions.ts`.
- Client code never writes via Firestore APIs: `src/lib/realtime-shim.ts` is a compatibility layer and **throws on writes/transactions**.
- Client-to-DB calls go through `src/lib/d1-client.ts` → POST `src/app/api/d1/route.ts` (Edge runtime) which allowlists actions.

### Auth & middleware
- Auth is session/JWT-based: client uses `src/lib/auth-shim.ts` (polls `/api/auth/me`, login/register/logout routes under `src/app/api/auth/*`).
- `src/middleware.ts` enforces auth for non-public routes and supports Cloudflare Access (`CLOUDFLARE_ACCESS_TEAM_DOMAIN`, `CLOUDFLARE_ACCESS_AUD`) or app JWT (`JWT_PRIVATE_KEY`, `JWT_ISSUER`, `JWT_AUD`).

### Repo-specific domain conventions
- Dual-language fields are common (`nameAr`, `nameEn`); preserve them when extending models.
- Inventory stock is stored per residence as `stockByResidence` (JSON) and `stock` is the derived total; D1 actions clamp non-negative and recompute totals.
- Stock-impacting operations must also append an `inventoryTransactions` row with `referenceDocId` (see `createServiceOrder`, `issueStock`, `transferStock` in `src/lib/d1-actions.ts`).
- Codes/IDs are reserved via the `counters` table using month keys like `mrv-YY-MM`, `svc-YY-MM` (see `src/lib/d1-actions.ts`).
- Business logic tends to stay inside the relevant context (large files are intentional); only extract helpers when reused across multiple contexts.

### Developer workflows (what to run)
- UI dev (no D1 bindings, contexts fall back to localStorage): `npm run dev` (port 9002).
- Full D1-backed dev (Cloudflare Pages dev + bindings for `/api/d1`): `npm run dev:d1`.
- Build for Cloudflare Pages: `npm run build:pages` then `npm run deploy`.
- Quality gates: `npm run typecheck`, `npm run lint` (build ignores TS/ESLint errors via `next.config.ts`).
- Tests: `npm test` (Vitest), and `npm run test:smoke` for D1 smoke tests.

### Adding a new backend capability
1) Implement it in `src/lib/d1-actions.ts` (use Drizzle + schema). 2) Add to the allowlist in `src/app/api/d1/route.ts`. 3) Add a wrapper in `src/lib/d1-client.ts` if called from the browser.

### Uploads / external integrations
- Vercel Blob uploads require `BLOB_READ_WRITE_TOKEN` (see root README for `/api/uploads/*`).