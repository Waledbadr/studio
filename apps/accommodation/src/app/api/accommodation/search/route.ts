import { NextResponse } from 'next/server';
import { getD1Db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { q } = await request.json();
    console.log('🔍 Search API called with query:', q);
    
    const adminDb = getD1Db();
    if (!adminDb) {
      console.error('❌ D1 database not configured');
      return NextResponse.json({ 
        ok: false, 
        error: 'D1 database not configured' 
      }, { status: 500 });
    }

    try {
      console.log('📡 Fetching workers from D1 database...');
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
