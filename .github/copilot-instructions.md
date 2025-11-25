## EstateCare AI Coding Agent Guide

Concise, actionable context so an AI agent can work productively in this repo. Focus on CURRENT patterns (not aspirational). Keep answers grounded in referenced files.

### 1. High-Level Architecture
- Framework: Next.js App Router (see `src/app/layout.tsx`, feature dirs under `src/app/*`). Client-heavy with Firebase as BaaS.
- State & domain logic centralized in React Context providers (`src/context/*-context.tsx`). Each context encapsulates Firestore subscription + mutation workflows (e.g. `inventory-context.tsx` ~2400 lines: transactional stock logic, ID generators, approval flows).
- Data persistence: Firestore collections (naming is flat, e.g. `inventory`, `inventoryTransactions`, `mrvs`, `mivs`, `stockTransfers`, `inventoryAudits`, `counters`, `mrvRequests`, etc.). No server wrapper layer; writes happen directly in contexts using Firestore SDK transactions.
- Auth: Firebase client-only (`src/lib/firebase.ts`). Middleware (`src/middleware.ts`) only rate-limits feedback & allows public paths; it does NOT enforce auth—UI gates do.
- AI: Genkit integration (`src/ai/*`) with dedicated dev scripts in `package.json` (`genkit:dev`, `genkit:watch`).
- Theming & UI: Tailwind + shadcn/radix; design tokens via CSS vars consumed in `tailwind.config.ts`.

