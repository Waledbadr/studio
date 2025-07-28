
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders, type Order } from '@/context/orders-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useUsers } from '@/context/users-context';
import type { OrderItem } from '@/context/orders-context';

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { getOrderById } = useOrders();
    const { currentUser, users, loading: usersLoading } = useUsers();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        const fetchOrder = async () => {
            if (typeof id === 'string') {
                setLoading(true);
                const fetchedOrder = await getOrderById(id);
                setOrder(fetchedOrder);
                setLoading(false);
            }
        };
        if (id && users.length > 0) { // Ensure users are loaded before checking roles
            fetchOrder();
        }
    }, [id, getOrderById, users]);
    
    const handlePrint = () => {
        window.print();
    }
    
    const handleEdit = () => {
        router.push(`/inventory/orders/${id}/edit`);
    }

    if (loading || usersLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">Request not found.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const groupedItems = order.items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, Order['items']>);

    return (
        <div className="space-y-6">
             <style jsx global>{`
                @media print {
                  body {
                    background: white !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                   main {
                     padding: 0 !important;
                   }
                  .printable-area {
                    display: block !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                }
            `}</style>

            <div className="flex items-center justify-between no-print">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requests
                </Button>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                         <Button variant="secondary" onClick={handleEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Request
                        </Button>
                    )}
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Request
                    </Button>
                </div>
            </div>

             <Card className="printable-area" id="print-area">
                <CardHeader className="border-b print:border-b-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">Materials Request</CardTitle>
                            <CardDescription className="text-lg">ID: #{order.id}</CardDescription>
                        </div>
                         <div className="text-right">
                            <p className="font-semibold">{order.residence}</p>
                            <p className="text-sm text-muted-foreground">Date: {format(order.date.toDate(), 'PPP')}</p>
                            <Badge className="mt-2" variant={
                                order.status === 'Delivered' ? 'default'
                                : order.status === 'Approved' ? 'secondary'
                                : order.status === 'Cancelled' ? 'destructive'
                                : 'outline'
                            }>
                                {order.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name (Arabic)</TableHead>
                                <TableHead>Item Name (English)</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-center">Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <React.Fragment key={category}>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 print:bg-gray-100">
                                        <TableCell colSpan={5} className="font-semibold text-primary capitalize py-2">
                                            {category}
                                        </TableCell>
                                    </TableRow>
                                    {items.map((item: OrderItem) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.nameAr}</TableCell>
                                            <TableCell>{item.nameEn}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                            <TableCell className="text-center">{item.stock}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                    
                    <div className="mt-6 text-right font-bold text-lg pr-4 border-t pt-4">
                        Total Quantity: {totalItems}
                    </div>
                </CardContent>
            </Card>

            <div className="hidden">
                 <div className="no-print"></div>
            </div>
        </div>
    )
}
