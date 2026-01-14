import { describe, it, expect, vi, beforeEach } from 'vitest';

// Tests for D1 actions (server-side). We mock getRequestContext and getDb

beforeEach(() => {
  // Reset module registry so mocks take effect per test
  vi.resetModules();
});

describe('createMRV behavior', () => {
  it('returns D1 binding missing when no D1 binding available', async () => {
    // Mock getRequestContext to throw so getD1() returns null
    vi.doMock('@cloudflare/next-on-pages', () => ({ getRequestContext: vi.fn(() => { throw new Error('no ctx'); }) }));

    const { createMRV } = await import('./d1-actions');
    const res = await createMRV({ residenceId: 'R-1', items: [{ id: 'i1', nameEn: 'Item 1', nameAr: 'عنصر 1', quantity: 1 }], meta: {} });
    expect(res).toEqual({ ok: false, error: 'D1 binding missing' });
  });
});

describe('approveMRVRequest behavior', () => {
  it('returns existing mrv id when request already approved', async () => {
    // Mock getRequestContext to return a fake env.DB so getD1 succeeds
    vi.doMock('@cloudflare/next-on-pages', () => ({ getRequestContext: vi.fn(() => ({ env: { DB: {} } })) }));

    // Mock ./db.getDb to return a fake db with select().from().where() chain
    vi.doMock('./db', () => ({ getDb: (d1: any) => ({
      select: () => ({
        from: (_table: any) => ({
          where: (_pred: any) => Promise.resolve([{ id: 'req-1', status: 'Approved', mrvId: 'MRV-123' }])
        })
      }),
      // update and insert not needed for this specific test
    }) }));

    const { approveMRVRequest } = await import('./d1-actions');
    const res = await approveMRVRequest('req-1', 'approver-1');
    expect(res).toEqual({ ok: true, id: 'MRV-123' });
  });
});
