import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('d1 route receiveServiceOrder integration', () => {
  it('applies returned and scrapped quantities and updates order status', async () => {
    // Setup in-memory DB state
    const orderId = 'order-1';
    const initialOrder = {
      id: orderId,
      codeShort: 'SO-1',
      residenceId: 'R-1',
      items: JSON.stringify([
        { itemId: 'item-1', itemNameEn: 'Item 1', itemNameAr: 'عنصر 1', qtySent: 5, qtyReturned: 0, qtyScrapped: 0 }
      ]),
      status: 'DISPATCHED',
    };

    const initialInventory = {
      id: 'item-1',
      nameEn: 'Item 1',
      nameAr: 'عنصر 1',
      stockByResidence: JSON.stringify({ 'R-1': 10 }),
      stock: 10,
    };

    const transactions: any[] = [];

    // Mock getRequestContext to provide a DB binding
    vi.doMock('@cloudflare/next-on-pages', () => ({ getRequestContext: vi.fn(() => ({ env: { DB: {} } })) }));

    // Make sure table columns used like `inventory.id.in(...)` exist so code doesn't throw
    vi.doMock('../db/schema', () => ({
      serviceOrders: { name: 'service_orders' },
      inventory: { name: 'inventory', id: { in: (arr: any) => ({ queryChunks: [{ value: Array.isArray(arr) ? arr.map((v: any) => ({ value: v })) : [{ value: arr }] }] }) } },
      inventoryTransactions: { name: 'inventory_transactions' }
    }));

    // Mock ./db.getDb to return a fake db interacting with the in-memory state
    vi.doMock('./db', () => ({ getDb: (d1: any) => {
      return {
        select: () => ({
          from: (table: any) => ({
            where: async (pred: any) => {
              console.log('PRED DEBUG ->', pred);
              // Inspect drizzle predicate chunks for values
              const chunks = pred && pred.queryChunks ? pred.queryChunks : [];
              const containsNeedle = (needle: string) => {
                for (const c of chunks) {
                  if (!c) continue;
                  try {
                    if (typeof c.value === 'string' && c.value.includes(needle)) return true;
                    if (Array.isArray(c.value)) {
                      for (const v of c.value) {
                        if (v && v.value === needle) return true;
                      }
                    }
                    if (String(c).includes(needle)) return true;
                  } catch {}
                }
                // fallback to plain string
                return String(pred || '').includes(needle) || String(pred || '').includes(needle.replace('-', '_'));
              };
              if (containsNeedle(orderId) || String(pred).includes('service_orders')) return [initialOrder];
              if (containsNeedle('item-1') || String(pred).includes('inventory')) return [initialInventory];
              return [];
            }
          })
        }),
        update: (table: any) => ({
          set: (vals: any) => ({
            where: async (_pred: any) => {
              if ((table as any).name === 'service_orders' || String(table).includes('service_orders')) {
                // Apply updates to initialOrder
                if (vals.items) initialOrder.items = vals.items;
                if (vals.status) initialOrder.status = vals.status;
                return;
              }
              if ((table as any).name === 'inventory' || String(table).includes('inventory')) {
                if (vals.stockByResidence) initialInventory.stockByResidence = vals.stockByResidence;
                if (typeof vals.stock !== 'undefined') initialInventory.stock = vals.stock;
                return;
              }
            }
          })
        }),
        insert: (table: any) => ({
          values: async (vals: any) => {
            if ((table as any).name === 'inventory_transactions' || String(table).includes('inventory_transactions')) {
              transactions.push(vals);
            }
            return;
          }
        })
      } as any;
    } }));

    // Call the server-side action directly (mocking getDb) to validate behavior
    const { receiveServiceOrder } = await import('./d1-actions');
    const res = await receiveServiceOrder(orderId, [{ itemId: 'item-1', addReturned: 2, addScrapped: 1 }], 'user-1');
    // DEBUG: show response
    console.log('D1 action response:', JSON.stringify(res));
    expect(res.ok).toBe(true);

    // Validate inventory updated
    const sbr = JSON.parse(initialInventory.stockByResidence);
    expect(sbr['R-1']).toBe(12); // 10 + 2
    expect(initialInventory.stock).toBeGreaterThanOrEqual(12);

    // Validate an IN transaction and a DEPRECIATION transaction were created
    const foundIn = transactions.find(t => t.type === 'IN' && t.itemId === 'item-1');
    const foundDep = transactions.find(t => t.type === 'DEPRECIATION' && t.itemId === 'item-1');
    expect(foundIn).toBeTruthy();
    expect(foundIn.quantity).toBe(2);
    expect(foundDep).toBeTruthy();
    expect(foundDep.quantity).toBe(1);

    // Validate order lines updated and status set to PARTIAL_RETURN
    const updatedItems = JSON.parse(initialOrder.items);
    expect(updatedItems[0].qtyReturned).toBe(2);
    expect(updatedItems[0].qtyScrapped).toBe(1);
    expect(initialOrder.status).toBe('PARTIAL_RETURN');
  });
});
