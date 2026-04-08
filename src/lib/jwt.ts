const JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.NEXT_PUBLIC_AUTH_JWT_SECRET;
const DEFAULT_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

if (!JWT_SECRET) {
  console.warn('AUTH_JWT_SECRET is not configured. Local auth tokens will not be secure.');
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64urlEncode(buffer: Uint8Array) {
  return base64Encode(buffer)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return base64Decode(base64);
}

async function getKey() {
  if (!JWT_SECRET) throw new Error('AUTH_JWT_SECRET not set');
  const keyData = encoder.encode(JWT_SECRET);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(data: Uint8Array): Promise<string> {
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, data.buffer as ArrayBuffer);
  return base64urlEncode(new Uint8Array(signature));
}

async function verify(data: Uint8Array, signature: string): Promise<boolean> {
  const key = await getKey();
  const sigBytes = base64urlDecode(signature);
  return crypto.subtle.verify('HMAC', key, sigBytes, data.buffer as ArrayBuffer);
}

export async function createJwt(payload: Record<string, unknown>, expiresInSeconds = DEFAULT_EXPIRATION_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };
  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const encodedBody = base64urlEncode(encoder.encode(JSON.stringify(body)));
  const signingInput = encoder.encode(`${encodedHeader}.${encodedBody}`);
  const signature = await sign(signingInput);
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export async function verifyJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [encodedHeader, encodedBody, signature] = parts;
  const signingInput = encoder.encode(`${encodedHeader}.${encodedBody}`);
  const isValid = await verify(signingInput, signature);
  if (!isValid) throw new Error('Invalid token signature');
  const bodyJson = decoder.decode(base64urlDecode(encodedBody));
  const payload = JSON.parse(bodyJson) as Record<string, unknown>;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}
