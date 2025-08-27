// Cloudflare Pages Function: /api/users/[id]
import { CloudflareDB, type CloudflareEnv } from "../../../lib/cloudflare-db";

function toDbRole(role: any): 'admin' | 'manager' | 'user' | 'maintenance' {
  const r = String(role || 'user').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'user' || r === 'maintenance') return r;
  if (r === 'owner' || r === 'superadmin') return 'admin';
  if (r === 'supervisor' || r === 'manager') return 'manager';
  if (r === 'tech' || r === 'technician') return 'maintenance';
  return 'user';
}

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return new Response('Missing id', { status: 400 });
    const db = new CloudflareDB(ctx.env);
    const user = await db.getUserById(id);
    if (!user) return new Response('Not Found', { status: 404 });
    return Response.json(user);
  } catch (err) {
    console.error('/api/users/[id] GET failed', err);
    return new Response('Server Error', { status: 500 });
  }
};

export const onRequestPut: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return new Response('Missing id', { status: 400 });
    const updates = await ctx.request.json() as any;
    // Whitelist updatable fields and map role to DB values if provided
    const allowed: Record<string, any> = {};
    if (typeof updates.name === 'string') allowed.name = updates.name;
    if (typeof updates.email === 'string') allowed.email = updates.email;
    if (typeof updates.phone === 'string') allowed.phone = updates.phone;
    if (typeof updates.role !== 'undefined') allowed.role = toDbRole(updates.role);
    if (typeof updates.avatar_url === 'string') allowed.avatar_url = updates.avatar_url;
    if (typeof updates.is_active === 'boolean') allowed.is_active = updates.is_active;
    const db = new CloudflareDB(ctx.env);
    await db.updateUser(id, allowed);
    return Response.json({ id, updated: true });
  } catch (err) {
    console.error('/api/users/[id] PUT failed', err);
    return new Response('Server Error', { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return new Response('Missing id', { status: 400 });
    const db = new CloudflareDB(ctx.env);
    await db.deleteUser(id);
    return Response.json({ id, deleted: true });
  } catch (err) {
    console.error('/api/users/[id] DELETE failed', err);
    return new Response('Server Error', { status: 500 });
  }
};
