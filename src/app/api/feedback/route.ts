import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { generateMonthlySequentialTicketId } from '@/lib/feedback';

export async function POST(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
    const body = await req.json();
    const { userId, title, description, category, screenshotUrl, errorCode, errorMessage, stack, deviceInfo, appInfo, settings } = body || {};
    if (!title || !category) return NextResponse.json({ error: 'Missing title or category' }, { status: 400 });

  const now = new Date();
  const ticketId = await generateMonthlySequentialTicketId(now.getFullYear(), now.getMonth() + 1);

    const ref = await addDoc(collection(db, 'feedback'), {
      ticketId,
      userId: userId || null,
      title,
      description: description || null,
      category,
      status: 'new',
      priority: 'medium',
      screenshotUrl: screenshotUrl || null,
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      stack: stack || null,
      deviceInfo: deviceInfo || null,
      appInfo: appInfo || null,
      settings: settings || null,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id, ticketId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const qBase = collection(db, 'feedback');
    let q = query(qBase) as any;
    if (userId) q = query(qBase, where('userId', '==', userId)) as any;
    q = query(q, limit(100));
    const snap = await getDocs(q);
    const items = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .sort((a: any, b: any) => {
        const da = a.createdAt ? (typeof a.createdAt === 'object' ? a.createdAt.toDate?.() || new Date(0) : new Date(a.createdAt)) : new Date(0);
        const dbb = b.createdAt ? (typeof b.createdAt === 'object' ? b.createdAt.toDate?.() || new Date(0) : new Date(b.createdAt)) : new Date(0);
        return +dbb - +da;
      });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
