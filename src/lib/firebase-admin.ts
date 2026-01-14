// firebase-admin has been removed from this project to adopt D1-first architecture.
// This file provides a lightweight stub so existing imports do not crash, but
// it intentionally returns nulls so callers must handle "no admin" scenarios.
// If you need admin features back, re-install `firebase-admin` and re-implement
// initialization here (or restore from previous commits).

export function getAdminDb(): any | null {
  // Admin is intentionally disabled in D1-only deployments
  return null;
}

export function getAdminBucket(): any | null {
  return null;
}


