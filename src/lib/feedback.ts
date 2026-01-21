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
  createdAt: any;
  updatedAt?: any;
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  developerComment?: string;
}

export async function createFeedback(payload: {
  userId?: string;
  title: string;
  description?: string;
  category: FeedbackCategory;
  screenshotUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  stack?: string | null;
  deviceInfo?: any;
  appInfo?: any;
  settings?: any;
  categoryAuto?: string;
}) {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json as { id: string; ticketId?: string };
}

export async function updateFeedback(feedbackId: string, update: { status?: FeedbackStatus; priority?: 'low' | 'medium' | 'high'; ticketId?: string; autoRenumber?: boolean }) {
  const res = await fetch(`/api/feedback/${encodeURIComponent(feedbackId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json as { ok: true; ticketId?: string };
}
