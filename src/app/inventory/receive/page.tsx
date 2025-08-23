'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useInventory } from "@/context/inventory-context";
import { useOrders, type Order } from "@/context/orders-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { useUsers } from "@/context/users-context";
import { ArrowRight, History, Archive, ChevronDown, ChevronUp, CheckCircle, Truck, Clock, XCircle, Plus } from "lucide-react";
import { useResidences } from "@/context/residences-context";
import { useLanguage } from '@/context/language-context';

export default function ReceiveMaterialsPage() {
    const { getMRVRequests, approveMRVRequest, getMRVs } = useInventory();
    const { dict } = useLanguage();
    const { orders, loadOrders } = useOrders();
    const router = useRouter();
    const { currentUser } = useUsers();
    const { residences, loadResidences } = useResidences();
    const isAdmin = currentUser?.role === 'Admin';
    const [isCompletedOpen, setIsCompletedOpen] = useState(false);
    const [pendingMrvCount, setPendingMrvCount] = useState(0);
    const [approvedMrvCount, setApprovedMrvCount] = useState(0);
    const [pendingMrvRequests, setPendingMrvRequests] = useState<any[]>([]);
    const [approvedMrvRequests, setApprovedMrvRequests] = useState<any[]>([]);
    const [rejectedMrvCount, setRejectedMrvCount] = useState(0);
    const [approveBusy, setApproveBusy] = useState<Record<string, boolean>>({});
    const [mrvsList, setMrvsList] = useState<any[]>([]);
    const residenceName = (id: string) => residences.find(r => r.id === id)?.name || id;

    // helper to load MRV stats (pending list, counts)
    const loadMrvStats = async () => {
        try {
            const reqs = await getMRVRequests('Pending');
            const visibleReqs = isAdmin ? reqs : reqs.filter(r => currentUser?.assignedResidences?.includes(r.residenceId));
            setPendingMrvRequests(visibleReqs);
            setPendingMrvCount(visibleReqs.length || 0);
            const approved = await getMRVRequests('Approved');
            const visibleApproved = isAdmin ? approved : approved.filter(r => currentUser?.assignedResidences?.includes(r.residenceId));
            setApprovedMrvRequests(visibleApproved);
            const rejected = await getMRVRequests('Rejected');
            const visibleRejected = isAdmin ? rejected : rejected.filter(r => currentUser?.assignedResidences?.includes(r.residenceId));
            setRejectedMrvCount(visibleRejected.length || 0);

            // Load posted MRVs (completed receipts) from MRV master collection
            const allMrvs = await getMRVs();
            const visibleMrvs = isAdmin ? allMrvs : allMrvs.filter((m: any) => currentUser?.assignedResidences?.includes(m.residenceId));
            setMrvsList(visibleMrvs);
            setApprovedMrvCount(visibleMrvs.length || 0);
        } catch {}
    };

    // Load completed section state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('receive-completed-open');
        if (savedState !== null) {
            setIsCompletedOpen(JSON.parse(savedState));
        }
    }, []);
    
    // UseEffect to load MRV stats when the component mounts
    useEffect(() => {
        if (!currentUser) return;
        if (residences.length === 0) {
            loadResidences();
        }
        // Ensure orders are subscribed so Approved/Partially Delivered MRs appear here
        loadOrders();
        loadMrvStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, loadResidences, residences.length, isAdmin]);


    // Save completed section state to localStorage
    const handleCompletedToggle = (open: boolean) => {
        setIsCompletedOpen(open);
        localStorage.setItem('receive-completed-open', JSON.stringify(open));
    };

    // Derive Approved/Partially Delivered Material Requests (MR) visible to user
    const userVisibleApprovedMRs = useMemo(() => {
        const approvable: Order['status'][] = ['Approved', 'Partially Delivered'];
        const list = (orders || []).filter(o => approvable.includes(o.status));
        if (isAdmin) return list;
        const ids = currentUser?.assignedResidences || [];
        return list.filter(o => ids.includes(o.residenceId));
    }, [orders, isAdmin, currentUser]);


    const renderSkeleton = () => (
        Array.from({ length: 3 }).map((_, i) => (
             <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
        ))
    );
    
    // No MR select on MRV page

                // Build unified rows for Ready section (Pending MRV requests + Approved/Partially Delivered MRs)
    const readyRows = useMemo(() => {
        const rows: any[] = [];
        // MRV Pending
        for (const r of pendingMrvRequests) {
          const busy = !!approveBusy[r.id];
          rows.push({
            key: `mrv-${r.id}`,
            id: r.mrvShort || r.id,
            type: 'MRV',
            dateLabel: r.requestedAt?.toDate ? format(r.requestedAt.toDate(), 'PPP') : '-',
            residence: residenceName(r.residenceId),
            items: (r.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0),
            status: <Badge variant="secondary">Pending</Badge>,
            href: `/inventory/receive/approvals/${r.id}`,
            action: (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push(`/inventory/receive/approvals/${r.id}`)}>
                  {isAdmin ? 'Review' : 'View'}
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={async () => {
                      if (busy) return;
                      setApproveBusy(prev => ({ ...prev, [r.id]: true }));
                      try {
                        await approveMRVRequest(r.id, currentUser!.id);
                        await loadMrvStats();
                      } catch {}
                      setApproveBusy(prev => ({ ...prev, [r.id]: false }));
                    }}
                  >
                    {busy ? 'Approving…' : 'Approve'}
                  </Button>
                )}
              </div>
            )
          });
        }
                // MR Approved or Partially Delivered (ready to receive)
                for (const o of userVisibleApprovedMRs) {
                    rows.push({
                        key: `mr-${o.id}`,
                        id: o.id,
                        type: 'MR',
                        dateLabel: o.date?.toDate ? format(o.date.toDate(), 'PPP') : '-',
                        residence: residenceName(o.residenceId),
                        items: (o.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0),
                        status: (
                            <Badge variant={o.status === 'Approved' ? 'secondary' : 'outline'}>
                                {o.status}
                            </Badge>
                        ),
                        href: `/inventory/receive/${o.id}`,
                        action: (
                            <div className="flex items-center justify-end gap-2">
                                <Button size="sm" onClick={() => router.push(`/inventory/receive/${o.id}`)}>
                                    Receive
                                </Button>
                            </div>
                        )
                    });
                }
        return rows;
                        }, [pendingMrvRequests, userVisibleApprovedMRs, isAdmin, currentUser, router, residenceName, approveMRVRequest, loadMrvStats, approveBusy]);

                // Build rows for Completed section from MRVs (posted receipts)
    const completedRows = useMemo(() => {
                const rows: any[] = [];
                for (const mrv of mrvsList) {
                    rows.push({
                        key: `mrv-${mrv.id}`,
                        id: mrv.id,
                        type: 'MRV',
            mrRef: mrv.orderId || null,
                        dateLabel: mrv.date?.toDate ? format(mrv.date.toDate(), 'PPP') : '-',
                        residence: residenceName(mrv.residenceId),
                        items: Number(mrv.itemCount || 0),
                        status: <Badge>Delivered</Badge>,
                        href: `/inventory/receive/receipts/${mrv.id}`,
                    });
                }
                return rows;
                        }, [mrvsList, router, residenceName]);

    const renderUnifiedTable = (rows: any[], showActions: boolean = true, showMrRef: boolean = false) => (
        <Table>
            <TableHeader>
                <TableRow>
                                            <TableHead>{dict.orderId || 'Request ID'}</TableHead>
                                            <TableHead>{'Type'}</TableHead>
            {showMrRef && <TableHead>{'MR Ref'}</TableHead>}
                        <TableHead>{dict.date || 'Date'}</TableHead>
                        <TableHead>{dict.location || 'Residence'}</TableHead>
                        <TableHead>{dict.items || 'Items'}</TableHead>
                        <TableHead>{dict.status || 'Status'}</TableHead>
                        {showActions && <TableHead className="text-right">{dict.actions || 'Action'}</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length > 0 ? rows.map((row) => (
                                        <TableRow
                                            key={row.key}
                                            onClick={() => { if (row.href) router.push(row.href); }}
                                            className={row.href ? 'cursor-pointer hover:bg-muted/50' : ''}
                                        >
                                                <TableCell className="font-medium">{row.id}</TableCell>
                                                <TableCell>{row.type || '-'}</TableCell>
                        {showMrRef && (<TableCell>{row.mrRef || '-'}</TableCell>)}
                                                <TableCell>{row.dateLabel}</TableCell>
                                                <TableCell>{row.residence}</TableCell>
                                                <TableCell>{row.items}</TableCell>
                                                <TableCell>{row.status}</TableCell>
                                                {showActions && (
                                                    <TableCell className="text-right">{row.action}</TableCell>
                                                )}
                                        </TableRow>
                )) : (
                                        <TableRow>
                                                <TableCell colSpan={(showActions ? 7 : 6) + (showMrRef ? 1 : 0)} className="h-32 text-center text-muted-foreground">
                                                    {dict.noRecordsFound || 'No records found.'}
                                                </TableCell>
                                        </TableRow>
                )}
            </TableBody>
        </Table>
    );

    const readyToReceiveCount = pendingMrvCount + userVisibleApprovedMRs.length;
    const completedDeliveredCount = approvedMrvCount; // equals mrvsList.length
    const totalRequestsCount = pendingMrvCount + approvedMrvRequests.length + rejectedMrvCount;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                   <h1 className="text-2xl font-bold">{dict.receiveMrvTitle || 'Material Receive Voucher (MRV)'}</h1>
                   <p className="text-muted-foreground">{dict.receiveMrvPageDescription || dict.ui?.currentRequest}</p>
               </div>
                 <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => router.push('/inventory/receive/new-approval')}>
                            {dict.newMRVApproval || dict.reviewLabel}
                    </Button>
                    {/* View MRV receipts history */}
                    <Button variant="outline" onClick={() => router.push('/inventory/receive/receipts')}>
                        <History className="mr-2 h-4 w-4" /> {dict.viewAll || 'View Receipts History'}
                    </Button>
                    {/* Navigate to MR (Materials Requests) dedicated page */}
                    <Button variant="outline" onClick={() => router.push('/inventory/orders')}>
                            {dict.materialsRequestsLabel || dict.ui?.materialsApp}
                    </Button>
                </div>
            </div>

            {/* Quick Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{dict.readyToReceive || 'Ready to Receive'}</p>
                                <p className="text-2xl font-bold">{readyToReceiveCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{dict.delivered || 'Delivered'}</p>
                                <p className="text-2xl font-bold">{completedDeliveredCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{dict.ui?.rejected || 'Rejected'}</p>
                                <p className="text-2xl font-bold">{rejectedMrvCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <Archive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{dict.totalRequestsCard || 'Total Requests'}</p>
                                <p className="text-2xl font-bold">{totalRequestsCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>{dict.pendingMRVApprovals || 'Pending MRV Approvals'}</CardTitle>
                        <CardDescription>
                            {dict.pendingMrvCardDescription || 'Requests awaiting approval or posting to stock'} ({pendingMrvCount} requests)
                        </CardDescription>
                    </div>
                        <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCompletedToggle(!isCompletedOpen)}
                        className="flex items-center gap-2"
                    >
                        <Archive className="h-4 w-4" />
                        {isCompletedOpen ? dict.ui?.hideCompleted : dict.ui?.showCompleted}
                        <Badge variant="secondary" className="text-xs">
                            {mrvsList.length}
                        </Badge>
                    </Button>
                </CardHeader>
                <CardContent>
                    {renderUnifiedTable(readyRows, true)}
                </CardContent>
            </Card>

            {/* Completed Orders - Collapsible */}
             {(mrvsList.length > 0) && (
                 <Collapsible open={isCompletedOpen} onOpenChange={handleCompletedToggle}>
                     <Card className={isCompletedOpen ? "border-muted" : "border-muted/50"}>
                         <CollapsibleTrigger asChild>
                             <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-muted/50">
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <div className="p-2 bg-muted/50 rounded-lg">
                                             <Archive className="h-4 w-4 text-muted-foreground" />
                                         </div>
                                         <div>
                                             <CardTitle className="text-base">Completed MRV Requests</CardTitle>
                                             <CardDescription>
                                                 All posted MRV receipts • Click to {isCompletedOpen ? 'collapse' : 'expand'}
                                             </CardDescription>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <div className="flex items-center gap-2">
                                             <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                                 <Truck className="h-3 w-3 mr-1" />
                                                 {approvedMrvCount} Delivered
                                             </Badge>
                                             {rejectedMrvCount > 0 && (
                                                 <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                                     <XCircle className="h-3 w-3 mr-1" />
                                                     {rejectedMrvCount} Rejected
                                                 </Badge>
                                             )}
                                         </div>
                                        {isCompletedOpen ? (
                                             <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                         ) : (
                                             <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                         )}
                                     </div>
                                 </div>
                             </CardHeader>
                         </CollapsibleTrigger>
                         <CollapsibleContent>
                             <CardContent className="pt-4 space-y-8">
                                 {renderUnifiedTable(completedRows, false, true)}
                             </CardContent>
                         </CollapsibleContent>
                     </Card>
                 </Collapsible>
             )}
        </div>
    )
}
