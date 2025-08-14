
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, PackageCheck, PackageX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReceivedItem extends OrderItem {
    quantityReceived: number;
    alreadyReceived: number;
}

export default function ReceiveOrderPage() {
    const { id } = useParams();
    const router = useRouter();
    const { receiveOrderItems, loading: ordersLoading } = useOrders();
    const [order, setOrder] = useState<Order | null>(null);
    const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchOrderForPage = useCallback(async (orderId: string) => {
        if (!db) return;
        setLoading(true);
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
             const fetchedOrder = { id: orderSnap.id, ...orderSnap.data() } as Order;
             const receivableStatuses: Array<Order['status']> = ['Approved', 'Partially Delivered'];
             
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
                    quantityReceived: remainingToReceive,
                    alreadyReceived: alreadyReceived,
                }
            });
            setReceivedItems(initialReceivedItems);
        } else {
             toast({ title: "Error", description: "Order not found.", variant: "destructive" });
             router.push('/inventory/receive');
        }
        setLoading(false);
    }, [router, toast]);

    useEffect(() => {
        if (typeof id === 'string') {
            fetchOrderForPage(id);
        }
    }, [id, fetchOrderForPage]);

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        const itemInfo = receivedItems.find(item => item.id === itemId);
        if (!itemInfo) return;

        // Allow over-receipt: only enforce non-negative numbers
        const quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;

        setReceivedItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantityReceived: quantity } : item
            )
        );
    };

    const handleConfirmReceipt = async (forceComplete: boolean = false) => {
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
        
        if (itemsToProcess.length === 0 && !forceComplete) {
            toast({ title: "No Change", description: "No new quantities were entered to receive." });
            return;
        }

        try {
            await receiveOrderItems(order.id, itemsToProcess, forceComplete);
            router.push('/inventory/orders');
        } catch (error) {
            // Error toast is handled by the context
            console.error(error);
        }
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
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="secondary" disabled={ordersLoading}>
                                 {ordersLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /></>
                                ) : (
                                    <><PackageX className="mr-2 h-4 w-4" /> Receive & Close Order</>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to close this order?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will receive the currently entered quantities and mark the order as "Delivered", even if not all items were fully received. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleConfirmReceipt(true)}>
                                    Confirm and Close
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => handleConfirmReceipt(false)} disabled={ordersLoading}>
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
