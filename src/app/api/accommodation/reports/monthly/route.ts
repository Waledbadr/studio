import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { year, month } = await request.json();
    if (typeof window === 'undefined') return NextResponse.json({ ok: true, report: {} });
    try {
      const oRaw = localStorage.getItem('ac_occupants');
      const occupants = oRaw ? JSON.parse(oRaw) : [];
      const start = new Date(Date.UTC(year, month-1, 1));
      const end = new Date(Date.UTC(year, month, 1));
      const perResidence: Record<string, number> = {};
      const perOccupant: Record<string, number> = {};
      for (const occ of occupants) {
        const since = new Date(occ.since);
        if (since < end) {
          const overlapStart = since < start ? start : since;
          const overlapDays = Math.ceil((end.getTime() - overlapStart.getTime()) / (1000*60*60*24));
          perResidence[occ.residenceId] = (perResidence[occ.residenceId] || 0) + overlapDays;
          perOccupant[occ.workerId] = (perOccupant[occ.workerId] || 0) + overlapDays;
        }
      }
      return NextResponse.json({ ok: true, report: { perResidence, perOccupant } });
    } catch (e) {
      console.error('monthly report error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
