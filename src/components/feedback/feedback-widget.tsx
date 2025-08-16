"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { Camera, LifeBuoy, Send } from 'lucide-react';
import { useErrorCapture } from '@/hooks/use-error-capture';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { gitInfo } from '@/lib/git-info';

interface Props {
  className?: string;
}

function captureDeviceInfo() {
  if (typeof window === 'undefined') return {};
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function captureAppInfo() {
  if (typeof window === 'undefined') return {};
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer,
  // git info intentionally omitted
  };
}

async function captureScreenshot(): Promise<string | undefined> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    // Hide feedback dialog before screenshot
  const dialog = document.querySelector('[data-feedback-dialog]') as HTMLElement | null;
  if (dialog) dialog.style.display = 'none';
    const canvas = await html2canvas(document.body, { useCORS: true, logging: false, ignoreElements: (el) => el.hasAttribute && el.hasAttribute('data-feedback-dialog') });
  if (dialog) dialog.style.display = '';
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (e) {
    console.warn('screenshot failed', e);
    return undefined;
  }
}

function autoCategorize(title: string, description?: string): 'Bug' | 'Feature Request' | 'UI Issue' | 'Performance' | 'Other' {
  const t = `${title} ${description || ''}`.toLowerCase();
  if (/bug|error|exception|crash|fail|خطأ|تعطل|خلل/.test(t)) return 'Bug';
  if (/feature|enhance|improve|request|اقتراح|ميزة|تحسين/.test(t)) return 'Feature Request';
  if (/ui|ux|interface|layout|واجهة|تصميم/.test(t)) return 'UI Issue';
  if (/slow|lag|performance|بطء|أداء/.test(t)) return 'Performance';
  return 'Other';
}

function makeTicketId(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FB-${y}${m}${d}-${rand}`;
}

export default function FeedbackWidget({ className }: Props) {
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const { lastError, reset } = useErrorCapture();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<'Bug' | 'Feature Request' | 'UI Issue' | 'Performance' | 'Other'>('Other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [loading, setLoading] = useState(false);

  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>();

  useEffect(() => {
    if (open && includeScreenshot) {
      captureScreenshot().then(setScreenshotDataUrl);
    }
  }, [open, includeScreenshot]);

  useEffect(() => {
    if (lastError && !title) {
      setTitle(lastError.code ? `Error ${lastError.code}` : 'Application Error');
      setDescription(`${lastError.message}\n\n${lastError.stack || ''}`);
    }
  }, [lastError, title]);

  const deviceInfo = useMemo(captureDeviceInfo, []);
  const appInfo = useMemo(captureAppInfo, []);

  const submit = async () => {
    setLoading(true);
    try {
      if (!db) throw new Error('Firestore غير مُهيأ');
      const payload = {
        userId: currentUser?.id,
        title: title.trim() || 'No title',
        description: description.trim() || undefined,
        category,
        errorCode: lastError?.code,
        errorMessage: lastError?.message,
        stack: lastError?.stack,
        deviceInfo,
        appInfo,
        settings: {
          theme: {
            color: currentUser?.themeSettings?.colorTheme,
            mode: currentUser?.themeSettings?.mode,
          }
        }
      } as any;

      let screenshotUrl: string | undefined;
      if (includeScreenshot && screenshotDataUrl) {
        const res = await fetch('/api/uploads/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: screenshotDataUrl }),
        });
        const data = await res.json();
        if (data?.url) screenshotUrl = data.url;
      }

      const autoCat = autoCategorize(payload.title, payload.description);
      const ticketId = makeTicketId();
      const feedbackRef = await addDoc(collection(db, 'feedback'), {
        ...payload,
        categoryAuto: autoCat,
        ticketId,
        status: 'new',
        priority: 'medium',
        screenshotUrl: screenshotUrl || null,
        createdAt: serverTimestamp(),
      });

      // Notify all Admin users about the new feedback
  try {
        const adminsQ = query(collection(db, 'users'), where('role', '==', 'Admin'));
        const adminsSnap = await getDocs(adminsQ);
        const adminIds = adminsSnap.docs.map((d) => d.id);
        await Promise.all(
          adminIds.map((adminId) =>
    addDoc(collection(db!, 'notifications'), {
              userId: adminId,
              title: 'New feedback',
              message: `${payload.title}`,
              type: 'feedback_update',
              href: '/admin/feedback',
              referenceId: feedbackRef.id,
              isRead: false,
              createdAt: serverTimestamp(),
            })
          )
        );
      } catch (notifyErr) {
        console.warn('Failed to notify admins about new feedback:', notifyErr);
      }

  toast({ title: 'Feedback sent', description: 'Thanks for helping us improve the app.' });
      setOpen(false);
      setTitle('');
      setDescription('');
      reset();
    } catch (e: any) {
  toast({ title: 'Send failed', description: e?.message || 'An error occurred while sending feedback', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Support paste image from clipboard
  useEffect(() => {
    if (!open) return;
    function handlePaste(e: ClipboardEvent) {
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                setScreenshotDataUrl(ev.target?.result as string);
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={className} variant="secondary">
          <LifeBuoy className="h-4 w-4 mr-2" /> Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" data-feedback-dialog>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>Report a problem or send an idea to improve the app.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
      <Label>Category</Label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger>
        <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
        <SelectItem value="Bug">Bug</SelectItem>
        <SelectItem value="Feature Request">Feature Request</SelectItem>
        <SelectItem value="UI Issue">UI Issue</SelectItem>
        <SelectItem value="Performance">Performance</SelectItem>
        <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
      <Label>Title</Label>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" />
          </div>
          <div className="grid gap-1">
      <Label>Details</Label>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened? How can we reproduce it?" rows={5} />
          </div>

          {includeScreenshot && (
            <div className="rounded-md border p-2 bg-muted/40">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <Camera className="h-4 w-4" /> A screenshot will be attached automatically
              </div>
              {screenshotDataUrl ? (
                <img src={screenshotDataUrl} alt="screenshot" className="max-h-56 w-full object-contain rounded" />
              ) : (
        <div className="text-xs text-muted-foreground">Capturing screenshot...</div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
      <Button onClick={() => setIncludeScreenshot((v) => !v)} variant="ghost" type="button">
      {includeScreenshot ? 'Remove screenshot' : 'Add screenshot'}
          </Button>
          <Button onClick={submit} disabled={loading}>
      <Send className="h-4 w-4 mr-2" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
