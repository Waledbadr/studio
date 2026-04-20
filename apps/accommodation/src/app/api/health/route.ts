export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
}
