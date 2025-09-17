import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { q } = await request.json();
    if (typeof window === 'undefined') return NextResponse.json({ ok: true, results: [] });
    // search in ac_workers
    try {
      const wRaw = localStorage.getItem('ac_workers');
      const workers = wRaw ? JSON.parse(wRaw) : [];
      if (!q || !q.trim()) return NextResponse.json({ ok: true, results: workers });
      const norm = q.trim().toLowerCase();
      const results = workers.filter((w: any) => (w.name || '').toLowerCase().includes(norm) || (w.id || '').toLowerCase().includes(norm) || (w.nationaliy || '').toLowerCase().includes(norm));
      return NextResponse.json({ ok: true, results });
    } catch (e) {
      console.error('search route error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
