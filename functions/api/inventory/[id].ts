// Cloudflare Pages Function: /api/inventory/[id]
import { CloudflareDB, type CloudflareEnv } from "../../../lib/cloudflare-db";

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return new Response("Missing id", { status: 400 });
    const db = new CloudflareDB(ctx.env);
    const item = await db.getInventoryById(id);
    if (!item) return new Response("Not Found", { status: 404 });
    return Response.json(item);
  } catch (err) {
    console.error("/api/inventory/[id] GET failed", err);
    return new Response("Server Error", { status: 500 });
  }
};

export const onRequestPut: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return new Response("Missing id", { status: 400 });
    const body = (await ctx.request.json()) as Record<string, any>;
    const db = new CloudflareDB(ctx.env);
    await db.updateInventoryItem(id, body);
    return Response.json({ id, updated: true });
  } catch (err) {
    console.error("/api/inventory/[id] PUT failed", err);
    return new Response("Server Error", { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return new Response("Missing id", { status: 400 });
    const db = new CloudflareDB(ctx.env);
    await db.deleteInventoryItem(id);
    return Response.json({ id, deleted: true });
  } catch (err) {
    console.error("/api/inventory/[id] DELETE failed", err);
    return new Response("Server Error", { status: 500 });
  }
};
