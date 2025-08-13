export const dynamic = 'force-dynamic';

function mask(v?: string) {
  if (!v) return 'missing';
  const s = String(v);
  if (s.length <= 6) return '****';
  return `${s.slice(0, 4)}...${s.slice(-2)}`;
}

export async function GET() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    vapid: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
  };

  const present = Object.entries(cfg).every(([k, v]) => {
    if (k === 'vapid') return true; // optional
    return !!(v && String(v).trim());
  });

  return Response.json({
    ok: present && String(cfg.apiKey || '').startsWith('AIza'),
    present,
    nodeEnv: process.env.NODE_ENV,
    configMasked: {
      apiKey: mask(cfg.apiKey),
      authDomain: cfg.authDomain || 'missing',
      projectId: cfg.projectId || 'missing',
      storageBucket: cfg.storageBucket ? 'set' : 'missing',
      messagingSenderId: cfg.messagingSenderId ? 'set' : 'missing',
      appId: cfg.appId ? 'set' : 'missing',
      vapid: cfg.vapid ? 'set' : 'missing',
    },
  });
}
