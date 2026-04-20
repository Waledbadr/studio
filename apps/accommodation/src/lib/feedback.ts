import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc, runTransaction } from "firebase/firestore";

export type FeedbackCategory = 'Bug' | 'Feature Request' | 'UI Issue' | 'Performance' | 'Other';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

export interface Feedback {
  id: string;
  ticketId: string;
  userId?: string;
  title: string;
  description?: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  priority?: 'low' | 'medium' | 'high';
  screenshotUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  stack?: string;
  deviceInfo?: any;
  appInfo?: any;
  settings?: any;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  developerComment?: string;
}

export function formatMonthlyTicketId(year: number, month1Based: number, counter: number): string {
  const yy = String(year).slice(-2);
  const m = String(month1Based); // no leading zero per requirement
  return `FB-${yy}${m}${counter}`;
}

export async function generateMonthlySequentialTicketId(year: number, month1Based: number): Promise<string> {
  if (!db) throw new Error('Firestore not configured');
  const yy = String(year).slice(-2);
  const m = String(month1Based);
  const counterId = `feedback-${yy}${m}`;
  const ref = doc(db, 'counters', counterId);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const last = snap.exists() ? (snap.data() as any).last || 0 : 0;
    const n = last + 1;
    tx.set(ref, { last: n, updatedAt: serverTimestamp() }, { merge: true });
    return n as number;
  });
  return formatMonthlyTicketId(year, month1Based, next);
}

export async function makeTicketId(): Promise<string> {
  const now = new Date();
  return generateMonthlySequentialTicketId(now.getFullYear(), now.getMonth() + 1);
}

export async function createFeedback(payload: Omit<Feedback, 'id' | 'ticketId' | 'status' | 'createdAt'>) {
  if (!db) throw new Error('Firestore not configured');
  const ref = await addDoc(collection(db, 'feedback'), {
    ...payload,
  ticketId: await makeTicketId(),
    status: 'new' as FeedbackStatus,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addFeedbackUpdate(feedbackId: string, update: FeedbackUpdate & { updatedBy: string }) {
  if (!db) throw new Error('Firestore not configured');
  const feedRef = doc(db, 'feedback', feedbackId);
  const snap = await getDoc(feedRef);
  if (!snap.exists()) throw new Error('Feedback not found');
  const updatesRef = collection(feedRef, 'updates');
  await addDoc(updatesRef, {
    ...update,
    updatedAt: serverTimestamp(),
  });
  if (update.status) {
    await updateDoc(feedRef, { status: update.status, updatedAt: serverTimestamp() });
  }
}
