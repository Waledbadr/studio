import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Dev-only endpoint to return the prepared upload file so client can import into localStorage
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), 'inventory_ready_for_upload.json');
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ ok: false, error: 'inventory_ready_for_upload.json not found' }, { status: 404 });
  }

  try {
    const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}