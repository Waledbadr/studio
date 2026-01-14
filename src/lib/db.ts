import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

// This file exports the database instance.
// In a Cloudflare Workers/Pages environment, the D1 database is usually 
// available as a binding on the `env` object.

export interface Env {
    DB: D1Database;
}

// Global variable to store the database instance
let db: ReturnType<typeof drizzle<typeof schema>>;

/**
 * Get the database instance.
 * @param d1 - The D1 database binding.
 */
export function getDb(d1?: D1Database) {
    if (db) return db;

    if (!d1) {
        throw new Error('D1 Database binding is missing. Ensure you are passing the binding from the context.');
    }

    db = drizzle(d1, { schema });
    return db;
}

export { schema };
