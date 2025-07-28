
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrders, type Order } from "@/context/orders-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { useUsers } from "@/context/users-context";
import { ArrowRight } from "lucide-react";
import { useResidences } from "@/context/residences-context";

export default function ReceiveMaterialsPage() {
    const { orders, loading, loadOrders } = useOrders();
    const router = useRouter();
    const { currentUser } = useUsers();
    const { residences, loadResidences } = useResidences();


    useEffect(() => {
        loadOrders();
        if (residences.length === 0) {
            loadResidences();
        }
    }, [loadOrders, loadResidences, residences.length]);

    const userApprovedOrders = useMemo(() => {
        if (!currentUser) return [];

        const approvedOrders = orders.filter(order => order.status === 'Approved');
        
        if (currentUser.role === 'Admin') {
            return approvedOrders;
        }
        
        return approvedOrders.filter(order => currentUser.assignedResidences.includes(order.residenceId));
    }, [orders, currentUser, residences]);


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

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Receive Materials (MRV)</h1>
                    <p className="text-muted-foreground">Select an approved request to receive its items.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Approved Material Requests</CardTitle>
                    <CardDescription>
                        Showing requests assigned to your residences that are approved and pending delivery.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Residence</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? renderSkeleton() : userApprovedOrders.length > 0 ? userApprovedOrders.map((order) => (
                                <TableRow key={order.id} className="cursor-pointer" onClick={() => handleSelectOrder(order.id)}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{format(order.date.toDate(), 'PPP')}</TableCell>
                                    <TableCell>{order.residence}</TableCell>
                                    <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                    <TableCell>
                                        <Badge variant='secondary'>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">
                                            Receive <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">No approved requests found waiting for delivery.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}


    
