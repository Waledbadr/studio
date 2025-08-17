'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ListFilter, MoreHorizontal, Pencil, Trash2, Eye, Truck, CheckCircle, XCircle, PlusCircle, ChevronDown, ChevronUp, Archive, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { useOrders, type Order, type OrderStatus } from "@/context/orders-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUsers } from "@/context/users-context";
import { useResidences } from "@/context/residences-context";
import { useLanguage } from '@/context/language-context';


export default function PurchaseOrdersPage() {
    const { orders, loading, loadOrders, deleteOrder, updateOrderStatus } = useOrders();
    const { dict } = useLanguage();
    // Helper to display ID in new short format for legacy records
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
    const router = useRouter();
    const { currentUser } = useUsers();
    const { residences, loadResidences } = useResidences();
    const isAdmin = currentUser?.role === 'Admin';
    const [isCompletedOpen, setIsCompletedOpen] = useState(false);

    // Load completed section state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('orders-completed-open');
        if (savedState !== null) {
            setIsCompletedOpen(JSON.parse(savedState));
        }
    }, []);
    
    // UseEffect to load orders when the component mounts
    useEffect(() => {
        loadOrders();
        if (residences.length === 0) {
            loadResidences();
        }
    }, [loadOrders, loadResidences, residences.length]);


    // Save completed section state to localStorage
    const handleCompletedToggle = (open: boolean) => {
        setIsCompletedOpen(open);
        localStorage.setItem('orders-completed-open', JSON.stringify(open));
    };

    const filteredOrders = useMemo(() => {
        if (!currentUser) return [];
        if (isAdmin) return orders;

        return orders.filter(order => currentUser.assignedResidences.includes(order.residenceId));
    }, [orders, currentUser, isAdmin, residences]);

    // فصل الطلبات حسب الحالة
    const activeOrders = useMemo(() => {
        return filteredOrders.filter(order => 
            order.status !== 'Delivered' && order.status !== 'Cancelled'
        );
    }, [filteredOrders]);

    const completedOrders = useMemo(() => {
        return filteredOrders.filter(order => 
            order.status === 'Delivered' || order.status === 'Cancelled'
        );
    }, [filteredOrders]);


    const renderSkeleton = () => (
        Array.from({ length: 5 }).map((_, i) => (
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

    const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
        if (status === 'Approved' && currentUser) {
            updateOrderStatus(orderId, status, currentUser.id);
        } else {
            updateOrderStatus(orderId, status);
        }
    };

    const renderOrdersTable = (ordersList: Order[], showActions: boolean = true) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{dict.orderId || 'Request ID'}</TableHead>
                    <TableHead>{dict.date || 'Date'}</TableHead>
                    <TableHead>{dict.location || 'Residence'}</TableHead>
                    <TableHead>{dict.items || 'Items'}</TableHead>
                    <TableHead>{dict.status || 'Status'}</TableHead>
                    {showActions && <TableHead className="text-right">{dict.actions || 'Actions'}</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? renderSkeleton() : ordersList.length > 0 ? ordersList.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/inventory/orders/${order.id}`)}>{formatOrderId(order.id)}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => router.push(`/inventory/orders/${order.id}`)}>{format(order.date.toDate(), 'PPP')}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => router.push(`/inventory/orders/${order.id}`)}>{order.residence}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => router.push(`/inventory/orders/${order.id}`)}>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => router.push(`/inventory/orders/${order.id}`)}>
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
                        {showActions && (
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/inventory/orders/${order.id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" /> {dict.viewAll || 'View Details'}
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <DropdownMenuItem onClick={() => router.push(`/inventory/orders/${order.id}/edit`)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Request
                                            </DropdownMenuItem>
                                        )}
                                        {isAdmin && <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Pending')}>
                                                    <XCircle className="mr-2 h-4 w-4" /> {dict.dashboard?.pending || 'Pending'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Approved')}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> {dict.ui?.saveChanges || 'Approved'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                                                    <Truck className="mr-2 h-4 w-4" /> {dict.delivered || 'Delivered'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                                                    <XCircle className="mr-2 h-4 w-4 text-destructive" /> {dict.cancelled || 'Cancelled'}
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>}
                                        {isAdmin && <DropdownMenuSeparator />}
                                         {isAdmin && <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Request
                                                </button>
                                            </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{'Are you sure?'}</AlertDialogTitle>
                                                    <AlertDialogDescription>{`This will permanently delete request #${order.id}. This action cannot be undone.`}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{dict.ui?.cancel || 'Cancel'}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteOrder(order.id)}>{'Delete'}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        )}
                    </TableRow>
                )) : (
                    <TableRow>
                            <TableCell colSpan={showActions ? 6 : 5} className="h-48 text-center text-muted-foreground">
                            {dict.noRecordsFound || 'No material requests found.'}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );


    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">{dict.ui?.materialsApp || 'Materials Requests'}</h1>
                <p className="text-muted-foreground">{dict.ui?.currentRequest || 'Review and manage all material requests.'}</p>
                </div>
                 <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button asChild variant="secondary">
                             <Link href="/inventory/orders/consolidated-report">
                                <Printer className="mr-2 h-4 w-4" /> {dict.consolidatedPrinting || 'Consolidated Printing'}
                            </Link>
                        </Button>
                    )}
                    <Button asChild>
                        <Link href="/inventory/new-order">
                        <PlusCircle className="mr-2 h-4 w-4" /> {dict.newRequest || 'New Request'}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{dict.activeRequests || 'Active Requests'}</p>
                                <p className="text-2xl font-bold">{activeOrders.length}</p>
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
                                <p className="text-2xl font-bold">
                                    {completedOrders.filter(o => o.status === 'Delivered').length}
                                </p>
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
                                <p className="text-sm font-medium">{dict.cancelled || 'Cancelled'}</p>
                                <p className="text-2xl font-bold">
                                    {completedOrders.filter(o => o.status === 'Cancelled').length}
                                </p>
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
                                <p className="text-2xl font-bold">{filteredOrders.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>{dict.activeRequests || 'Active Requests'}</CardTitle>
                        <CardDescription>
                            {dict.requestsNeedAttention || 'Pending and in-progress material requests'} ({activeOrders.length} {dict.items || 'requests'})
                        </CardDescription>
                    </div>
                        <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCompletedToggle(!isCompletedOpen)}
                        className="flex items-center gap-2"
                    >
                        <Archive className="h-4 w-4" />
                        {isCompletedOpen ? dict.ui?.hideCompleted || 'Hide Completed' : dict.ui?.showCompleted || 'Show Completed'}
                        <Badge variant="secondary" className="text-xs">
                            {completedOrders.length}
                        </Badge>
                    </Button>
                </CardHeader>
                <CardContent>
                    {renderOrdersTable(activeOrders)}
                </CardContent>
            </Card>

            {/* Completed Orders - Collapsible */}
            {completedOrders.length > 0 && (
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
                                            <CardTitle className="text-base">Completed Requests</CardTitle>
                                            <CardDescription>
                                                Delivered and cancelled requests • Click to {isCompletedOpen ? 'collapse' : 'expand'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                                <Truck className="h-3 w-3 mr-1" />
                                                {completedOrders.filter(o => o.status === 'Delivered').length} Delivered
                                            </Badge>
                                            {completedOrders.filter(o => o.status === 'Cancelled').length > 0 && (
                                                <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    {completedOrders.filter(o => o.status === 'Cancelled').length} Cancelled
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
                            <CardContent className="pt-4">
                                {renderOrdersTable(completedOrders, false)}
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            )}
        </div>
    )
}


