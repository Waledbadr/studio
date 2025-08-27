# D1 Schema Cleanup Plan (Cloudflare branch)

This branch focuses on Cloudflare-first. You noticed some tables/columns feel generic or not aligned with the app. Below is a safe, incremental cleanup plan without breaking the UI.

## Current usage snapshot

- UI uses a hierarchical in-memory model for residences (Complex → Building → Floor → Room). The current D1 table `residences` is a flat property-style model and is not directly used by the simple context.
- Inventory: the app uses only a subset of fields from `inventory` (name, category, quantity, unit, etc.). We already normalize these in the inventory context.
- No screens currently require the extra columns like `lease_*`, `utilities_included`, property area details, etc.

## Goals

- Make DB shape match the UI needs.
- Avoid destructive changes now; prefer additive changes (views or new tables) to keep migrations safe.

## Option A: Create SQL views matching the UI model (non-breaking)

Create lightweight views that expose exactly what the app needs, leaving original tables intact:

- `view_residences_min`: exposes only id, name, city (for Complex listing).
- You can add views later for buildings/floors/rooms if/when you model them in D1.

Advantages:
- Zero data loss.
- Can migrate UI to use views gradually.

## Option B: Introduce a hierarchical schema for residences (additive)

Add a new set of tables to represent the hierarchy used by the UI, without dropping existing `residences`:

- `residence_complexes(id, name, city, created_at, updated_at)`
- `residence_buildings(id, complex_id, name, created_at, updated_at)`
- `residence_floors(id, building_id, name, level, created_at, updated_at)`
- `residence_rooms(id, floor_id, name, area, capacity, created_at, updated_at)`

Advantages:
- Direct match to UI model.
- Leaves existing data untouched.

## Recommended immediate step

Start with Option A (views) so we can iterate quickly, then adopt Option B if/when you want to persist the full hierarchy in D1.

See `scripts/migrations/2025-08-27_residences_cleanup.sql` for SQL to create the view and optional hierarchical tables.

## Next steps

1. Apply the migration locally.
2. Gradually update any server-side code (Pages Functions) to read from the view if you want a trimmed dataset.
3. If we choose Option B later, we can add lightweight APIs to manage complexes/buildings/floors/rooms.

