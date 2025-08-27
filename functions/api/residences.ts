// Cloudflare Pages Function: /api/residences
// Returns minimal residence records from view_residences_min (if available) with fallback to residences table
import { CloudflareDB, type CloudflareEnv } from "../../lib/cloudflare-db";

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
    const q = (url.searchParams.get("q") || "").trim();

    const db = new CloudflareDB(ctx.env);
    const items = await db.getResidencesMin(limit, offset, q || undefined);
    return Response.json(items, { status: 200 });
  } catch (err: any) {
    console.error("/api/residences GET failed", err);
    return new Response("Failed to fetch residences", { status: 500 });
  }
};
 
