'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFormattedGitInfo } from '@/lib/git-info';

interface Health {
  ok: boolean;
  status: number;
  uptime?: number;
  timestamp?: string;
  error?: string;
}

export default function StatusPage() {
  const [health, setHealth] = useState<Health>({ ok: false, status: 0 });
  const [loading, setLoading] = useState(true);
  const git = getFormattedGitInfo();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (isMounted) setHealth({ ok: res.ok, status: res.status, uptime: json?.uptime, timestamp: json?.timestamp });
      } catch (e: any) {
        if (isMounted) setHealth({ ok: false, status: 0, error: e?.message || 'Request failed' });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deployment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Health</span>
            {loading ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : health.ok ? (
              <Badge className="bg-green-600">OK ({health.status})</Badge>
            ) : (
              <Badge className="bg-red-600">Error {health.status || ''}</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {health.uptime !== undefined && <span>Uptime: {Math.round(health.uptime!)}s • </span>}
            {health.timestamp && <span>TS: {new Date(health.timestamp).toLocaleString()}</span>}
            {health.error && <span>Error: {health.error}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Git Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Branch: </span>
            <Badge variant="outline">{git.branch}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Last Commit: </span>
            <Badge variant="outline">{process.env.NEXT_PUBLIC_LAST_COMMIT_HASH || 'n/a'}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Build Time: </span>
            <span>{git.lastUpdateWithTime}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Relative: </span>
            <span>{git.lastUpdateRelative}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Current (client): </span>
            <span>{git.currentDateTime}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
