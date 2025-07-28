
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, PackageCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ReceivedItem extends OrderItem {
    quantityReceived: number;
    alreadyReceived: number;
}

export default function ReceiveOrderPage() {
    const { id } = useParams();
    const router = useRouter();
    const { getOrderById, receiveOrderItems, loading: ordersLoading } = useOrders();
    const [order, setOrder] = useState<Order | null>(null);
    const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchOrder = async () => {
            if (typeof id !== 'string') return;
            setLoading(true);
            const fetchedOrder = await getOrderById(id);
            if (fetchedOrder) {
                const receivableStatuses: Order['status'][] = ['Approved', 'Partially Delivered'];
                if (!receivableStatuses.includes(fetchedOrder.status)) {
                    toast({
                        title: "Invalid Status",
                        description: `This request has a status of "${fetchedOrder.status}" and cannot be received.`,
                        variant: "destructive"
                    });
                    router.push('/inventory/receive');
                    return;
                }
                setOrder(fetchedOrder);
                
                const initialReceivedItems = fetchedOrder.items.map(item => {
                    const alreadyReceived = fetchedOrder.itemsReceived?.find(ri => ri.id === item.id)?.quantityReceived || 0;
                    const remainingToReceive = item.quantity - alreadyReceived;
                    return {
                        ...item,
                        quantityReceived: remainingToReceive, // Default to receiving the remaining amount
                        alreadyReceived: alreadyReceived,
                    }
                });
                setReceivedItems(initialReceivedItems);
            }
            setLoading(false);
        };
        fetchOrder();
    }, [id, getOrderById, router, toast]);

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        const itemInfo = receivedItems.find(item => item.id === itemId);
        if (!itemInfo) return;

        const maxReceivable = itemInfo.quantity - itemInfo.alreadyReceived;
        let quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;
        if (quantity > maxReceivable) {
            quantity = maxReceivable;
            toast({ title: "Warning", description: "Cannot receive more than requested quantity." });
        }

        setReceivedItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantityReceived: quantity } : item
            )
        );
    };

    const handleConfirmReceipt = async () => {
        if (!order || receivedItems.length === 0) {
            toast({ title: "Error", description: "No items to receive.", variant: "destructive" });
            return;
        }
        
        const itemsToProcess = receivedItems
            .filter(item => item.quantityReceived > 0)
            .map(item => ({
                id: item.id,
                nameAr: item.nameAr,
                nameEn: item.nameEn,
                quantityReceived: item.quantityReceived,
            }));
        
        if (itemsToProcess.length === 0) {
            toast({ title: "No Change", description: "No new quantities were entered to receive." });
            return;
        }

        await receiveOrderItems(order.id, itemsToProcess);
        
        router.push('/inventory/orders');
    };

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
        );
    }

    if (!order) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">Request not found.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Receive Materials Voucher (MRV)</h1>
                    <p className="text-muted-foreground">Confirm quantities received for request #{order.id}</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={handleConfirmReceipt} disabled={ordersLoading}>
                        {ordersLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                            <><PackageCheck className="mr-2 h-4 w-4" /> Confirm Receipt & Update Stock</>
                        )}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Request Details</CardTitle>
                            <CardDescription>Request for <span className="font-semibold">{order.residence}</span> on {format(order.date.toDate(), 'PPP')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="w-[120px] text-center">Qty Requested</TableHead>
                                <TableHead className="w-[120px] text-center">Qty Received (Prev)</TableHead>
                                <TableHead className="w-[150px] text-center">Qty to Receive (Now)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receivedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                        <p className="text-sm text-muted-foreground">{item.category} - {item.unit}</p>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                    <TableCell className="text-center font-medium">{item.alreadyReceived}</TableCell>
                                    <TableCell>
                                         <Input 
                                            type="number" 
                                            value={item.quantityReceived} 
                                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))} 
                                            className="w-24 text-center mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                            min={0}
                                            max={item.quantity - item.alreadyReceived}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
