export async function createWorker(data: any) {
    const d1 = await getD1();
    const db = getDb(d1);
    await db.insert(workers).values(data);
    return { ok: true };
}
export async function deleteWorker(id: string) {
    const d1 = await getD1();
    const db = getDb(d1);
    await db.delete(workers).where(eq(workers.id, id));
    return { ok: true };
}
export async function updateTransferRequest(id: string, data: any) {
    const d1 = await getD1();
    const db = getDb(d1);
    await db.update(transferRequests).set(data).where(eq(transferRequests.id, id));
    return { ok: true };
}
// --- Accommodation Transfer Requests (D1 only) ---

export async function createTransferRequest(tr: any) {
    const d1 = await getD1();
    const db = getDb(d1);
    await db.insert(transferRequests).values(tr);
    return { ok: true };
}

export async function updateWorker(id: string, data: any) {
    const d1 = await getD1();
    const db = getDb(d1);
    await db.update(workers).set(data).where(eq(workers.id, id));
    return { ok: true };
}


import { getDb } from './db';
import { workers, residences, occupants, accommodationHistory, companies, contracts, invoices, transferRequests, notifications, inventory, inventoryCategories, inventoryTransactions, mrvRequests, mrvs, orders, users, counters, serviceOrders, mivs, stockReconciliations, auditLogs, feedback } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';

async function getD1() {
    try {
        const { env } = getRequestContext();
        return env.DB;
    } catch (e) {
        // Fallback for local development or if getRequestContext fails
        // In development without D1 binding, return null quietly
        // (no log to keep dev console clean)
        return null as any;
    }
}

export async function getWorkers() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(workers);
}

export async function getResidences() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(residences);
}

export async function getOccupants(residenceId?: string) {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    let query = db.select().from(occupants).where(isNull(occupants.until));
    if (residenceId) {
        query = db.select().from(occupants).where(
            and(
                eq(occupants.residenceId, residenceId),
                isNull(occupants.until)
            )
        );
    }
    return await query;
}

export async function getCompanies() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(companies);
}

export async function getContracts() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(contracts);
}

export async function getInvoices() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(invoices);
}

export async function getHistory() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(accommodationHistory);
}

export async function getTransferRequests() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(transferRequests);
}

export async function getNotifications() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(notifications);
}

export async function getServiceOrders() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(serviceOrders);
}
export async function checkInWorker(params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    since: string;
    checkInBy: string;
    isEmergency?: boolean;
}) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const id = `occ_${Date.now()}`;

    await db.insert(occupants).values({
        id,
        workerId: params.workerId,
        residenceId: params.residenceId,
        roomId: params.roomId,
        since: params.since,
        checkInBy: params.checkInBy,
        isEmergency: params.isEmergency ? 1 : 0,
        updatedAt: new Date().toISOString()
    });

    // Update worker status
    await db.update(workers)
        .set({ status: 'Active', transferDestination: null, updatedAt: new Date().toISOString() })
        .where(eq(workers.id, params.workerId));

    return { ok: true, id };
}

export async function checkOutWorker(params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    until: string;
    checkOutBy: string;
    checkoutType?: string;
    transferCity?: string;
}) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    await db.update(occupants)
        .set({
            until: params.until,
            checkOutBy: params.checkOutBy,
            checkoutType: params.checkoutType,
            transferCity: params.transferCity,
            updatedAt: new Date().toISOString()
        })
        .where(and(
            eq(occupants.workerId, params.workerId),
            eq(occupants.residenceId, params.residenceId),
            eq(occupants.roomId, params.roomId),
            isNull(occupants.until)
        ));

    // Update worker status based on checkout type
    let status = 'Active';
    if (params.checkoutType === 'Transfer') status = 'Transferring';
    else if (params.checkoutType === 'Exit') status = 'Exit';
    else if (params.checkoutType === 'Vacation') status = 'Vacation';

    await db.update(workers)
        .set({
            status,
            transferDestination: params.transferCity,
            updatedAt: new Date().toISOString()
        })
        .where(eq(workers.id, params.workerId));

    return { ok: true };
}

