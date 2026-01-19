import { describe, it, expect, beforeAll } from 'vitest';

// These smoke tests are skipped by default. To run them locally, start the dev server
// with a real Cloudflare D1 binding (e.g. `npm run dev:d1`) and run:
// RUN_D1_SMOKE=true npm run test:smoke

const ENABLED = String(process.env.RUN_D1_SMOKE || '').toLowerCase() === 'true';
const BASE = process.env.D1_SMOKE_BASE || 'http://localhost:9002';
const TOKEN = process.env.D1_SMOKE_TOKEN || '';

const makeHeaders = (extra: Record<string,string> = {}) => {
  const h: Record<string,string> = { 'Content-Type': 'application/json', ...extra };
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`;
  return h;
};

describe.skipIf(!ENABLED)('Cloudflare D1 smoke tests (requires running server + D1 binding)', () => {
  it('GET /api/d1?action=getServiceOrders returns ok', async () => {
    const res = await fetch(`${BASE}/api/d1`, {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ action: 'getServiceOrders' })
    });
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.result)).toBe(true);
  });

  it('createMRV -> should return ok when D1 available', async () => {
    const payload = { residenceId: 'R-1', items: [{ id: 'item-smoke', nameEn: 'Smoke Item', nameAr: 'عنصر', quantity: 1 }], meta: {} };
    const res = await fetch(`${BASE}/api/d1`, {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ action: 'createMRV', args: [payload] })
    });
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.result && (json.result.ok === true || json.result.id !== undefined)).toBe(true);
  });

  it('createServiceOrder -> receiveServiceOrder -> verify ok', async () => {
    // create service order
    const orderPayload = {
      residenceId: 'R-1',
      residenceName: 'Smoke Residence',
      destination: { name: 'Workshop' },
      createdById: 'smoke-user',
      dispatchedById: 'smoke-user',
      transportInfo: {},
      notes: 'Smoke test',
      items: [{ id: 'item-smoke', nameEn: 'Smoke Item', nameAr: 'عنصر', quantity: 2 }]
    };
    const createRes = await fetch(`${BASE}/api/d1`, { method: 'POST', headers: makeHeaders(), body: JSON.stringify({ action: 'createServiceOrder', args: [orderPayload] }) });
    const createJson: any = await createRes.json();
    expect(createJson.ok).toBe(true);
    const soId = createJson.result?.id || createJson.result?.codeShort || null;
    expect(soId).toBeTruthy();

    // receive it
    const recvRes = await fetch(`${BASE}/api/d1`, { method: 'POST', headers: makeHeaders(), body: JSON.stringify({ action: 'receiveServiceOrder', args: [soId, [{ itemId: 'item-smoke', addReturned: 2, addScrapped: 0 }], 'smoke-user'] }) });
    const recvJson: any = await recvRes.json();
    expect(recvJson.ok).toBe(true);
    // success can be { ok:true } or { ok:true, result: { ok:true }} depending on server
    const okFlag = recvJson.result ? recvJson.result.ok !== false : true;
    expect(okFlag).toBe(true);
  });
});
