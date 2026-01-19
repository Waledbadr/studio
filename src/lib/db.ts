import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

// This file exports the database instance.
// In a Cloudflare Workers/Pages environment, the D1 database is usually 
// available as a binding on the `env` object.

export interface Env {
    DB: D1Database;
}

/**
 * Get the database instance.
 * @param d1 - The D1 database binding (required).
 */
export function getDb(d1?: D1Database) {
    // Allow calls without explicitly passing D1 in places where it was previously implicit. If missing, try to use a global fallback if available.
    const _d1 = d1 || (globalThis as any)?.D1 || (globalThis as any)?.DB;
    if (!_d1) {
        throw new Error('D1 Database binding is required. Ensure you are passing the binding from getRequestContext().env');
    }
    // Always create a fresh instance to avoid caching issues across requests
    return drizzle(_d1 as D1Database, { schema });
}

export { schema };
