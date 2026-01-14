import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('createMRV integration', () => {
  it('creates MRV, updates inventory and logs transactions', async () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');

    // in-memory state
    const inventoryRows: any[] = [{ id: 'item-1', nameEn: 'Item 1', nameAr: 'عنصر 1', stockByResidence: { 'R-1': 5 }, stock: 5 }];
    const transactions: any[] = [];
    const mrvs: any[] = [];

    // Mock getRequestContext -> provide D1 binding
    vi.doMock('@cloudflare/next-on-pages', () => ({ getRequestContext: vi.fn(() => ({ env: { DB: {} } })) }));

    // Provide tiny schema shims used in code (include id.in helper)
    vi.doMock('../db/schema', () => ({
      serviceOrders: { name: 'service_orders' },
      counters: { name: 'counters' },
      inventory: { name: 'inventory', id: { in: (arr: any) => ({ queryChunks: [{ value: Array.isArray(arr) ? arr.map((v: any) => ({ value: v })) : [{ value: arr }] }] }) } },
      inventoryTransactions: { name: 'inventory_transactions' },
      mrvs: { name: 'mrvs' },
    }));

    // Mock getDb to respond to selects/inserts/updates used by createMRV
    vi.doMock('./db', () => ({ getDb: (d1: any) => ({
      select: () => ({
        from: (table: any) => ({
          where: async (pred: any) => {
            // Try to inspect drizzle predicate chunks for params
            const chunks = pred && pred.queryChunks ? pred.queryChunks : [];
            const contains = (needle: string) => {
              for (const c of chunks) {
                if (!c) continue;
                if (typeof c.value === 'string' && c.value.includes(needle)) return true;
                if (Array.isArray(c.value)) {
                  for (const v of c.value) {
                    if (v && v.value === needle) return true;
                  }
                }
                if (String(c).includes(needle)) return true;
              }
              return String(pred || '').includes(needle);
            };

            // counters query
            if (contains(`mrv-${yy}-${mm}`) || String(pred || '').includes('mrv-')) {
              return [{ id: `mrv-${yy}-${mm}`, seq: 7, yy, mm }];
            }
            if (contains('item-1') || String(pred || '').includes('inventory')) return inventoryRows;
            return [];
          }
        })
      }),
      update: (table: any) => ({
        set: (vals: any) => ({ where: async (_pred: any) => {
          // Apply updates to in-memory inventory when inventory table updated
          if ((table as any).name === 'inventory' || String(table).includes('inventory')) {
            if (typeof vals.stockByResidence !== 'undefined') inventoryRows[0].stockByResidence = vals.stockByResidence;
            if (typeof vals.stock !== 'undefined') inventoryRows[0].stock = vals.stock;
          }
          return;
        } })
      }),
      insert: (table: any) => ({
        values: async (vals: any) => {
          // capture inserts
          if (String(table).includes('inventory_transactions') || (table as any).name === 'inventory_transactions') {
            transactions.push(vals);
          }
          if (String(table).includes('mrvs') || (table as any).name === 'mrvs') {
            mrvs.push(vals);
          }
        }
      })
    }) }));

    const { createMRV } = await import('./d1-actions');

    const res = await createMRV({ residenceId: 'R-1', items: [{ id: 'item-1', nameEn: 'Item 1', nameAr: 'عنصر 1', quantity: 3 }], meta: {} });
    expect(res.ok).toBe(true);
    expect(typeof res.id).toBe('string');

    // Check MRV was inserted
    expect(mrvs.length).toBe(1);
    expect(mrvs[0].id).toBe(res.id);

    // Check inventory transaction logged
    const tx = transactions.find(t => t.type === 'IN' && t.itemId === 'item-1');
    expect(tx).toBeTruthy();
    expect(tx.quantity).toBe(3);

    // Check inventory in-memory updated (stockByResidence changed)
    const raw = inventoryRows[0].stockByResidence;
    const sbr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    expect(sbr['R-1']).toBe(8); // 5 + 3
  });
});

describe('receiveServiceOrder no-op', () => {
  it('returns Nothing to do when updates empty and forceComplete false', async () => {
    vi.doMock('@cloudflare/next-on-pages', () => ({ getRequestContext: vi.fn(() => ({ env: { DB: {} } })) }));
    // Provide a fake order so function sees an existing order and can return 'Nothing to do'
    const fakeOrder = { id: 'order-x', codeShort: 'SO-X', residenceId: 'R-1', items: JSON.stringify([{ itemId: 'item-1', qtySent: 2, qtyReturned: 0, qtyScrapped: 0 }]), status: 'DISPATCHED' };
    vi.doMock('./db', () => ({ getDb: (d1: any) => ({ select: () => ({ from: (_t: any) => ({ where: async () => [fakeOrder] })}), update: () => ({ set: () => ({ where: async () => {} }) }), insert: () => ({ values: async () => {} }) }) }));

    const { receiveServiceOrder } = await import('./d1-actions');
    const res = await receiveServiceOrder('order-x', [], 'user-x', false);
    expect(res.ok).toBe(true);
    expect(res.message).toBe('Nothing to do');
  });
});
