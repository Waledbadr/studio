'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, Wrench, CheckCircle2, Loader2, Truck, Package, PackageOpen, ListOrdered, ClipboardMinus } from 'lucide-react';
import Link from 'next/link';
import { useMaintenance } from "@/context/maintenance-context";
import { useOrders, type Order } from "@/context/orders-context";
import { useInventory, type MIV, type ReconciliationRequest } from "@/context/inventory-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useUsers } from "@/context/users-context";
import { useResidences } from "@/context/residences-context";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

export default function DashboardPage() {
    const { dict } = useLanguage();
  const { requests, loading: maintenanceLoading, loadRequests } = useMaintenance();
  const { orders, loading: ordersLoading, loadOrders } = useOrders();
    const { getMIVs, getReconciliationRequests, loading: inventoryLoading } = useInventory();
    const { currentUser, loading: usersLoading, getUserById } = useUsers();
    const { residences } = useResidences();
  
  const [mivs, setMivs] = useState<MIV[]>([]);
  const [mivsLoading, setMivsLoading] = useState(true);
    const [pendingRecons, setPendingRecons] = useState<ReconciliationRequest[]>([]);
    const [pendingReconsLoading, setPendingReconsLoading] = useState(true);
  const isAdmin = currentUser?.role === 'Admin';
  const router = useRouter();


  useEffect(() => {
    loadRequests();
    loadOrders();
    setMivsLoading(true);
    getMIVs().then(setMivs).finally(() => setMivsLoading(false));
        if (isAdmin) {
            setPendingReconsLoading(true);
            getReconciliationRequests(undefined, 'Pending').then(setPendingRecons).finally(() => setPendingReconsLoading(false));
        } else {
            setPendingRecons([]);
            setPendingReconsLoading(false);
        }
  }, [loadRequests, loadOrders, getMIVs]);
  
  const filteredMaintenance = useMemo(() => {
    if (!currentUser || isAdmin) return requests;
    return requests.filter(r => currentUser.assignedResidences.includes(r.complexId));
  }, [requests, currentUser, isAdmin]);

  const filteredOrders = useMemo(() => {
    if (!currentUser || isAdmin) return orders;
    return orders.filter(o => currentUser.assignedResidences.includes(o.residenceId));
  }, [orders, currentUser, isAdmin]);
  
  const filteredMIVs = useMemo(() => {
    if (!currentUser || isAdmin) return mivs;
    return mivs.filter(miv => currentUser.assignedResidences.includes(miv.residenceId));
  }, [mivs, currentUser, isAdmin]);

  const recentMaintenance = filteredMaintenance.slice(0, 5);
  const recentMaterialRequests = filteredOrders.slice(0, 5);
  const recentReceipts = filteredOrders.filter(o => o.status === 'Delivered' || o.status === 'Partially Delivered').slice(0, 5);
  const recentIssues = filteredMIVs.slice(0, 5);

  // Use material requests for top cards
  const totalRequests = filteredOrders.length;
  const pendingRequests = filteredOrders.filter(o => o.status === 'Pending').length;
  const completedRequests = filteredOrders.filter(o => o.status === 'Delivered').length;

  const loading = maintenanceLoading || ordersLoading || inventoryLoading || usersLoading;

  const formatOrderId = (id: string) => {
    if (!id) return id;
    if (id.startsWith('MR-')) return id;
    const m = id.match(/^(\d{2})-(\d{2})-(\d{3})$/);
    if (m) {
      const yy = m[1];
      const mmNoPad = String(parseInt(m[2], 10));
      const seq = String(parseInt(m[3], 10));
      return `MR-${yy}${mmNoPad}${seq}`;
    }
    return id;
  };
  const formatMivId = (id: string) => {
    if (!id) return id;
    if (id.startsWith('MIV-') && !id.includes('-')) return id;
    const m = id.match(/^MIV-(\d{2})-(\d{2})-(\d{3})$/);
    if (m) {
      const yy = m[1];
      const mmNoPad = String(parseInt(m[2], 10));
      const seq = String(parseInt(m[3], 10));
      return `MIV-${yy}${mmNoPad}${seq}`;
    }
    return id;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.dashboard?.totalRequests || 'Total Requests'}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalRequests}</div>}
            <p className="text-xs text-muted-foreground">{dict.dashboard?.totalRequests || 'Total material requests'}</p>
          </CardContent>
        </Card>
        <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{dict.dashboard?.pending || 'Pending'}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{pendingRequests}</div>}
            <p className="text-xs text-muted-foreground">Requests that need attention</p>
            <p className="text-xs text-muted-foreground">{dict.dashboard?.requestsNeedAttention || 'Requests that need attention'}</p>
          </CardContent>
        </Card>
        <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{dict.dashboard?.completed || 'Completed'}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{completedRequests}</div>}
            <p className="text-xs text-muted-foreground">Completed requests</p>
            <p className="text-xs text-muted-foreground">{dict.dashboard?.completedRequests || 'Completed requests'}</p>
          </CardContent>
        </Card>
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {isAdmin && (
                    <Card className="border-t-4 border-purple-500 lg:col-span-3">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle className="flex items-center gap-2"><PackageOpen className="h-5 w-5 text-purple-500"/> {dict.sidebar?.stockReconciliation || 'Pending Reconciliations'}</CardTitle>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1">
                                <Link href="/inventory/inventory-audit">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {pendingReconsLoading ? (
                                <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                            ) : pendingRecons.length === 0 ? (
                                <div className="text-center text-muted-foreground p-10">No pending reconciliation requests.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Residence</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Requester</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRecons.slice(0,5).map(r => (
                                            <TableRow key={r.id} onClick={() => router.push('/inventory/inventory-audit')} className="cursor-pointer hover:bg-accent/30">
                                            <TableCell><div className="font-mono">{r.reservedId || r.id}</div></TableCell>
                                            <TableCell>{residences.find(x => String(x.id) === String(r.residenceId))?.name || r.residenceId}</TableCell>
                                                <TableCell>{r.adjustments?.length || 0}</TableCell>
                                            <TableCell>{getUserById(r.requestedById)?.name || r.requestedById}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
        <Card className="border-t-4 border-blue-500">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><ListOrdered className="h-5 w-5 text-blue-500"/> {dict.dashboard?.recentMaterialRequests || 'Recent MRs'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/orders">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentMaterialRequests.length === 0 ? <div className="text-center text-muted-foreground p-10">No material requests found.</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentMaterialRequests.map((order, i) => (
                                <TableRow key={`${order.id}-${i}`} onClick={() => router.push(`/inventory/orders/${order.id}`)} className="cursor-pointer hover:bg-accent/30">
                                    <TableCell>
                                        <div className="font-medium text-primary underline-offset-2 hover:underline">{formatOrderId(order.id)}</div>
                                        <div className="text-sm text-muted-foreground">{order.residence}</div>
                                    </TableCell>
                                    <TableCell>
                                         <Badge variant={
                                            order.status === 'Delivered' ? 'default' 
                                            : order.status === 'Approved' ? 'secondary'
                                            : order.status === 'Partially Delivered' ? 'secondary'
                                            : order.status === 'Cancelled' ? 'destructive'
                                            : 'outline'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-500"/> Recent MRVs</CardTitle>
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-500"/> {dict.dashboard?.recentReceipts || 'Recent MRVs'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/receive">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentReceipts.length === 0 ? <div className="text-center text-muted-foreground p-10">No recent receipts found.</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentReceipts.map((order, i) => {
                                const href = order.status === 'Partially Delivered' ? `/inventory/receive/${order.id}` : `/inventory/orders/${order.id}`;
                                return (
                                    <TableRow key={`${order.id}-${i}`} onClick={() => router.push(href)} className="cursor-pointer hover:bg-accent/30">
                                        <TableCell>
                                            <div className="font-medium text-primary underline-offset-2 hover:underline">{order.id}</div>
                                            <div className="text-sm text-muted-foreground">{order.residence}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        <Card className="border-t-4 border-orange-500">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><ClipboardMinus className="h-5 w-5 text-orange-500"/> Recent MIVs</CardTitle>
                    <CardTitle className="flex items-center gap-2"><ClipboardMinus className="h-5 w-5 text-orange-500"/> {dict.dashboard?.recentIssues || 'Recent MIVs'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/issue-history">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                 {mivsLoading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentIssues.length === 0 ? <div className="text-center text-muted-foreground p-10">No recent issues found.</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>MIV ID</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentIssues.map((miv, i) => (
                                <TableRow key={`${miv.id}-${i}`} onClick={() => router.push(`/inventory/issue-history/${miv.id}`)} className="cursor-pointer hover:bg-accent/30">
                                    <TableCell><div className="font-medium text-primary underline-offset-2 hover:underline">{formatMivId(miv.id)}</div></TableCell>
                                    <TableCell>{format(miv.date.toDate(), 'PPP')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5"/> {dict.dashboard?.recentMaintenance || 'Recent Maintenance'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/maintenance">View All<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentMaintenance.length === 0 ? <div className="text-center text-muted-foreground p-10">No maintenance requests found.</div>
                : recentMaintenance.length === 0 ? <div className="text-center text-muted-foreground p-10">{dict.dashboard?.noMaintenanceRequestsFound || 'No maintenance requests found.'}</div>
                : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentMaintenance.map((req, i) => (
                                <TableRow key={`${req.id}-${i}`}>
                                    <TableCell>
                                        <div className="font-medium">{req.issueTitle}</div>
                                        <div className="text-sm text-muted-foreground">{req.complexName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'Completed' ? 'default' : req.status === 'In Progress' ? 'secondary' : 'outline'}>{req.status}</Badge>
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
