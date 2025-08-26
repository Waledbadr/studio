// Messaging disabled for Cloudflare migration; keep no-op API to avoid build errors
export async function enablePushIfGranted(userId?: string) {
  // no-op
}

export async function setupForegroundMessageListener(cb: (payload: any) => void) {
  return () => {};
}

console.log('🔧 Messaging disabled (no Firebase)');
