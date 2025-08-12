import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";

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

export function makeTicketId(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FB-${y}${m}${d}-${rand}`;
}

export async function createFeedback(payload: Omit<Feedback, 'id' | 'ticketId' | 'status' | 'createdAt'>) {
  if (!db) throw new Error('Firestore not configured');
  const ref = await addDoc(collection(db, 'feedback'), {
    ...payload,
    ticketId: makeTicketId(),
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
