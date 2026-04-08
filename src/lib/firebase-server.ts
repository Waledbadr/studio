export interface FirebaseVerifiedToken {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  phoneNumber?: string;
  providerUserInfo?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!FIREBASE_API_KEY) {
  console.warn('Firebase server verification will not work without FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY.');
}

async function callFirebaseIdentityToolkit(body: Record<string, unknown>) {
  if (!FIREBASE_API_KEY) {
    throw new Error('Firebase API key is not configured. Set FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY.');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json();
  if (!res.ok) {
    const message = payload?.error?.message || `Firebase token verification failed: ${res.status}`;
    throw new Error(message);
  }
  return payload;
}

export async function verifyIdToken(token: string): Promise<FirebaseVerifiedToken> {
  const payload = await callFirebaseIdentityToolkit({ idToken: token });
  const user = Array.isArray(payload?.users) && payload.users[0] ? payload.users[0] : null;
  if (!user) {
    throw new Error('Firebase token verification returned no user information');
  }

  return {
    uid: user.localId,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    providerUserInfo: user.providerUserInfo,
    ...user,
  };
}

export async function getUserByEmail(email: string): Promise<FirebaseVerifiedToken> {
  const payload = await callFirebaseIdentityToolkit({ email });
  const user = Array.isArray(payload?.users) && payload.users[0] ? payload.users[0] : null;
  if (!user) {
    throw new Error('Firebase auth user not found');
  }

  return {
    uid: user.localId,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    providerUserInfo: user.providerUserInfo,
    ...user,
  };
}
