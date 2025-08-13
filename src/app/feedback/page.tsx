'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/context/users-context';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Item {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  status: string;
  createdAt?: { toDate: () => Date } | string | number;
}

export default function MyFeedbackPage() {
  const { currentUser } = useUsers();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const load = async () => {
    setLoading(true);
    try {
      if (!db || !currentUser?.id) { setItems([]); return; }
      const q = query(
        collection(db, 'feedback'),
        where('userId', '==', currentUser.id)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a: any, b: any) => {
        const da = a.createdAt ? (typeof a.createdAt === 'object' ? a.createdAt.toDate?.() || new Date(0) : new Date(a.createdAt)) : new Date(0);
        const dbb = b.createdAt ? (typeof b.createdAt === 'object' ? b.createdAt.toDate?.() || new Date(0) : new Date(b.createdAt)) : new Date(0);
        return +dbb - +da;
      });
      setItems(list as any);
    } catch (e) {
      console.error('Failed to load feedback', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (currentUser?.id) load(); }, [currentUser?.id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'open') return items.filter(i => i.status !== 'resolved' && i.status !== 'rejected');
    return items.filter(i => i.status === 'resolved');
  }, [items, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold">My Feedback</h1>
  <Button onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map((f) => (
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
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-muted-foreground text-sm p-8 text-center">No feedback yet.</div>
        )}
      </div>
    </div>
  );
}