// --- Service Orders (D1 implementations) ---
export async function createServiceOrder(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterId = `svc-${yy}-${mm}`;

    // Read and increment counter (simple upsert)
    const existing = await db.select().from(counters).where(eq(counters.id, counterId));
    let nextSeq = 1;
    if (existing.length > 0) {
        try {
            const curr = Number((existing[0] as any).seq || 0);
            nextSeq = curr + 1;
            await db.update(counters).set({ seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() }).where(eq(counters.id, counterId));
        } catch {
            // fallback - try insert
            await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
        }
    } else {
        await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
    }

    const codeShort = `SVC-${yy}${mmNoPad}${nextSeq}`;
    const id = codeShort;

    // Aggregate totals per item and perform updates + transaction logs
    const items = payload.items || [];
    // Build totals per item
    const totals = new Map<string, number>();
    for (const ln of items) {
        const idk = String(ln.id);
        totals.set(idk, (totals.get(idk) || 0) + Number(ln.quantity || 0));
    }

    // Read inventory rows for involved items
    const itemIds = Array.from(totals.keys());
    const invRows = await db.select().from(inventory).where(inventory.id.in(itemIds));
    const invMap = new Map<string, any>();
    for (const r of invRows) invMap.set((r as any).id, r);

    // Validate stock availability at residence
    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId);
        const current = Math.max(0, Number(row?.stockByResidence?.[payload.residenceId] || 0));
        if (current < qty) return { ok: false, error: `Insufficient stock for item ${itemId}` };
    }

    // Perform updates
    const nowIso = now.toISOString();
    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId) || {};
        let sbr = {} as Record<string, number>;
        if (row && row.stockByResidence) {
            try { sbr = typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence; } catch { sbr = {} }
        }
        const cur = Math.max(0, Number(sbr[payload.residenceId] || 0));
        sbr[payload.residenceId] = Math.max(0, cur - qty);
        const newTotal = Object.values(sbr).reduce((s: number, v: any) => s + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
        await db.update(inventory).set({ stockByResidence: JSON.stringify(sbr), stock: newTotal }).where(eq(inventory.id, itemId));

        // Insert transaction record
        await db.insert(inventoryTransactions).values({
            itemId,
            itemNameEn: (row?.nameEn) || '',
            itemNameAr: (row?.nameAr) || '',
            residenceId: payload.residenceId,
            date: nowIso,
            type: 'OUT',
            quantity: qty,
            referenceDocId: codeShort,
            locationName: `Sent to maintenance: ${payload.destination?.name || ''}`,
        });
    }

    // Create service order master record
    await db.insert(serviceOrders).values({
        id,
        codeShort,
        dateCreated: nowIso,
        residenceId: payload.residenceId,
        residenceName: payload.residenceName,
        destination: JSON.stringify(payload.destination || {}),
        status: 'DISPATCHED',
        dispatchedAt: nowIso,
        createdById: payload.createdById,
        dispatchedById: payload.dispatchedById,
        items: JSON.stringify(items.map((i: any) => ({ itemId: i.id, itemNameEn: i.nameEn, itemNameAr: i.nameAr, qtySent: i.quantity, qtyReturned: 0, qtyScrapped: 0 }))),
    });

    return { ok: true, id: codeShort };
}

