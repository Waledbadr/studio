// Cloudflare Pages Function: /api/inventory
// Provides GET (list inventory) and POST (create item) using D1
import { CloudflareDB, type CloudflareEnv, type InventoryItem } from "../../lib/cloudflare-db";

export const onRequestGet: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
    const q = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || undefined;

    const db = new CloudflareDB(ctx.env);
    const items = q
      ? await db.searchInventory(q, category)
      : (category ? await db.getInventoryByCategory(category) : await db.getInventory(limit, offset));
    return Response.json(items, { status: 200 });
  } catch (err: any) {
    console.error("/api/inventory GET failed", err);
    return new Response("Failed to fetch inventory", { status: 500 });
  }
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async (ctx) => {
  try {
    const body = (await ctx.request.json()) as Record<string, any>;

    // Basic validation
    const required = ["name", "category", "quantity", "unit_of_measure", "minimum_stock", "condition_status"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return Response.json({ error: `Missing field: ${key}` }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Normalize and validate condition_status
    const rawCondition = String(body.condition_status || 'new').toLowerCase();
    const allowedConditions = new Set(['new','good','fair','poor','damaged']);
    const condition_status = (allowedConditions.has(rawCondition)
      ? rawCondition
      : 'new') as InventoryItem['condition_status'];

  // Allow extended fields beyond the base InventoryItem to support extras
  const item: any = {
      id,
      name: String(body.name),
      nameAr: body.nameAr ?? body.name_ar ?? undefined,
      nameEn: body.nameEn ?? body.name_en ?? undefined,
      description: body.description ?? null as any,
      category: String(body.category),
      subcategory: body.subcategory ?? null as any,
      sku: body.sku ?? null as any,
      barcode: body.barcode ?? null as any,
      quantity: Number(body.quantity),
      unit_of_measure: String(body.unit_of_measure),
      unit_price: body.unit_price != null ? Number(body.unit_price) : null as any,
      minimum_stock: Number(body.minimum_stock),
      maximum_stock: body.maximum_stock != null ? Number(body.maximum_stock) : null as any,
      supplier_name: body.supplier_name ?? null as any,
      supplier_contact: body.supplier_contact ?? null as any,
      purchase_date: body.purchase_date ?? null as any,
      expiry_date: body.expiry_date ?? null as any,
      location: body.location ?? null as any,
  condition_status,
      image_url: body.image_url ?? body.imageUrl ?? null as any,
      notes: body.notes ?? null as any,
      is_active: body.is_active !== false,
      lifespan_days: body.lifespan_days ?? body.lifespanDays ?? null as any,
      variants: body.variants ? JSON.stringify(body.variants) : null as any,
      keywords_ar: body.keywords_ar ?? (body.keywordsAr ? JSON.stringify(body.keywordsAr) : null) as any,
      keywords_en: body.keywords_en ?? (body.keywordsEn ? JSON.stringify(body.keywordsEn) : null) as any,
    };

    const db = new CloudflareDB(ctx.env);
    await db.createInventoryItem(item);

    return Response.json({ id, created_at: now }, { status: 201 });
  } catch (err: any) {
    console.error("/api/inventory POST failed", err);
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
};
