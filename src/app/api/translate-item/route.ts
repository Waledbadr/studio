export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

// In production we completely disable Genkit-powered translation to avoid
// pulling heavy Genkit/OpenTelemetry/handlebars dependencies into the
// Next.js build. The UI should treat this as "no automatic translation".

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: name is required' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'production') {
      // Hard-disable translation in production to keep deployment stable.
      return NextResponse.json(
        {
          error: 'TRANSLATION_DISABLED_IN_PRODUCTION',
          originalName: name,
        },
        { status: 200 }
      );
    }

    // In development we also avoid importing Genkit here so that
    // `next build` on Render never sees Genkit. For local Genkit
    // experiments, use `npm run genkit:dev` instead of this endpoint.

    return NextResponse.json({
      translated: name,
      note: 'Dev fallback – Genkit translation disabled in this route.',
    });
  } catch (e: any) {
    console.error('Translation API error:', e);
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