export async function receiveServiceOrder(orderId: string, updates: any[], receivedById: string, forceComplete?: boolean) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const rows = await db.select().from(serviceOrders).where(eq(serviceOrders.id, orderId));
    if (!rows || rows.length === 0) return { ok: false, error: 'Service order not found' };
    const order = rows[0] as any;
    const residenceId = order.residenceId;
    const items: any[] = JSON.parse(order.items || '[]');

    const nowIso = new Date().toISOString();

    // Build map of updates
    const updMap = new Map<string, { addReturned: number; addScrapped: number }>();
    for (const u of updates || []) {
        const addR = Math.max(0, Number(u.addReturned || 0));
        const addS = Math.max(0, Number(u.addScrapped || 0));
        if (addR === 0 && addS === 0) continue;
        updMap.set(u.itemId, { addReturned: addR, addScrapped: addS });
    }

    if (updMap.size === 0 && !forceComplete) return { ok: true, message: 'Nothing to do' };

    // Read inventory items for affected lines
    const affectedIds = Array.from(updMap.keys());
    const invRows = await db.select().from(inventory).where(inventory.id.in(affectedIds));
    const invMap = new Map<string, any>();
    for (const r of invRows) invMap.set((r as any).id, r);

    // Apply updates
    for (const [itemId, data] of updMap.entries()) {
        const addR = data.addReturned;
        const addS = data.addScrapped;
        const inv = invMap.get(itemId) || {};
        let sbr = {} as Record<string, number>;
        if (inv && inv.stockByResidence) {
            try { sbr = typeof inv.stockByResidence === 'string' ? JSON.parse(inv.stockByResidence) : inv.stockByResidence; } catch { sbr = {} }
        }
        if (addR > 0) {
            const cur = Math.max(0, Number(sbr[residenceId] || 0));
            sbr[residenceId] = cur + addR;
            const newTotal = Object.values(sbr).reduce((s: number, v: any) => s + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
            await db.update(inventory).set({ stockByResidence: JSON.stringify(sbr), stock: newTotal }).where(eq(inventory.id, itemId));
            await db.insert(inventoryTransactions).values({
                itemId,
                itemNameEn: inv?.nameEn || '',
                itemNameAr: inv?.nameAr || '',
                residenceId,
                date: nowIso,
                type: 'IN',
                quantity: addR,
                referenceDocId: order.codeShort,
                locationName: `Returned from maintenance: ${order.destination?.name || ''}`,
            });
        }
        if (addS > 0) {
            await db.insert(inventoryTransactions).values({
                itemId,
                itemNameEn: inv?.nameEn || '',
                itemNameAr: inv?.nameAr || '',
                residenceId,
                date: nowIso,
                type: 'DEPRECIATION',
                quantity: addS,
                referenceDocId: order.codeShort,
                locationName: `Scrapped at workshop: ${order.destination?.name || ''}`,
                depreciationReason: 'Scrapped at workshop',
            });
        }
        // Update order line totals in-memory
        const line = items.find((l: any) => String(l.itemId) === String(itemId));
        if (line) {
            line.qtyReturned = (line.qtyReturned || 0) + (data.addReturned || 0);
            line.qtyScrapped = (line.qtyScrapped || 0) + (data.addScrapped || 0);
        }
    }

    // Determine status
    let allClosed = true;
    for (const ln of items) {
        if ((ln.qtyReturned || 0) + (ln.qtyScrapped || 0) < (ln.qtySent || 0)) {
            allClosed = false; break;
        }
    }
    const newStatus = allClosed ? 'COMPLETED' : 'PARTIAL_RETURN';

    await db.update(serviceOrders).set({ items: JSON.stringify(items), status: newStatus }).where(eq(serviceOrders.id, orderId));

    return { ok: true };
}

// --- Mutations ---

export async function createResidence(data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.insert(residences).values(data);
    return { ok: true };
}

export async function updateResidence(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(residences).set(data).where(eq(residences.id, id));
    return { ok: true };
}

export async function deleteResidence(id: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.delete(residences).where(eq(residences.id, id));
    return { ok: true };
}

export async function createCompany(data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.insert(companies).values(data);
    return { ok: true };
}

export async function updateCompany(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(companies).set(data).where(eq(companies.id, id));
    return { ok: true };
}

export async function deleteCompany(id: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.delete(companies).where(eq(companies.id, id));
    return { ok: true };
}

// --- Additional Getters ---

export async function getInventory() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(inventory);
}

export async function getInventoryCategories() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(inventoryCategories);
}

export async function getInventoryTransactions() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(inventoryTransactions);
}

export async function getMrvRequests() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(mrvRequests);
}

export async function getMrvs() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(mrvs);
}

