export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { translateItemName } from '@/ai/flows/translate-item-flow';
import '@/ai/genkit'; // ensure env checks/logs run

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Invalid payload: name is required' }, { status: 400 });
    }

  // Before invoking Genkit, verify the Gemini key exists to return a clearer error
  const hasKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLEAI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!hasKey) {
    return NextResponse.json(
      {
        error:
          'FAILED_PRECONDITION: Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLEAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY) in your environment.'
      },
      { status: 400 }
    );
  }

  const result = await translateItemName({ name });
  return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    console.error('Translation API error:', e);
  return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
