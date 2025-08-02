
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useOrders, type Order } from "@/context/orders-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { useUsers } from "@/context/users-context";
import { ArrowRight, History, Archive, ChevronDown, ChevronUp, CheckCircle, Truck, Clock, XCircle } from "lucide-react";
import { useResidences } from "@/context/residences-context";

export default function ReceiveMaterialsPage() {
    const { orders, loading, loadOrders } = useOrders();
    const router = useRouter();
    const { currentUser } = useUsers();
    const { residences, loadResidences } = useResidences();
    const isAdmin = currentUser?.role === 'Admin';
    const [isCompletedOpen, setIsCompletedOpen] = useState(false);

    // Load completed section state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('receive-completed-open');
        if (savedState !== null) {
            setIsCompletedOpen(JSON.parse(savedState));
        }
    }, []);

    // Save completed section state to localStorage
    const handleCompletedToggle = (open: boolean) => {
        setIsCompletedOpen(open);
        localStorage.setItem('receive-completed-open', JSON.stringify(open));
    };


    useEffect(() => {
        loadOrders();
        if (residences.length === 0) {
            loadResidences();
        }
    }, [loadOrders, loadResidences, residences.length]);

    const userApprovedOrders = useMemo(() => {
        if (!currentUser) return [];

        const receivableStatuses: Order['status'][] = ['Approved', 'Partially Delivered'];
        const approvedOrders = orders.filter(order => receivableStatuses.includes(order.status));
        
        if (isAdmin) {
            return approvedOrders;
        }
        
        return approvedOrders.filter(order => currentUser.assignedResidences.includes(order.residenceId));
    }, [orders, currentUser, isAdmin]);

    // فصل الطلبات حسب الحالة
    const allUserOrders = useMemo(() => {
        if (!currentUser) return [];
        
        if (isAdmin) {
            return orders;
        }
        
        return orders.filter(order => currentUser.assignedResidences.includes(order.residenceId));
    }, [orders, currentUser, isAdmin]);

    const completedOrders = useMemo(() => {
        return allUserOrders.filter(order => 
            order.status === 'Delivered' || order.status === 'Cancelled'
        );
    }, [allUserOrders]);


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
    
    const handleSelectOrder = (orderId: string) => {
        router.push(`/inventory/receive/${orderId}`);
    };

    const renderOrdersTable = (ordersList: Order[], showActions: boolean = true) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Residence</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    {showActions && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? renderSkeleton() : ordersList.length > 0 ? ordersList.map((order) => (
                    <TableRow 
                        key={order.id} 
                        className={showActions ? "cursor-pointer" : ""} 
                        onClick={showActions ? () => handleSelectOrder(order.id) : undefined}
                    >
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{format(order.date.toDate(), 'PPP')}</TableCell>
                        <TableCell>{order.residence}</TableCell>
                        <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
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
                        {showActions && (
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm">
                                    Receive <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </TableCell>
                        )}
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={showActions ? 6 : 5} className="h-48 text-center text-muted-foreground">
                            {showActions 
                                ? "No approved requests found waiting for delivery." 
                                : "No completed requests found."
                            }
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
                    <h1 className="text-2xl font-bold">Receive Materials (MRV)</h1>
                    <p className="text-muted-foreground">Select an approved request to receive its items.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push('/inventory/orders')}>
                        <History className="mr-2 h-4 w-4" /> View Request History
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
                                <p className="text-sm font-medium">Ready to Receive</p>
                                <p className="text-2xl font-bold">{userApprovedOrders.length}</p>
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
                                <p className="text-sm font-medium">Delivered</p>
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
                                <p className="text-sm font-medium">Cancelled</p>
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
                                <p className="text-sm font-medium">Total Requests</p>
                                <p className="text-2xl font-bold">{allUserOrders.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Ready to Receive</CardTitle>
                        <CardDescription>
                            Approved requests ready for material receiving ({userApprovedOrders.length} requests)
                        </CardDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCompletedToggle(!isCompletedOpen)}
                        className="flex items-center gap-2"
                    >
                        <Archive className="h-4 w-4" />
                        {isCompletedOpen ? 'Hide Completed' : 'Show Completed'}
                        <Badge variant="secondary" className="text-xs">
                            {completedOrders.length}
                        </Badge>
                    </Button>
                </CardHeader>
                <CardContent>
                    {renderOrdersTable(userApprovedOrders)}
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
