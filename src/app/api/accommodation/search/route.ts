import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { q } = await request.json();
    console.log('🔍 Search API called with query:', q);
    
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('❌ Firebase Admin not configured');
      return NextResponse.json({ 
        ok: false, 
        error: 'Firebase Admin not configured' 
      }, { status: 500 });
    }

    try {
      // Get all workers from Firestore using Admin SDK
      console.log('📡 Fetching workers from Firestore using Admin SDK...');
      const workersSnapshot = await adminDb.collection('workers').get();
      console.log('📦 Firestore returned', workersSnapshot.docs.length, 'documents');
      
      const workers = workersSnapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as any[];
      
      console.log('👥 Processed workers:', workers.length, workers);

      // If no search query, return all workers
      if (!q || !q.trim()) {
        console.log('✅ Returning all', workers.length, 'workers');
        return NextResponse.json({ ok: true, results: workers });
      }

      // Filter workers based on search query
      const norm = q.trim().toLowerCase();
      const results = workers.filter((w: any) => 
        (w.name || '').toLowerCase().includes(norm) || 
        (w.id || '').toLowerCase().includes(norm) || 
        (w.nationaliy || '').toLowerCase().includes(norm) ||
        (w.role || '').toLowerCase().includes(norm)
      );

      console.log('✅ Filtered results:', results.length, 'workers match query');
      return NextResponse.json({ ok: true, results });
    } catch (e) {
      console.error('❌ Search route error:', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e) {
    console.error('❌ Search API error:', e);
    return NextResponse.json({ ok: false, error: (e as any).message || 'error' }, { status: 500 });
  }
}
