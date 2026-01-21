import { NextRequest, NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { userId, title, description, category, screenshotUrl, errorCode, errorMessage, stack, deviceInfo, appInfo, settings } = body || {};
    if (!title || !category) return NextResponse.json({ error: 'Missing title or category' }, { status: 400 });

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

    const created = await D1Actions.createFeedback(env, {
      userId: userId || null,
      title,
      description: description || null,
      category,
      status: 'new',
      priority: 'medium',
      screenshotUrl: screenshotUrl || null,
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      stack: stack || null,
      deviceInfo: deviceInfo || null,
      appInfo: appInfo || null,
      settings: settings || null,
    });

    if (!created || !(created as any).ok) {
      return NextResponse.json({ error: (created as any)?.error || 'Failed' }, { status: 500 });
    }

    return NextResponse.json({ id: (created as any).id, ticketId: (created as any).ticketId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const rows = (await D1Actions.getFeedback(env, { userId: userId || undefined, limit: 100 })) as any[];
    const items = (rows || []).sort((a: any, b: any) => {
      const da = a?.createdAt ? new Date(a.createdAt) : new Date(0);
      const dbb = b?.createdAt ? new Date(b.createdAt) : new Date(0);
      return +dbb - +da;
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


export const runtime = 'edge';
