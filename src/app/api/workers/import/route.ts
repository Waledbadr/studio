import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';
import { getDb } from '@/lib/db';
import { workers as workersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/workers/import
 * 
 * Imports workers data from JSON file into Cloudflare D1 'workers' table.
 * Accepts JSON array of workers with fields: id, name, nationality, role
 * 
 * Body: { workers: Worker[] } or Worker[]
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: any = await request.json();

    // Support both { workers: [...] } and direct array
    const workersData = Array.isArray(body) ? body : (body.workers || []);

    if (!Array.isArray(workersData) || workersData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of workers.' },
        { status: 400 }
      );
    }

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

    const db = getDb((env as any).DB);

    const results = {
      total: workersData.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each worker
    for (let i = 0; i < workersData.length; i++) {
      const worker = workersData[i];

      try {
        // Validate required fields
        if (!worker.name || typeof worker.name !== 'string') {
          results.errors.push(`Worker #${i + 1}: Missing or invalid name`);
          results.skipped++;
          continue;
        }

        // Generate ID if not provided
        const workerId = worker.id || `w_${Date.now()}_${i}`;

        // Normalize role
        let role: 'Worker' | 'Supervisor' | 'Engineer' = 'Worker';
        if (worker.role === 'Supervisor' || worker.role === 'Engineer') {
          role = worker.role;
        }

        // Prepare worker data
        const workerData = {
          name: worker.name.trim(),
          employeeId: worker.employeeId || '',
          idNumber: worker.idNumber || worker.nationalId || '',
          nationality: worker.nationality || worker.nationality || '',
          company: worker.company || '',
          role,
        };

        // Upsert worker in D1
        const existing = await db.select().from(workersTable).where(eq(workersTable.id, workerId));
        if (existing.length > 0) {
          await db.update(workersTable).set({
            ...workerData,
            updatedAt: new Date().toISOString(),
          } as any).where(eq(workersTable.id, workerId));
          results.updated++;
        } else {
          await db.insert(workersTable).values({
            id: workerId,
            ...workerData,
            updatedAt: new Date().toISOString(),
          } as any);
          results.imported++;
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Worker #${i + 1} (${worker.name || 'unnamed'}): ${errorMsg}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.imported} new, ${results.updated} updated, ${results.skipped} skipped`,
      results,
    });

  } catch (error) {
    console.error('Workers import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import workers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workers/import
 * Returns import instructions
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/workers/import',
    method: 'POST',
    description: 'Import workers data from JSON file into Cloudflare D1',
    bodyFormat: {
      workers: [
        {
          id: 'optional - will be auto-generated if missing',
          name: 'required - worker name',
          employeeId: 'optional - employee number (e.g., 40097) - can be duplicated across companies',
          idNumber: 'optional - national ID number (e.g., 2059537999) - unique per person',
          nationaliy: 'optional - nationality',
          company: 'optional - company name',
          role: 'optional - Worker | Supervisor | Engineer (default: Worker)',
        }
      ]
    },
    alternativeFormat: 'Can also send array directly without "workers" wrapper',
    example: `
      POST /api/workers/import
      Content-Type: application/json
      
      [
        { "id": "w001", "name": "أحمد محمد", "employeeId": "40097", "idNumber": "2059537999", "nationaliy": "سعودي", "company": "شركة المقاولات", "role": "Worker" },
        { "id": "w002", "name": "محمد علي", "employeeId": "50123", "idNumber": "1234567890", "nationaliy": "مصري", "company": "شركة الصيانة", "role": "Supervisor" }
      ]
    `
  });
}
