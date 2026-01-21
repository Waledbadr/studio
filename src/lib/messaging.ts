export async function enablePushIfGranted(userId?: string) {
  // Push messaging is not supported in the Cloudflare D1/R2-only build.
  // Intentionally no-op.
  void userId;
}

export async function setupForegroundMessageListener(cb: (payload: any) => void) {
  // Push messaging is not supported in the Cloudflare D1/R2-only build.
  // Return an unsubscribe no-op.
  void cb;
  return () => {};
}
