// Cloudflare Pages Function: /api/transactions
// Provides GET (list transactions) and POST (create transaction) using D1
import { CloudflareDB, type CloudflareEnv, type InventoryTransaction } from "../../lib/cloudflare-db";

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
    const referenceDocId = url.searchParams.get("referenceDocId") || undefined;

    const db = new CloudflareDB(ctx.env);
    const transactions = referenceDocId
      ? await db.getInventoryTransactionsByReference(referenceDocId)
      : await db.getInventoryTransactions(limit, offset);

    return Response.json(transactions, { status: 200 });
  } catch (err: any) {
    console.error("/api/transactions GET failed", err);
    return new Response("Failed to fetch transactions", { status: 500 });
  }
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as Record<string, any>;

    // Basic validation
    const required = ["itemId", "itemNameEn", "residenceId", "date", "type", "quantity"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return Response.json({ error: `Missing field: ${key}` }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const transaction: Omit<InventoryTransaction, 'created_at' | 'updated_at'> = {
      id,
      itemId: String(body.itemId),
      itemNameEn: String(body.itemNameEn),
      itemNameAr: body.itemNameAr || null,
      residenceId: String(body.residenceId),
      date: String(body.date),
      type: String(body.type) as InventoryTransaction['type'],
      quantity: Number(body.quantity),
      referenceDocId: body.referenceDocId || null,
      relatedResidenceId: body.relatedResidenceId || null,
      locationName: body.locationName || null,
      notes: body.notes || null,
    };

    const db = new CloudflareDB(ctx.env);
    await db.createInventoryTransaction(transaction);

    return Response.json({ id, created_at: now }, { status: 201 });
  } catch (err: any) {
    console.error("/api/transactions POST failed", err);
    return Response.json({ error: "Failed to create transaction" }, { status: 500 });
  }
};