### 2. Key Conventions & Patterns
- Dual-language fields: Many entities carry `nameAr` & `nameEn`; fallback logic often uses `nameEn || nameAr || name`—preserve when adding new models.
- Stock integrity: Never directly mutate numeric `stock`; recompute from `stockByResidence` or perform read-modify-write inside a Firestore `runTransaction`. See `issueItemsFromStock` & `createMRV` in `inventory-context.tsx` for the canonical pattern.
- ID / code generation: Monthly counters stored in `counters/*` docs with transactional increment (e.g. `miv-YY-MM`, `mrv-YY-MM`, `trs-YY-MM`, `recon-YY-M`). Always reserve IDs inside a Firestore transaction or a helper like `reserveNewMrvId` then write master + line transactions atomically.
- Transactions logging: Every stock-affecting action writes an `inventoryTransactions` row (types include `IN`, `OUT`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT`, `AUDIT`, etc.) with `referenceDocId` linking to a voucher / reconciliation / transfer document.
- Lifespan & override: Issue forms can append `overrideReason` if issuing within lifespan; log fields `overrideReason`, `overrideById`, `overrideByName` (copy this naming if extending feature).
- Approval flows: Pending docs have status enums (`'Pending' | 'Approved' | 'Rejected' | ...`) and link to a final posted record (e.g. `mrvRequests.mrvId / mrvShort`). Maintain sort order by timestamp fields (e.g. `requestedAt`).
- Large context files intentionally co-locate domain logic instead of scattering util modules—add new domain ops inside the relevant context unless clearly cross-cutting.
- Client safeguards: Role checks (e.g. Admin / Supervisor) occur before mutations; do not remove them. Server security relies on Firestore rules (not shown here)—assume least privilege.

### 3. Typical Developer Workflows
- Dev server (port 9002): `npm run dev` (wraps `next dev --turbopack` plus keep-alive script).
- Type & lint (build ignores errors to keep deploys unblocked—see `next.config.ts`): `npm run typecheck`, `npm run lint` before committing to avoid silent regressions.
- AI flows: Run `npm run genkit:dev` for local Genkit playground; code entry at `src/ai/dev.ts`.
- Firebase config: Requires `.env.local` with `NEXT_PUBLIC_FIREBASE_*`. If missing, contexts emit a user toast and no Firestore ops proceed (see guard in `firebase.ts`).
- Blob uploads: Endpoints `/api/uploads/feedback` & `/api/uploads/mrv-invoice` need `BLOB_READ_WRITE_TOKEN` set.
- Negative stock maintenance endpoints documented in root `README.md` (`/api/inventory/fix-negative`). Keep algorithm consistent with existing reconciliation logic (zero-out negative, recompute total, log ADJUSTMENT with ref `AUTO-FIX-NEGATIVE`).

### 4. Adding / Modifying Features (Copy These Patterns)
- New stock-impacting action: (1) Validate permissions & inputs early. (2) Aggregate per item before a single Firestore transaction. (3) Inside `runTransaction`: read each item, compute new `stockByResidence`, recompute total, write item, append one `inventoryTransactions` doc per logical movement referencing a master ID. (4) Emit toast on success.
- New coded document (voucher/transfer type): Create counter key pattern `prefix-YY-MM` (or `YY-M` for no padding) + transactional increment; generate both full & short IDs if needed (`MRV-YY-MM-###` vs `MRV-YYM###`).
- Extend approval workflow: Mirror MRV request fields (`status`, `requestedById`, timestamps, link to final posted record, optional short code). Provide sorted fetch query with optional status filter.
- Multi-language inputs: Accept either language, auto-translate missing counterpart via existing `/api/translate-item` endpoint; store both.
- UI forms: Favor accessible dialog pattern as in `add-item-dialog.tsx` (Ctrl/Cmd+Enter submit, optimistic resets on open, chip inputs splitting by comma/newline).

### 5. Performance & Reliability Notes
- Firestore listener fan-out: Each context sets up multiple `onSnapshot` streams only after auth is established; avoid adding heavy listeners before auth (see `isLoaded` gating in `inventory-context.tsx`).
- Avoid underflow: Always clamp or validate non-negative stock (`Math.max(0, value)`)—pattern repeated when summing totals.
- Large context size: Prefer extracting clearly reusable pure helpers only if they are used across >2 contexts; otherwise keep local for discoverability.
- Environment looseness: `next.config.ts` sets `ignoreBuildErrors` & `ignoreDuringBuilds`; CI quality relies on explicit `lint` / `typecheck` scripts—do not assume production build enforces types.

### 6. DO / DO NOT
DO reuse existing transaction + counter patterns for any new inventory document types.
DO maintain naming consistency (`codeShort`, `referenceDocId`, `stockByResidence`, `lifespanDays`).
DO guard mutations with role checks matching existing precedent (Admin / Supervisor where applicable).
DO add new Firestore collections in lowercase, hyphenless (current style: camel or plain words, e.g. `mrvRequests`, `inventoryTransactions`).
DO keep dual-language fields when introducing new user-facing names.
DO emit user feedback with `useToast()` for errors & success.

DO NOT write aggregate `stock` directly—derive or recompute from `stockByResidence` inside transactions.
DO NOT bypass existing counter docs—risks ID collisions under concurrency.
DO NOT introduce server-only logic into middleware for auth (client-driven model is intentional here).
DO NOT remove negative stock clamping or validations; downstream audit tools depend on non-negative invariants.

### 7. Key Reference Files
- `src/context/inventory-context.tsx` – canonical pattern for Firestore transactions, counters, approval flows, ID generation.
- `src/lib/firebase.ts` – environment gating, emulator support, caching strategy.
- `src/middleware.ts` – rate limiting + public path allowlist (no auth enforcement).
- `src/components/inventory/add-item-dialog.tsx` – dual-language + translation + chip input UX pattern.
- `tailwind.config.ts` – theme tokens & dynamic color system (use existing CSS variable strategy for new theme surfaces).
- `README.md` – deployment, negative stock maintenance, high-level domain descriptions.

### 8. When Unsure
Prefer searching for an analogous pattern in contexts before inventing a new abstraction. Implement minimal viable logic first, then factor only if >2 domains need it. Keep modifications incremental and reflect any new collection or counter naming in this file on change.

---
If any section is unclear or missing (e.g., maintenance-service orders, AI flows detail), request clarification so we can iterate.