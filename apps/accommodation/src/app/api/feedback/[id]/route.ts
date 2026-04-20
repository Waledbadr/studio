import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { generateMonthlySequentialTicketId } from '@/lib/feedback';
import { db as _db } from '@/lib/firebase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!db) return NextResponse.json({ error: 'Firestore not configured' }, { status: 500 });
    const id = params.id;
    const body = await req.json();
  const { status, developerComment, updatedBy, priority, ticketId, autoRenumber } = body || {};

    const ref = doc(db, 'feedback', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (status) {
      const patch: any = { status, updatedAt: serverTimestamp() };
      if (status === 'resolved') patch.resolvedAt = serverTimestamp();
      if (status === 'in_progress') patch.startedAt = serverTimestamp();
      await updateDoc(ref, patch);
    }
    if (priority) {
      await updateDoc(ref, { priority });
    }
    let newTicketId: string | undefined;
    if (typeof ticketId === 'string' && ticketId.trim()) {
      newTicketId = ticketId.trim().toUpperCase();
      await updateDoc(ref, { ticketId: newTicketId, updatedAt: serverTimestamp() });
    } else if (autoRenumber) {
      const data = snap.data() as any;
      const createdAt = data?.createdAt;
      let year: number;
      let month1: number;
      if (createdAt && typeof createdAt === 'object' && typeof createdAt.toDate === 'function') {
        const d = createdAt.toDate();
        year = d.getFullYear();
        month1 = d.getMonth() + 1;
      } else {
        const d = new Date();
        year = d.getFullYear();
        month1 = d.getMonth() + 1;
      }
      newTicketId = await generateMonthlySequentialTicketId(year, month1);
      await updateDoc(ref, { ticketId: newTicketId, updatedAt: serverTimestamp() });
    }
    if (developerComment) {
      await addDoc(collection(ref, 'updates'), {
        developerComment,
        updatedBy: updatedBy || 'system',
        updatedAt: serverTimestamp(),
      });
    }

    // Notify the feedback owner
    const userId = (snap.data() as any)?.userId;
    if (userId && _db) {
      await addDoc(collection(_db, 'notifications'), {
        userId,
        title: 'Feedback status updated',
        message: `Status changed to: ${status || 'updated'}`,
        type: 'feedback_update',
        href: '/feedback',
        referenceId: id,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }

  return NextResponse.json({ ok: true, ticketId: newTicketId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
