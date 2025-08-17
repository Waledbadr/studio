export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { translateItemName } from '@/ai/flows/translate-item-flow';

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Invalid payload: name is required' }, { status: 400 });
    }

  const result = await translateItemName({ name });
  return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    console.error('Translation API error:', e);
  return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