export async function createMRV(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const now = new Date().toISOString();

    // Use provided mrvShort/id if given, otherwise reserve via counters
    let mrvId = payload.meta?.mrvId || '';
    let mrvShort = payload.meta?.mrvShort || '';

    if (!mrvId) {
        const nowDate = new Date();
        const yy = nowDate.getFullYear().toString().slice(-2);
        const mm = (nowDate.getMonth() + 1).toString().padStart(2, '0');
        const mmNoPad = (nowDate.getMonth() + 1).toString();
        const counterId = `mrv-${yy}-${mm}`;
        const existing = await db.select().from(counters).where(eq(counters.id, counterId));
        let nextSeq = 1;
        if (existing.length > 0) {
            try {
                nextSeq = Number((existing[0] as any).seq || 0) + 1;
                await db.update(counters).set({ seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() }).where(eq(counters.id, counterId));
            } catch {
                await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
            }
        } else {
            await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
        }
        const seqPadded = String(nextSeq).padStart(3, '0');
        mrvId = `MRV-${yy}-${mm}-${seqPadded}`;
        mrvShort = `MRV-${yy}${mmNoPad}${nextSeq}`;
    }

    const residenceId = payload.residenceId;
    const items = payload.items || [];
    if (!residenceId || items.length === 0) return { ok: false, error: 'residenceId and items are required' };

    // Aggregate totals per item
    const totals = new Map<string, number>();
    for (const it of items) {
        totals.set(String(it.id), (totals.get(String(it.id)) || 0) + Number(it.quantity || 0));
    }

    // Read inventory rows for items
    const itemIds = Array.from(totals.keys());
    const invRows = await db.select().from(inventory).where(inventory.id.in(itemIds));
    const invMap = new Map<string, any>();
    for (const r of invRows) invMap.set((r as any).id, r);

    // Update stock and add transactions
    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId) || {};
        let sbr: Record<string, number> = {};
        try { sbr = row && row.stockByResidence ? (typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence) : {}; } catch { sbr = {}; }
        const cur = Math.max(0, Number(sbr[residenceId] || 0));
        sbr[residenceId] = cur + qty;
        const newTotal = Object.values(sbr).reduce((s: number, v: any) => s + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
        await db.update(inventory).set({ stockByResidence: JSON.stringify(sbr), stock: newTotal }).where(eq(inventory.id, itemId));

        await db.insert(inventoryTransactions).values({
            itemId,
            itemNameEn: (row?.nameEn) || '',
            itemNameAr: (row?.nameAr) || '',
            residenceId,
            date: now,
            type: 'IN',
            quantity: qty,
            referenceDocId: mrvId,
            locationName: 'Receiving'
        });
    }

    // Insert MRV master
    await db.insert(mrvs).values({
        id: mrvId,
        date: now,
        residenceId,
        itemCount: totals.size,
        supplierName: payload.meta?.supplierName || null,
        invoiceNo: payload.meta?.invoiceNo || null,
        notes: payload.meta?.notes || null,
        attachmentUrl: payload.meta?.attachmentUrl || null,
        attachmentPath: payload.meta?.attachmentPath || null,
        codeShort: mrvShort || null,
        orderId: payload.meta?.orderId || null,
        receivedBy: payload.meta?.receivedBy || null,
        receivedByName: payload.meta?.receivedByName || null
    });

    return { ok: true, id: mrvId };
}

