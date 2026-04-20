export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Login failed');
  }

  return response.json() as Promise<AuthUser>;
}

export async function register(name: string, email: string, password: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Registration failed');
  }

  return response.json() as Promise<AuthUser>;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function getCurrentUser() {
  const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AuthUser>;
}
