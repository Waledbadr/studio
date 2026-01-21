import { NextRequest, NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body: any = await req.json();
    const { status, priority, ticketId, autoRenumber } = body || {};

    const env = await getCloudflareEnvRecord();
    if (!env || !(env as any).DB) {
      return NextResponse.json(
        {
          error:
            'D1 binding not available. If running locally, start the app with `npm run dev:d1` (Cloudflare Pages dev) so `getRequestContext().env.DB` is present.'
        },
        { status: 503 }
      );
    }

    const existing = await D1Actions.getFeedback(env, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patch: any = { updatedAt: new Date().toISOString() };
    if (status) {
      patch.status = status;
      if (status === 'resolved') patch.resolvedAt = new Date().toISOString();
      if (status === 'in_progress') patch.startedAt = new Date().toISOString();
    }
    if (priority) patch.priority = priority;

    let newTicketId: string | undefined;
    if (typeof ticketId === 'string' && ticketId.trim()) {
      newTicketId = ticketId.trim().toUpperCase();
      patch.ticketId = newTicketId;
    } else if (autoRenumber) {
      const createdAt = (existing as any)?.createdAt ? new Date((existing as any).createdAt) : new Date();
      const gen = await D1Actions.generateFeedbackTicketId(env, createdAt.getFullYear(), createdAt.getMonth() + 1);
      if (gen && (gen as any).ok) {
        newTicketId = (gen as any).ticketId;
        patch.ticketId = newTicketId;
      }
    }

    await D1Actions.updateFeedback(env, id, patch);

    return NextResponse.json({ ok: true, ticketId: newTicketId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


export const runtime = 'edge';
