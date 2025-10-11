import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId } = body;

    if (!workerId) {
      return NextResponse.json(
        { ok: false, error: 'workerId is required' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    // Find the occupant record for this worker
    const occupantsRef = collection(db, 'occupants');
    const q = query(occupantsRef, where('workerId', '==', workerId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { ok: false, error: 'Worker not found in any room' },
        { status: 404 }
      );
    }

    // Delete the occupant record
    const occupantDoc = snapshot.docs[0];
    await deleteDoc(doc(db, 'occupants', occupantDoc.id));

    return NextResponse.json({
      ok: true,
      message: 'Worker unassigned successfully'
    });
  } catch (error: any) {
    console.error('Error unassigning worker:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to unassign worker' },
      { status: 500 }
    );
  }
}
