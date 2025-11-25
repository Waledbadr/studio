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
      // Graceful fallback when no key is configured – let caller know in a friendly way.
      return NextResponse.json(
        {
          error: 'TRANSLATION_DISABLED_NO_KEY',
        },
        { status: 200 }
      );
    }

    const result = await translateItemName({ name });
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    console.error('Translation API error:', e);
  return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
