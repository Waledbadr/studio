'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, Wrench, CheckCircle2, Loader2, Package, PackageOpen, ListOrdered, ClipboardMinus, GitBranch, Move, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { useMaintenance } from "@/context/maintenance-context";
import { useOrders, type Order } from "@/context/orders-context";
import { useInventory, type MIV, type ReconciliationRequest, type InventoryTransaction, type StockTransfer } from "@/context/inventory-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useUsers } from "@/context/users-context";
import { useResidences } from "@/context/residences-context";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useServiceOrders, type ServiceOrder } from '@/context/service-orders-context';

export default function DashboardPage() {
    const { dict } = useLanguage();
  const { requests, loading: maintenanceLoading, loadRequests } = useMaintenance();
    const { orders, loading: ordersLoading, loadOrders } = useOrders();
    const { getMIVs, getReconciliationRequests, getAllInventoryTransactions, getAllReconciliations, loading: inventoryLoading, transfers } = useInventory();
    const { currentUser, loading: usersLoading, getUserById } = useUsers();
    const { residences } = useResidences();
  const { serviceOrders, loading: svcLoading } = useServiceOrders();
  
    const [mivs, setMivs] = useState<MIV[]>([]);
  const [mivsLoading, setMivsLoading] = useState(true);
    const [deprTxs, setDeprTxs] = useState<InventoryTransaction[]>([]);
    const [deprLoading, setDeprLoading] = useState(true);
    const [pendingRecons, setPendingRecons] = useState<ReconciliationRequest[]>([]);
    const [pendingReconsLoading, setPendingReconsLoading] = useState(true);
    const [reconciliations, setReconciliations] = useState<any[]>([]);
    const [reconsLoading, setReconsLoading] = useState(true);
  const isAdmin = currentUser?.role === 'Admin';
  const router = useRouter();


    useEffect(() => {
        // لا تبدأ أي تحميل قبل توفر مستخدم مُسجّل دخول
        if (!currentUser) return;
        loadRequests();
        loadOrders();
        setMivsLoading(true);
                getMIVs().then(setMivs).finally(() => setMivsLoading(false));
        // Load recent depreciation transactions
                setDeprLoading(true);
                getAllInventoryTransactions()
                    .then(all => (all || []).filter(tx => tx.type === 'DEPRECIATION'))
                    .then(deps => deps.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0)))
                    .then(setDeprTxs)
                    .finally(() => setDeprLoading(false));
    // Load latest reconciliations
    setReconsLoading(true);
    getAllReconciliations()
        .then(all => (all || []).sort((a: any, b: any) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0)))
        .then(setReconciliations)
        .finally(() => setReconsLoading(false));
        if (isAdmin) {
            setPendingReconsLoading(true);
            getReconciliationRequests(undefined, 'Pending').then(setPendingRecons).finally(() => setPendingReconsLoading(false));
        } else {
            setPendingRecons([]);
            setPendingReconsLoading(false);
        }
    }, [currentUser, isAdmin, loadRequests, loadOrders, getMIVs, getReconciliationRequests, getAllReconciliations]);
  
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

    const filteredServiceOrders = useMemo(() => {
    if (!currentUser || isAdmin) return serviceOrders;
    return serviceOrders.filter(s => currentUser.assignedResidences.includes(s.residenceId));
  }, [serviceOrders, currentUser, isAdmin]);
    const filteredDepreciation = useMemo(() => {
        if (!currentUser || isAdmin) return deprTxs;
        return deprTxs.filter(tx => currentUser.assignedResidences.includes(tx.residenceId));
    }, [deprTxs, currentUser, isAdmin]);
    const filteredTransfers = useMemo(() => {
        if (!currentUser || isAdmin) return transfers || [];
        return (transfers || []).filter(t => currentUser.assignedResidences.includes(t.fromResidenceId) || currentUser.assignedResidences.includes(t.toResidenceId));
    }, [transfers, currentUser, isAdmin]);
    const filteredReconciliations = useMemo(() => {
        if (!currentUser || isAdmin) return reconciliations || [];
        return (reconciliations || []).filter((r: any) => currentUser.assignedResidences.includes(r.residenceId));
    }, [reconciliations, currentUser, isAdmin]);

  const recentMaintenance = filteredMaintenance.slice(0, 5);
  const recentMaterialRequests = filteredOrders.slice(0, 5);
  const recentReceipts = filteredOrders.filter(o => o.status === 'Delivered' || o.status === 'Partially Delivered').slice(0, 5);
  const recentIssues = filteredMIVs.slice(0, 5);
    const recentServiceOrders = filteredServiceOrders.slice(0, 5);
    const recentDepreciation = filteredDepreciation.slice(0, 5);
    const recentTransfers = filteredTransfers.slice(0, 5);
    const recentReconciliations = filteredReconciliations.slice(0, 5);

  // Use material requests for top cards
  const totalRequests = filteredOrders.length;
  const pendingRequests = filteredOrders.filter(o => o.status === 'Pending').length;
  const completedRequests = filteredOrders.filter(o => o.status === 'Delivered').length;

  const loading = maintenanceLoading || ordersLoading || inventoryLoading || usersLoading || svcLoading;

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
                        <p className="text-xs text-muted-foreground">{dict.dashboard?.totalRequestsDescription || 'Total material requests'}</p>
                    </CardContent>
        </Card>
        <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{dict.dashboard?.pending || 'Pending'}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{pendingRequests}</div>}
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
            <p className="text-xs text-muted-foreground">{dict.dashboard?.completedRequests || 'Completed requests'}</p>
          </CardContent>
        </Card>
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                : recentMaterialRequests.length === 0 ? <div className="text-center text-muted-foreground p-10">{dict.dashboard?.noMaterialRequestsFound || 'No material requests found.'}</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>{dict.orderId || 'Order ID'}</TableHead><TableHead>{dict.status || 'Status'}</TableHead></TableRow></TableHeader>
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
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-500"/> {dict.dashboard?.recentReceipts || 'Recent MRVs'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/inventory/receive">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentReceipts.length === 0 ? <div className="text-center text-muted-foreground p-10">{dict.dashboard?.noRecentReceiptsFound || 'No recent receipts found.'}</div>
                : (
                    <Table>
                         <TableHeader><TableRow><TableHead>{dict.orderId || 'Order ID'}</TableHead><TableHead>{dict.status || 'Status'}</TableHead></TableRow></TableHeader>
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
                                        <CardTitle className="flex items-center gap-2"><ClipboardMinus className="h-5 w-5 text-orange-500"/> {dict.dashboard?.recentIssues || 'Recent MIVs'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                                        <Link href="/inventory/issue-history">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                                 {mivsLoading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                : recentIssues.length === 0 ? <div className="text-center text-muted-foreground p-10">{dict.dashboard?.noRecentIssuesFound || 'No recent issues found.'}</div>
                                : (
                                        <Table>
                                                 <TableHeader><TableRow><TableHead>{dict.mivId || 'MIV ID'}</TableHead><TableHead>{dict.date || 'Date'}</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                        {recentIssues.map((miv, i) => (
                                                                <TableRow key={`${miv.id}-${i}`} onClick={() => router.push(`/inventory/issue-history/${miv.id}`)} className="cursor-pointer hover:bg-accent/30">
                                                                        <TableCell>
                                                                            <div className="font-medium text-primary underline-offset-2 hover:underline">{formatMivId(miv.id)}</div>
                                                                            <div className="text-sm text-muted-foreground">{residences.find(r => String(r.id) === String(miv.residenceId))?.name || miv.residenceId}</div>
                                                                        </TableCell>
                                                                        <TableCell>{format(miv.date.toDate(), 'PPP')}</TableCell>
                                                                </TableRow>
                                                        ))}
                                                </TableBody>
                                        </Table>
                                )}
            </CardContent>
        </Card>
      </div>
      
      {/* Pair: Recent Service Orders + Recent Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card className="border-t-4 border-fuchsia-500">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                                        <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-fuchsia-500"/> {(dict.dashboard as any)?.recentServiceOrders || 'Recent Service Orders'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                                        <Link href="/inventory/service-orders">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                ) : recentServiceOrders.length === 0 ? (
                                    <div className="text-center text-muted-foreground p-10">{(dict.dashboard as any)?.noServiceOrdersFound || 'No service orders found.'}</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{dict.idLabel || 'ID'}</TableHead>
                                                <TableHead>{dict.location || 'Location'}</TableHead>
                                                <TableHead>{dict.status || 'Status'}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentServiceOrders.map((o: ServiceOrder) => (
                                                <TableRow key={o.id} onClick={() => router.push(`/inventory/service-orders/${o.codeShort}`)} className="cursor-pointer hover:bg-accent/30">
                                                    <TableCell>
                                                        <div className="font-medium text-primary underline-offset-2 hover:underline">{o.codeShort}</div>
                                                        <div className="text-sm text-muted-foreground">{o.destination?.name}</div>
                                                    </TableCell>
                                                    <TableCell>{o.residenceName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={o.status === 'COMPLETED' ? 'default' : o.status === 'PARTIAL_RETURN' ? 'secondary' : o.status === 'CANCELLED' ? 'destructive' : 'outline'}>
                                                            {o.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
            </CardContent>
        </Card>

             <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5"/> {dict.dashboard?.recentMaintenance || 'Recent Maintenance'}</CardTitle>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/maintenance">{dict.viewAll || 'View All'}<ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                : recentMaintenance.length === 0 ? <div className="text-center text-muted-foreground p-10">{dict.dashboard?.noMaintenanceRequestsFound || 'No maintenance requests found.'}</div>
                : (
                    <Table>
                        <TableHeader><TableRow><TableHead>{dict.idLabel || 'ID'}</TableHead><TableHead>{dict.location || 'Location'}</TableHead><TableHead>{dict.status || 'Status'}</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {recentMaintenance.map((req, i) => (
                                <TableRow key={`${req.id}-${i}`}>
                                    <TableCell><div className="font-mono">{req.id}</div></TableCell>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card className="border-t-4 border-purple-500">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle className="flex items-center gap-2"><PackageOpen className="h-5 w-5 text-purple-500"/> {dict.sidebar?.stockReconciliation || 'Stock Reconciliation'}</CardTitle>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1">
                                <Link href="/inventory/inventory-audit">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isAdmin && (
                                <div className="space-y-3">
                                    <div className="text-sm font-medium">Pending</div>
                                    {pendingReconsLoading ? (
                                        <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                    ) : pendingRecons.length === 0 ? (
                                        <div className="text-center text-muted-foreground p-6">No pending reconciliation requests.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{dict.idLabel || 'ID'}</TableHead>
                                                    <TableHead>{dict.location || 'Location'}</TableHead>
                                                    <TableHead>{dict.status || 'Status'}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingRecons.slice(0,5).map(r => (
                                                    <TableRow key={r.id} onClick={() => router.push('/inventory/inventory-audit')} className="cursor-pointer hover:bg-accent/30">
                                                        <TableCell><div className="font-mono">{r.reservedId || r.id}</div></TableCell>
                                                        <TableCell>{residences.find(x => String(x.id) === String(r.residenceId))?.name || r.residenceId}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">Pending</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3 mt-6">
                                <div className="text-sm font-medium">Latest</div>
                                {reconsLoading ? (
                                    <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                ) : recentReconciliations.length === 0 ? (
                                    <div className="text-center text-muted-foreground p-6">{dict.noReconciliationsFound || 'No reconciliations found.'}</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{dict.idLabel || 'ID'}</TableHead>
                                                <TableHead>{dict.location || 'Location'}</TableHead>
                                                <TableHead>{dict.status || 'Status'}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentReconciliations.map((rec: any) => (
                                                <TableRow key={rec.id} onClick={() => router.push('/inventory/reports/reconciliations')} className="cursor-pointer hover:bg-accent/30">
                                                    <TableCell><div className="font-mono">{rec.id}</div></TableCell>
                                                    <TableCell>{residences.find(x => String(x.id) === String(rec.residenceId))?.name || rec.residenceId}</TableCell>
                                                    <TableCell><Badge variant="default">Completed</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                <Card className="border-t-4 border-rose-500">
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle className="flex items-center gap-2"><ArrowDownRight className="h-5 w-5 text-rose-500"/> {(dict.dashboard as any)?.recentDepreciation || 'Recent Depreciation'}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {deprLoading ? (
                            <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                        ) : recentDepreciation.length === 0 ? (
                            <div className="text-center text-muted-foreground p-10">No recent depreciation.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{dict.itemLabel || 'Item'}</TableHead>
                                        <TableHead>{dict.location || 'Location'}</TableHead>
                                        <TableHead>{dict.quantity || 'Quantity'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentDepreciation.map((tx) => (
                                        <TableRow key={tx.id} className="hover:bg-accent/30">
                                            <TableCell>
                                                <div className="font-medium">{tx.itemNameEn || tx.itemNameAr}</div>
                                                <div className="text-sm text-muted-foreground">{tx.referenceDocId}</div>
                                            </TableCell>
                                            <TableCell>{tx.locationName || residences.find(r => r.id === tx.residenceId)?.name || tx.residenceId}</TableCell>
                                            <TableCell>{tx.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
      </div>

                <Card className="border-t-4 border-teal-500">
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle className="flex items-center gap-2"><Move className="h-5 w-5 text-teal-500"/> {(dict.dashboard as any)?.recentStockTransfers || 'Recent Stock Transfers'}</CardTitle>
                        </div>
                        <Button asChild size="sm" className="ml-auto gap-1">
                            <Link href="/inventory/transfer">{dict.viewAll}<ArrowUpRight className="h-4 w-4" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {(!transfers || transfers.length === 0) ? (
                            <div className="text-center text-muted-foreground p-10">No stock transfers.</div>
                        ) : recentTransfers.length === 0 ? (
                            <div className="text-center text-muted-foreground p-10">No stock transfers.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>{dict.location || 'Location'}</TableHead>
                                        <TableHead>{dict.status || 'Status'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransfers.map((t: StockTransfer) => (
                                        <TableRow key={t.id} onClick={() => router.push('/inventory/transfer')} className="cursor-pointer hover:bg-accent/30">
                                            <TableCell><div className="font-medium text-primary underline-offset-2 hover:underline">{t.codeShort || t.id}</div></TableCell>
                                            <TableCell>
                                                <div className="font-medium">{t.fromResidenceName} → {t.toResidenceName}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={t.status === 'Completed' ? 'default' : t.status === 'Pending' ? 'secondary' : t.status === 'Rejected' ? 'destructive' : 'outline'}>
                                                    {t.status}
                                                </Badge>
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
