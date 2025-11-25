import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'CSV_ASSIGN_API_REMOVED_FROM_PRODUCTION',
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: false,
    error: 'CSV_ASSIGN_API_REMOVED_FROM_PRODUCTION',
  });
}
