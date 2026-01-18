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
export function getDb(d1: D1Database) {
    if (!d1) {
        throw new Error('D1 Database binding is required. Ensure you are passing the binding from getRequestContext().env');
    }
    // Always create a fresh instance to avoid caching issues across requests
    return drizzle(d1, { schema });
}

export { schema };
