
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders, type Order } from '@/context/orders-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { getOrderById } = useOrders();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (typeof id === 'string') {
                setLoading(true);
                const fetchedOrder = await getOrderById(id);
                setOrder(fetchedOrder);
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, getOrderById]);
    
    const handlePrint = () => {
        window.print();
    }

    if (loading) {
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
                <p className="text-xl text-muted-foreground">Order not found.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="flex items-center justify-between print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Order
                </Button>
            </div>

             <Card className="print:shadow-none print:border-none">
                <CardHeader className="border-b print:border-b-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">Purchase Order</CardTitle>
                            <CardDescription className="text-lg">ID: #{order.id.slice(-6).toUpperCase()}</CardDescription>
                        </div>
                         <div className="text-right">
                            <p className="font-semibold">{order.supplier}</p>
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
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Item Name (Arabic)</TableHead>
                                <TableHead>Item Name (English)</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.id.slice(0,6)}</TableCell>
                                    <TableCell>{item.nameAr}</TableCell>
                                    <TableCell>{item.nameEn}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-6 text-right font-bold text-lg pr-4">
                        Total Quantity: {totalItems}
                    </div>
                </CardContent>
            </Card>

             <style jsx global>{`
                @media print {
                    body {
                        background: white;
                    }
                    main {
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    )
}
