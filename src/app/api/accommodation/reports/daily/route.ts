import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { dateISO } = await request.json();
    if (typeof window === 'undefined') return NextResponse.json({ ok: true, report: {} });
    try {
      const oRaw = localStorage.getItem('ac_occupants');
      const wRaw = localStorage.getItem('ac_workers');
      const occupants = oRaw ? JSON.parse(oRaw) : [];
      const workers = wRaw ? JSON.parse(wRaw) : [];
      const date = dateISO ? new Date(dateISO) : new Date();
      const dayStr = date.toISOString().slice(0,10);
      const res: Record<string, Record<string, number>> = {};
      for (const occ of occupants) {
        const sinceDay = occ.since.slice(0,10);
        if (sinceDay <= dayStr) {
          res[occ.residenceId] = res[occ.residenceId] || {};
          const w = workers.find((x: any) => x.id === occ.workerId);
          const nat = w?.nationaliy || 'Unknown';
          res[occ.residenceId][nat] = (res[occ.residenceId][nat] || 0) + 1;
        }
      }
      return NextResponse.json({ ok: true, report: res });
    } catch (e) {
      console.error('daily report error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
