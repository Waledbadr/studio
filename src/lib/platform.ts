// Cloudflare-first platform exports
// This module intentionally avoids vendor SDK initialization on the client.
// It exists as a compatibility layer for code that previously imported from a vendor SDK module.

export const app = null as any;
export const db = null as any;
export const auth = null as any;
export const storage = null as any;

// Some client code awaits an authReady promise during boot.
export const authReady: Promise<void> = Promise.resolve();
