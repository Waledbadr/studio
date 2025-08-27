// Cloudflare Pages Function: /api/users
// GET: list users with pagination; POST: create user
import { CloudflareDB, type CloudflareEnv } from "../../lib/cloudflare-db";

function toDbRole(role: any): 'admin' | 'manager' | 'user' | 'maintenance' {
  const r = String(role || 'user').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'user' || r === 'maintenance') return r;
  // Map common UI roles
  if (r === 'owner' || r === 'superadmin') return 'admin';
  if (r === 'tech' || r === 'technician') return 'maintenance';
  return 'user';
}

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
    const db = new CloudflareDB(ctx.env);
    const users = await db.getUsers(limit, offset);
    return Response.json(users, { status: 200 });
  } catch (err) {
    console.error('/api/users GET failed', err);
    return new Response('Server Error', { status: 500 });
  }
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const body = await ctx.request.json() as any;
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    if (!name || !email) {
      return Response.json({ error: 'Missing name or email' }, { status: 400 });
    }
    const role = toDbRole(body.role);
    const id = crypto.randomUUID();
    const db = new CloudflareDB(ctx.env);
    await db.createUser({
      id,
      name,
      email,
      phone: body.phone || null as any,
      role,
      password_hash: 'placeholder', // No auth on this branch; set a non-null placeholder
      avatar_url: body.avatar_url || null as any,
      is_active: body.is_active !== false,
      last_login: null as any,
      created_at: '' as any, // ignored by insert
      updated_at: '' as any, // ignored by insert
    } as any);
    return Response.json({ id }, { status: 201 });
  } catch (err) {
    console.error('/api/users POST failed', err);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
};