export async function approveMRVRequest(requestId: string, approverId: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const rows = await db.select().from(mrvRequests).where(eq(mrvRequests.id, requestId));
    if (!rows || rows.length === 0) return { ok: false, error: 'Request not found' };
    const req = rows[0] as any;
    if (req.status === 'Approved' && req.mrvId) return { ok: true, id: req.mrvId };
    if (req.status !== 'Pending') return { ok: false, error: 'Request already processed' };

    // Generate or use reserved short
    const reservedShort = req.mrvShort && String(req.mrvShort).startsWith('MRV-') ? req.mrvShort : null;
    const reserved = reservedShort ? { short: reservedShort } : null;
    const createPayload: any = {
        residenceId: req.residenceId,
        items: (req.items || []).map((i: any) => ({ id: i.id, nameEn: i.nameEn, nameAr: i.nameAr, quantity: i.quantity })),
        meta: {
            supplierName: req.supplierName || undefined,
            invoiceNo: req.invoiceNo || undefined,
            notes: req.notes || undefined,
            attachmentUrl: req.attachmentUrl || null,
            attachmentPath: req.attachmentPath || null,
            mrvShort: reserved ? reserved.short : undefined
        }
    };

    const created = await createMRV(createPayload);
    if (!created || !created.ok) return { ok: false, error: created?.error || 'Failed to create MRV' };

    await db.update(mrvRequests).set({ status: 'Approved', approvedById: approverId, approvedAt: new Date().toISOString(), mrvId: created.id, mrvShort: reserved ? reserved.short : created.id }).where(eq(mrvRequests.id, requestId));

    // Optionally add notifications: notify requester and admins
    try {
        const requesterId = req.requestedById || null;
        if (requesterId) {
            await db.insert(notifications).values({ userId: requesterId, title: 'MRV Approved', message: `Your MRV request has been approved and posted (${created.id}).`, type: 'generic', href: `/inventory/receive/receipts/${created.id}`, referenceId: created.id, date: new Date().toISOString() });
        }
    } catch {};

    return { ok: true, id: created.id };
}

export async function getOrders() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(orders);
}

export async function getUser(id: string) {
    const d1 = await getD1();
    if (!d1) return null;
    const db = getDb(d1);
    const res = await db.select().from(users).where(eq(users.id, id));
    return res[0];
}

export async function getUserByEmail(email: string) {
    const d1 = await getD1();
    if (!d1) return null;
    const db = getDb(d1);
    const res = await db.select().from(users).where(eq(users.email, email));
    return res[0] || null;
}

export async function getUsers() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(users);
}

export async function setUserPasswordHash(id: string, hash: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, id));
    return { ok: true };
}
export async function updateUser(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(users).set(data).where(eq(users.id, id));
    return { ok: true };
}

export async function createUser(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    // Insert a new user with provided id. If a row with same id exists, ignore or return error.
    await db.insert(users).values({ id, ...data });
    return { ok: true };
}

// --- Inventory operations ---
export async function createInventoryItem(data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const id = data.id || `it_${Date.now()}`;
    await db.insert(inventory).values({ id, ...data });
    return { ok: true, id };
}

export async function updateInventoryItem(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(inventory).set(data).where(eq(inventory.id, id));
    return { ok: true };
}

export async function deleteInventoryItem(id: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.delete(inventory).where(eq(inventory.id, id));
    return { ok: true };
}

