
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListFilter, MoreHorizontal, Pencil, Trash2, Eye, Truck, CheckCircle, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { useOrders, type Order, type OrderStatus } from "@/context/orders-context";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUsers } from "@/context/users-context";


export default function PurchaseOrdersPage() {
    const { orders, loading, loadOrders, deleteOrder, updateOrderStatus } = useOrders();
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const router = useRouter();

    // This is a temporary placeholder for auth. 
    // In a real app, you would get the current user from your auth context.
    const { users } = useUsers();
    const currentUser = users[0]; 
    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        setFilteredOrders(orders);
    }, [orders]);


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

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">Purchase Orders</h1>
                <p className="text-muted-foreground">Review and manage all purchase orders.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span>Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Pending</DropdownMenuItem>
                            <DropdownMenuItem>Approved</DropdownMenuItem>
                            <DropdownMenuItem>Delivered</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            
            <Card>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? renderSkeleton() : filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium" onClick={() => router.push(`/inventory/orders/${order.id}`)}>{order.id.slice(-6).toUpperCase()}</TableCell>
                                    <TableCell onClick={() => router.push(`/inventory/orders/${order.id}`)}>{format(order.date.toDate(), 'PPP')}</TableCell>
                                    <TableCell onClick={() => router.push(`/inventory/orders/${order.id}`)}>{order.supplier}</TableCell>
                                    <TableCell onClick={() => router.push(`/inventory/orders/${order.id}`)}>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                    <TableCell onClick={() => router.push(`/inventory/orders/${order.id}`)}>
                                        <Badge variant={
                                            order.status === 'Delivered' ? 'default' 
                                            : order.status === 'Approved' ? 'secondary' 
                                            : order.status === 'Cancelled' ? 'destructive'
                                            : 'outline'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/inventory/orders/${order.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                {isAdmin && (
                                                    <DropdownMenuItem onClick={() => router.push(`/inventory/orders/${order.id}/edit`)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Order
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Pending')}>
                                                            <XCircle className="mr-2 h-4 w-4" /> Pending
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Approved')}>
                                                            <CheckCircle className="mr-2 h-4 w-4" /> Approved
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Delivered')}>
                                                            <Truck className="mr-2 h-4 w-4" /> Delivered
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Cancelled')}>
                                                            <XCircle className="mr-2 h-4 w-4 text-destructive" /> Cancelled
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                                <DropdownMenuSeparator />
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Order
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete order #{order.id.slice(-6).toUpperCase()}. This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteOrder(order.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">No purchase orders found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
