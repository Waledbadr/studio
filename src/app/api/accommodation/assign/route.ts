import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
  // Expected body: { workerId | workerIds, residenceId, roomId }
  const { workerId, workerIds, residenceId, roomId } = body || {};
  if ((!workerId && !Array.isArray(workerIds)) || !residenceId || !roomId) return NextResponse.json({ ok: false, error: 'missing-params' }, { status: 400 });

    // Simple localStorage-backed persistence for prototype: read ac_occupants, ac_workers
    // Note: On serverless edge, localStorage isn't available. This route is useful in the dev client where window exists.
    if (typeof window === 'undefined') {
      // server environment: just echo and mark as accepted
      return NextResponse.json({ ok: true, assigned: { workerId, residenceId, roomId } });
    }

    try {
      const workersRaw = localStorage.getItem('ac_workers');
      const occRaw = localStorage.getItem('ac_occupants');
      const workers = workersRaw ? JSON.parse(workersRaw) : [];
      const occupants = occRaw ? JSON.parse(occRaw) : [];
      const toAssign = Array.isArray(workerIds) ? workerIds : [workerId];
      const assigned: any[] = [];
      for (const wid of toAssign) {
        const w = workers.find((x: any) => x.id === wid);
        if (!w) continue;
        occupants.push({ workerId: wid, residenceId, roomId, since: new Date().toISOString() });
        assigned.push(wid);
      }
      localStorage.setItem('ac_occupants', JSON.stringify(occupants));
      return NextResponse.json({ ok: true, assigned });
    } catch (e) {
      console.error('assign route error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
