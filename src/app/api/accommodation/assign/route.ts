import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expected body: { residenceId, roomId, tenantName }
    console.log('Accommodation assign received:', body);

    // TODO: integrate with your DB (Firestore) to persist assignment.
    // For now return success and echo the payload.

    return NextResponse.json({ ok: true, assigned: body });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