export async function issueStock(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterId = `miv-${yy}-${mm}`;

    const existing = await db.select().from(counters).where(eq(counters.id, counterId));
    let nextSeq = 1;
    if (existing.length > 0) {
        try {
            nextSeq = Number((existing[0] as any).seq || 0) + 1;
            await db.update(counters).set({ seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() }).where(eq(counters.id, counterId));
        } catch {
            await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
        }
    } else {
        await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
    }

    const codeShort = `MIV-${yy}${mmNoPad}${nextSeq}`;
    const id = codeShort;

    const residenceId = payload.residenceId;
    const items = payload.items || [];
    if (!residenceId || items.length === 0) return { ok: false, error: 'residenceId and items are required' };

    // Build totals
    const totals = new Map<string, number>();
    for (const it of items) totals.set(String(it.id), (totals.get(String(it.id)) || 0) + Number(it.quantity || 0));

    const itemIds = Array.from(totals.keys());
    const invRows = await db.select().from(inventory).where(inventory.id.in(itemIds));
    const invMap = new Map<string, any>();
    for (const r of invRows) invMap.set((r as any).id, r);

    // Validate stock
    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId) || {};
        let sbr: Record<string, number> = {};
        if (row && row.stockByResidence) {
            try { sbr = typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence; } catch { sbr = {} }
        }
        const cur = Math.max(0, Number(sbr[residenceId] || 0));
        if (cur < qty) return { ok: false, error: `Insufficient stock for item ${itemId}` };
    }

    const nowIso = now.toISOString();

    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId) || {};
        let sbr: Record<string, number> = {};
        if (row && row.stockByResidence) {
            try { sbr = typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence; } catch { sbr = {} }
        }
        const cur = Math.max(0, Number(sbr[residenceId] || 0));
        sbr[residenceId] = Math.max(0, cur - qty);
        const newTotal = Object.values(sbr).reduce((s: number, v: any) => s + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
        await db.update(inventory).set({ stockByResidence: JSON.stringify(sbr), stock: newTotal }).where(eq(inventory.id, itemId));

        await db.insert(inventoryTransactions).values({
            itemId,
            itemNameEn: row?.nameEn || '',
            itemNameAr: row?.nameAr || '',
            residenceId,
            date: nowIso,
            type: 'OUT',
            quantity: qty,
            referenceDocId: codeShort,
            locationName: payload.locationName || 'Issued'
        });
    }

    await db.insert(mivs).values({ id, date: nowIso, residenceId, itemCount: totals.size, locationName: payload.locationName || '' });

    return { ok: true, id };
}

export async function transferStock(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const { fromResidenceId, toResidenceId, items } = payload;
    if (!fromResidenceId || !toResidenceId || !items || items.length === 0) return { ok: false, error: 'fromResidenceId, toResidenceId and items are required' };

    const nowIso = new Date().toISOString();

    // Build totals
    const totals = new Map<string, number>();
    for (const it of items) totals.set(String(it.id), (totals.get(String(it.id)) || 0) + Number(it.quantity || 0));

    const itemIds = Array.from(totals.keys());
    const invRows = await db.select().from(inventory).where(inventory.id.in(itemIds));
    const invMap = new Map<string, any>();
    for (const r of invRows) invMap.set((r as any).id, r);

    // Validate source
    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId) || {};
        let sbr: Record<string, number> = {};
        if (row && row.stockByResidence) {
            try { sbr = typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence; } catch { sbr = {} }
        }
        const cur = Math.max(0, Number(sbr[fromResidenceId] || 0));
        if (cur < qty) return { ok: false, error: `Insufficient stock at source for item ${itemId}` };
    }

    // Use a simple transfer id
    const transferId = `TRS-${Date.now()}`;

    for (const [itemId, qty] of totals.entries()) {
        const row = invMap.get(itemId) || {};
        let sbr: Record<string, number> = {};
        if (row && row.stockByResidence) {
            try { sbr = typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence; } catch { sbr = {} }
        }
        const curFrom = Math.max(0, Number(sbr[fromResidenceId] || 0));
        sbr[fromResidenceId] = Math.max(0, curFrom - qty);
        sbr[toResidenceId] = Math.max(0, Number(sbr[toResidenceId] || 0)) + qty;
        const newTotal = Object.values(sbr).reduce((s: number, v: any) => s + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
        await db.update(inventory).set({ stockByResidence: JSON.stringify(sbr), stock: newTotal }).where(eq(inventory.id, itemId));

        await db.insert(inventoryTransactions).values({
            itemId,
            itemNameEn: row?.nameEn || '',
            itemNameAr: row?.nameAr || '',
            residenceId: fromResidenceId,
            date: nowIso,
            type: 'TRANSFER_OUT',
            quantity: qty,
            referenceDocId: transferId,
            locationName: `Transfer to ${toResidenceId}`
        });
        await db.insert(inventoryTransactions).values({
            itemId,
            itemNameEn: row?.nameEn || '',
            itemNameAr: row?.nameAr || '',
            residenceId: toResidenceId,
            date: nowIso,
            type: 'TRANSFER_IN',
            quantity: qty,
            referenceDocId: transferId,
            locationName: `Transfer from ${fromResidenceId}`
        });
    }

    return { ok: true, id: transferId };
}

