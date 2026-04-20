import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expected: { from?:{residenceId,roomId}, to: {residenceId,roomId?}, workerIds: [], requestedBy }
    const { from, to, workerIds, requestedBy, reason } = body || {};
    if (!to || !to.residenceId || !Array.isArray(workerIds) || workerIds.length === 0 || !requestedBy) return NextResponse.json({ ok: false, error: 'missing-params' }, { status: 400 });

    if (typeof window === 'undefined') {
      return NextResponse.json({ ok: true, request: { from, to, workerIds, requestedBy } });
    }

    try {
      const tRaw = localStorage.getItem('ac_transfers');
      const transfers = tRaw ? JSON.parse(tRaw) : [];
      const id = `trs_${Date.now()}`;
      const tr = { id, from, to, workerIds, requestedBy, requestedAt: new Date().toISOString(), status: 'Pending', reason };
      transfers.unshift(tr);
      localStorage.setItem('ac_transfers', JSON.stringify(transfers));
      // notification
      const nRaw = localStorage.getItem('ac_notifications');
      const notes = nRaw ? JSON.parse(nRaw) : [];
      notes.unshift({ id: `n_${Date.now()}`, title: 'New transfer request', body: `Transfer ${id} to ${to.residenceId}`, createdAt: new Date().toISOString(), read: false });
      localStorage.setItem('ac_notifications', JSON.stringify(notes));
      return NextResponse.json({ ok: true, request: tr });
    } catch (e) {
      console.error('transfer route error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
