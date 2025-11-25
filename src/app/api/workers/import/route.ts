import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/workers/import
 * 
 * Imports workers data from JSON file into Firestore 'workers' collection.
 * Accepts JSON array of workers with fields: id, name, nationaliy, role
 * 
 * Body: { workers: Worker[] } or Worker[]
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Support both { workers: [...] } and direct array
    const workersData = Array.isArray(body) ? body : (body.workers || []);
    
    if (!Array.isArray(workersData) || workersData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of workers.' },
        { status: 400 }
      );
    }

    // Validate Firebase Admin is initialized
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }

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
          nationaliy: worker.nationaliy || worker.nationality || '',
          company: worker.company || '',
          role,
        };

        // Check if worker already exists
        const docRef = adminDb.collection('workers').doc(workerId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          // Update existing worker
          await docRef.set(workerData, { merge: true });
          results.updated++;
        } else {
          // Create new worker
          await docRef.set(workerData);
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
    description: 'Import workers data from JSON file',
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