export async function reconcileStock(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);

    const { residenceId, adjustments, performedById } = payload;
    if (!residenceId || !adjustments || adjustments.length === 0) return { ok: false, error: 'residenceId and adjustments are required' };

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterId = `recon-${yy}-${mm}`;

    const existing = await db.select().from(counters).where(eq(counters.id, counterId));
    let nextSeq = 1;
    if (existing.length > 0) {
        try {
            nextSeq = Number((existing[0] as any).seq || 0) + 1;
            await db.update(counters).set({ seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() }).where(eq(counters.id, counterId));
        } catch {
            await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
        }
    } else {
        await db.insert(counters).values({ id: counterId, seq: nextSeq, yy, mm, updatedAt: new Date().toISOString() });
    }

    const reconId = `RECON-${yy}${mmNoPad}${nextSeq}`;
    let increase = 0;
    let decrease = 0;

    for (const adj of adjustments) {
        const itemId = String(adj.itemId);
        const actual = Number(adj.actualQty || 0);
        const rowArr = await db.select().from(inventory).where(eq(inventory.id, itemId));
        const row = rowArr[0] as any || {};
        let sbr: Record<string, number> = {};
        if (row && row.stockByResidence) {
            try { sbr = typeof row.stockByResidence === 'string' ? JSON.parse(row.stockByResidence) : row.stockByResidence; } catch { sbr = {} }
        }
        const cur = Math.max(0, Number(sbr[residenceId] || 0));
        const diff = actual - cur;
        sbr[residenceId] = Math.max(0, actual);
        const newTotal = Object.values(sbr).reduce((s: number, v: any) => s + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
        await db.update(inventory).set({ stockByResidence: JSON.stringify(sbr), stock: newTotal }).where(eq(inventory.id, itemId));

        if (diff !== 0) {
            if (diff > 0) increase += diff; else decrease += Math.abs(diff);
            await db.insert(inventoryTransactions).values({
                itemId,
                itemNameEn: row?.nameEn || '',
                itemNameAr: row?.nameAr || '',
                residenceId,
                date: new Date().toISOString(),
                type: 'ADJUSTMENT',
                quantity: diff,
                referenceDocId: reconId,
                overrideReason: adj.reason || 'Audit adjustment'
            });
        }
    }

    await db.insert(stockReconciliations).values({ id: reconId, residenceId, date: new Date().toISOString(), itemCount: adjustments.length, totalIncrease: increase, totalDecrease: decrease, performedById });

    return { ok: true, id: reconId };
}

// --- Maintenance Requests ---
export async function createMaintenanceRequest(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const nowIso = new Date().toISOString();
    const id = `MREQ-${Date.now()}`;
    await db.insert(serviceOrders).values({ id, dateCreated: nowIso, residenceId: payload.residenceId, residenceName: payload.residenceName || '', destination: JSON.stringify(payload.destination || {}), status: 'PENDING', createdById: payload.requestedById, items: JSON.stringify(payload.items || []) });
    return { ok: true, id };
}

export async function updateMaintenanceRequest(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(serviceOrders).set(data).where(eq(serviceOrders.id, id));
    return { ok: true };
}

export async function getMaintenanceRequests() {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(serviceOrders);
}

export async function assignMaintenance(requestId: string, assigneeId: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const nowIso = new Date().toISOString();
    await db.update(serviceOrders).set({ dispatchedById: assigneeId, dispatchedAt: nowIso, status: 'DISPATCHED' }).where(eq(serviceOrders.id, requestId));
    return { ok: true };
}

// --- Orders workflow ---
export async function createOrder(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const nowIso = new Date().toISOString();
    const id = `ORD-${Date.now()}`;
    await db.insert(orders).values({ id, residence: payload.residence || '', residenceId: payload.residenceId || null, items: JSON.stringify(payload.items || []), requestedById: payload.requestedById || null, requestedByName: payload.requestedByName || null, notes: payload.notes || null, date: nowIso, status: 'Pending' });
    return { ok: true, id };
}

