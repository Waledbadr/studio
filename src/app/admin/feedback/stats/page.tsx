'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useUsers } from '@/context/users-context';

interface Item {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  status: string;
  createdAt?: { toDate: () => Date } | string | number;
  resolvedAt?: { toDate: () => Date } | string | number;
  appInfo?: { path?: string };
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FeedbackStatsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useUsers();

  const load = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.status] = (map[i.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [items]);

  const avgResolutionHours = useMemo(() => {
    const times: number[] = [];
    items.forEach(i => {
      const c = i.createdAt ? (typeof i.createdAt === 'object' ? (i.createdAt as any).toDate?.() : new Date(i.createdAt as any)) : undefined;
      const r = i.resolvedAt ? (typeof i.resolvedAt === 'object' ? (i.resolvedAt as any).toDate?.() : new Date(i.resolvedAt as any)) : undefined;
      if (c && r) times.push((+r - +c) / 36e5);
    });
    if (!times.length) return 0;
    return Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
  }, [items]);

  const topPaths = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => {
      const p = i.appInfo?.path || 'unknown';
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }));
  }, [items]);

  if (currentUser?.role !== 'Admin') {
    return <div className="text-sm text-destructive">You are not authorized to access this page.</div>;
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Feedback Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Distribution of feedback by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie dataKey="value" isAnimationActive data={byCategory} outerRadius={100} label>
                  {byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Open vs Closed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusCounts}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
            <CardDescription>In hours</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{avgResolutionHours} h</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Problematic Pages</CardTitle>
            <CardDescription>Top 5 paths</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {topPaths.map((p) => (
                <li key={p.path} className="flex justify-between"><span className="truncate max-w-[70%]">{p.path}</span><span className="text-muted-foreground">{p.count}</span></li>
              ))}
              {topPaths.length === 0 && <li className="text-muted-foreground">No data</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
