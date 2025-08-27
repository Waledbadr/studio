// Messaging disabled for Cloudflare migration; keep no-op API to avoid build errors
// This file intentionally provides stubbed functions so UI imports remain stable
// and no Firebase dependencies are required in this branch.

export async function enablePushIfGranted(userId?: string): Promise<void> {
	// No-op: Push notifications are disabled in Cloudflare-only build
	if (process.env.NODE_ENV === 'development') {
		console.debug('Messaging: enablePushIfGranted noop', { userId });
	}
}

export async function setupForegroundMessageListener(
	cb: (payload: unknown) => void
): Promise<() => void> {
	// No-op subscription: return an unsubscribe that does nothing
	if (process.env.NODE_ENV === 'development') {
		console.debug('Messaging: setupForegroundMessageListener noop');
	}
	return () => {};
}

export type MessagingPayload = unknown;

// Optional helper to check if notifications are enabled (always false here)
export async function isPushEnabled(): Promise<boolean> {
	return false;
}

// Log once to make it clear in dev
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
	// eslint-disable-next-line no-console
	console.log('🔧 Messaging stubs active (no Firebase in cloudflare-deploy branch)');
}