export async function approveOrder(orderId: string, approverId: string, approverName?: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(orders).set({ status: 'Approved', approvedById: approverId, approvedByName: approverName || null }).where(eq(orders.id, orderId));
    return { ok: true };
}

export async function rejectOrder(orderId: string, approverId: string, reason?: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(orders).set({ status: 'Rejected', approvedById: approverId, notes: reason || null }).where(eq(orders.id, orderId));
    return { ok: true };
}

export async function updateOrderStatus(orderId: string, status: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(orders).set({ status }).where(eq(orders.id, orderId));
    return { ok: true };
}

// --- Notifications ---
export async function createNotification(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const id = `N-${Date.now()}`;
    const nowIso = new Date().toISOString();
    await db.insert(notifications).values({ id, title: payload.title || '', body: payload.body || '', createdAt: nowIso, read: 0, userId: payload.userId || null });
    return { ok: true, id };
}

export async function markAsRead(notificationId: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(notifications).set({ read: 1 }).where(eq(notifications.id, notificationId));
    return { ok: true };
}

export async function deleteNotification(notificationId: string) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.delete(notifications).where(eq(notifications.id, notificationId));
    return { ok: true };
}

export async function getUserNotifications(userId: string) {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
}

// --- Audit Logs ---
export async function createAuditLog(payload: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const id = `A-${Date.now()}`;
    const ts = new Date().toISOString();
    await db.insert(auditLogs).values({ id, userId: payload.userId || null, userName: payload.userName || null, action: payload.action || null, entityType: payload.entityType || null, entityId: payload.entityId || null, summary: payload.summary || null, before: payload.before ? JSON.stringify(payload.before) : null, after: payload.after ? JSON.stringify(payload.after) : null, meta: payload.meta ? JSON.stringify(payload.meta) : null, timestamp: ts });
    return { ok: true, id };
}

export async function getAuditLogs(filters: any = {}) {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);

    let query: any = db.select().from(auditLogs);
    if (filters.userId) query = query.where(eq(auditLogs.userId, filters.userId));
    if (filters.entityType) query = query.where(eq(auditLogs.entityType, filters.entityType));
    if (filters.action) query = query.where(eq(auditLogs.action, filters.action));
    // date range filter (ISO)
    if (filters.from || filters.to) {
        // fallback to in-memory filter after fetch since schema stores timestamp as text
        const rows = await query;
        return rows.filter((r: any) => {
            const ts = r.timestamp;
            if (!ts) return false;
            const t = new Date(ts);
            if (filters.from && new Date(filters.from) > t) return false;
            if (filters.to && new Date(filters.to) < t) return false;
            return true;
        });
    }
    return await query;
}

// --- Feedback ---
export async function createFeedback(data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    const id = `FB-${Date.now()}`;
    const nowIso = new Date().toISOString();
    await db.insert(feedback).values({ id, userId: data.userId || null, title: data.title || null, description: data.description || null, category: data.category || null, deviceInfo: data.deviceInfo ? JSON.stringify(data.deviceInfo) : null, appInfo: data.appInfo ? JSON.stringify(data.appInfo) : null, settings: data.settings ? JSON.stringify(data.settings) : null, categoryAuto: data.categoryAuto || null, ticketId: data.ticketId || null, priority: data.priority || null, screenshotUrl: data.screenshotUrl || null, status: data.status || 'Open', createdAt: nowIso });
    return { ok: true, id };
}

export async function updateFeedback(id: string, data: any) {
    const d1 = await getD1();
    if (!d1) return { ok: false, error: 'D1 binding missing' };
    const db = getDb(d1);
    await db.update(feedback).set(data).where(eq(feedback.id, id));
    return { ok: true };
}

export async function getFeedback(id?: string) {
    const d1 = await getD1();
    if (!d1) return [];
    const db = getDb(d1);
    if (id) {
        const rows = await db.select().from(feedback).where(eq(feedback.id, id));
        return rows[0] || null;
    }
    return await db.select().from(feedback);
}
