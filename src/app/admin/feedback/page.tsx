'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { useUsers } from '@/context/users-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Item {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  status: string;
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
  screenshotUrl?: string;
  createdAt?: { toDate: () => Date } | string | number;
}

export default function AdminFeedbackPage() {
  const { currentUser, getUserById } = useUsers();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Bug' | 'Feature Request' | 'UI Issue' | 'Performance' | 'Other'>('all');
  const [comment, setComment] = useState('');
  const [prioritySort, setPrioritySort] = useState<'none' | 'high_first' | 'low_first'>('none');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      if (!db) return;
      let qRef: any = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      // Filters will be applied after fetch for simplicity; Firestore supports where but with indexes
      const snap = await getDocs(qRef);
      const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const priRank = (p?: string) => (p === 'high' ? 3 : p === 'medium' ? 2 : p === 'low' ? 1 : 0);
    let list = items.filter(i => (statusFilter === 'all' || i.status === statusFilter) && (categoryFilter === 'all' || i.category === categoryFilter));
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(i => `${i.title} ${i.ticketId}`.toLowerCase().includes(s));
    }
    if (prioritySort !== 'none') {
      list = [...list].sort((a, b) => {
        const da = priRank(a.priority);
        const db = priRank(b.priority);
        return prioritySort === 'high_first' ? db - da : da - db;
      });
    }
    return list;
  }, [items, statusFilter, categoryFilter, prioritySort, search]);

  const openItems = useMemo(() => filtered.filter(i => i.status === 'new' || i.status === 'in_progress'), [filtered]);
  const closedItems = useMemo(() => filtered.filter(i => i.status === 'resolved' || i.status === 'rejected'), [filtered]);

  const updateItem = async (id: string, status?: string, priority?: Item['priority']) => {
    setLoading(true);
    try {
      if (!db) return;
      const ref = doc(db, 'feedback', id);
      const patch: any = {};
      if (status) {
        patch.status = status;
        patch.updatedAt = serverTimestamp();
        if (status === 'resolved') patch.resolvedAt = serverTimestamp();
        if (status === 'in_progress') patch.startedAt = serverTimestamp();
      }
      if (priority) patch.priority = priority;
      if (Object.keys(patch).length) await updateDoc(ref, patch);

      if (comment) {
        await addDoc(collection(ref, 'updates'), {
          developerComment: comment,
          updatedBy: currentUser?.id || 'system',
          updatedAt: serverTimestamp(),
        });
      }

      // Also create an in-app notification for the owner
      const target = items.find(x => x.id === id);
      if (target?.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: target.userId,
          title: 'Feedback status updated',
          message: `Status changed to: ${status || 'updated'}`,
          type: 'feedback_update',
          href: '/feedback',
          referenceId: id,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
      setComment('');
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentUser?.role !== 'Admin' && (
  <div className="text-sm text-destructive">You are not authorized to access this page.</div>
      )}
      {currentUser?.role === 'Admin' && (
      <>
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold">Feedback Board</h1>
  <Button onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Bug">Bug</SelectItem>
            <SelectItem value="Feature Request">Feature Request</SelectItem>
            <SelectItem value="UI Issue">UI Issue</SelectItem>
            <SelectItem value="Performance">Performance</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={prioritySort} onValueChange={(v: any) => setPrioritySort(v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Sort by Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="high_first">High first</SelectItem>
            <SelectItem value="low_first">Low first</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1 min-w-48">
          <input className="w-full border rounded px-3 py-2 text-sm bg-background" placeholder="Search by title or ticket ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Open section */}
      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Open</h2>
        {openItems.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{f.title} <span className="text-muted-foreground">({f.ticketId})</span></CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{f.category}</Badge>
                  <Badge className={f.status === 'resolved' ? 'bg-green-600' : f.status === 'rejected' ? 'bg-destructive' : ''}>{f.status}</Badge>
                </div>
              </div>
              <CardDescription>
                {f.createdAt ? formatDistanceToNow(typeof f.createdAt === 'object' ? (f.createdAt as any).toDate?.() || new Date() : new Date(f.createdAt as any), { addSuffix: true }) : ''}
                {" "}• by {f.userId ? (getUserById(f.userId)?.name || 'Unknown') : 'Unknown'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {f.screenshotUrl && <img src={f.screenshotUrl} alt="screenshot" className="max-h-64 rounded border" />}
              <div className="grid gap-1">
                <label className="text-sm text-muted-foreground">Developer comment</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note to the user" />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Priority:</span>
                  <Select value={f.priority || 'medium'} onValueChange={(v: any) => updateItem(f.id, undefined, v)}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => updateItem(f.id, 'in_progress')}>In Progress</Button>
                  <Button onClick={() => updateItem(f.id, 'resolved')}>Resolved</Button>
                  <Button variant="destructive" onClick={() => updateItem(f.id, 'rejected')}>Rejected</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {openItems.length === 0 && (
          <div className="text-muted-foreground text-sm p-8 text-center">No open items.</div>
        )}
      </div>

      {/* Closed section */}
      <div className="grid gap-3 mt-6">
        <h2 className="text-lg font-semibold">Closed</h2>
        {closedItems.map((f) => (
          <Collapsible key={f.id} open={!!expanded[f.id]} onOpenChange={(v) => setExpanded((prev) => ({ ...prev, [f.id]: v }))}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <CardTitle className="text-base">{f.title} <span className="text-muted-foreground">({f.ticketId})</span></CardTitle>
                    <CardDescription>
                      {f.createdAt ? formatDistanceToNow(typeof f.createdAt === 'object' ? (f.createdAt as any).toDate?.() || new Date() : new Date(f.createdAt as any), { addSuffix: true }) : ''}
                      {" "}• by {f.userId ? (getUserById(f.userId)?.name || 'Unknown') : 'Unknown'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{f.category}</Badge>
                    <Badge className={f.status === 'resolved' ? 'bg-green-600' : f.status === 'rejected' ? 'bg-destructive' : ''}>{f.status}</Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">{expanded[f.id] ? 'Hide details' : 'Show details'}</Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {f.screenshotUrl && <img src={f.screenshotUrl} alt="screenshot" className="max-h-64 rounded border" />}
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Priority:</span>
                      <Badge variant="secondary">{f.priority || 'medium'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
        {closedItems.length === 0 && (
          <div className="text-muted-foreground text-sm p-8 text-center">No closed items.</div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
