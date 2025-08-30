// Cloudflare Pages Function: /api/transfers
// Provides GET (list transfers) and POST (create transfer) using D1
import { CloudflareDB, type CloudflareEnv, type StockTransfer } from "../../lib/cloudflare-db";

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
    const status = url.searchParams.get("status") || undefined;

    const db = new CloudflareDB(ctx.env);
    const transfers = status
      ? await db.getStockTransfersByStatus(status)
      : await db.getStockTransfers(limit, offset);

    return Response.json(transfers, { status: 200 });
  } catch (err: any) {
    console.error("/api/transfers GET failed", err);
    return new Response("Failed to fetch transfers", { status: 500 });
  }
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as Record<string, any>;

    // Basic validation
    const required = ["transferNumber", "fromResidenceId", "toResidenceId", "requestedBy", "date", "items"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return Response.json({ error: `Missing field: ${key}` }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const transfer: Omit<StockTransfer, 'created_at' | 'updated_at'> = {
      id,
      transferNumber: String(body.transferNumber),
      fromResidenceId: String(body.fromResidenceId),
      toResidenceId: String(body.toResidenceId),
      status: body.status || 'pending',
      requestedBy: String(body.requestedBy),
      approvedBy: body.approvedBy || null,
      approvedAt: body.approvedAt || null,
      date: String(body.date),
      items: body.items || [],
      notes: body.notes || null,
    };

    const db = new CloudflareDB(ctx.env);
    await db.createStockTransfer(transfer);

    return Response.json({ id, created_at: now }, { status: 201 });
  } catch (err: any) {
    console.error("/api/transfers POST failed", err);
    return Response.json({ error: "Failed to create transfer" }, { status: 500 });
  }
};