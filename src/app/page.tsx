
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, Wrench, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMaintenance } from "@/context/maintenance-context";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { requests, loading, loadRequests } = useMaintenance();

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  
  const recentRequests = requests.slice(0, 5);
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const completedRequests = requests.filter(r => r.status === 'Completed').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalRequests}</div>}
            <p className="text-xs text-muted-foreground">Total maintenance requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{pendingRequests}</div>}
            <p className="text-xs text-muted-foreground">Requests needing attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{completedRequests}</div>}
            <p className="text-xs text-muted-foreground">Requests completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Maintenance Requests</CardTitle>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/maintenance">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
             <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          )}
          {!loading && recentRequests.length === 0 && (
             <div className="text-center text-muted-foreground p-10">
                No maintenance requests found.
             </div>
          )}
          {!loading && recentRequests.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{`${request.complexName}, ${request.roomName}`}</TableCell>
                    <TableCell>{request.issueTitle}</TableCell>
                    <TableCell>
                      <Badge variant={
                        request.status === 'Completed' ? 'default' : request.status === 'In Progress' ? 'secondary' : 'outline'
                      }>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.priority === 'High' ? 'destructive' : request.priority === 'Medium' ? 'secondary' : 'outline'}>{request.priority}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
