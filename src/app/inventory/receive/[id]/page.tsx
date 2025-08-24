
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
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/context/users-context';
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
    const { dict } = useLanguage();
    const { currentUser } = useUsers();
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

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
                    title: dict.invalidStatusTitle,
                    description: dict.invalidStatusCannotBeReceived.replace('{status}', fetchedOrder.status),
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
             toast({ title: dict.invalidStatusTitle, description: dict.orderNotFoundDescription, variant: "destructive" });
             router.push('/inventory/receive');
        }
        setLoading(false);
    }, [router, toast]);

    useEffect(() => {
        if (typeof id === 'string') {
            fetchOrderForPage(id);
        }
    }, [id, fetchOrderForPage]);

    // Admin/Supervisor guard for receiving actions to avoid Firestore permission errors
    useEffect(() => {
        if (currentUser && !(currentUser.role === 'Admin' || currentUser.role === 'Supervisor')) {
            toast({
                title: 'Insufficient permissions',
                description: 'Only Admins or Supervisors can receive materials and update stock.',
                variant: 'destructive'
            });
            router.push('/inventory/receive');
        }
    }, [currentUser, router, toast]);

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
        if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor')) {
            toast({ title: 'Insufficient permissions', description: 'Only Admins or Supervisors can perform this action.', variant: 'destructive' });
            return;
        }
        if (!order || receivedItems.length === 0) {
                toast({ title: dict.invalidStatusTitle, description: dict.noItemsToReceive, variant: "destructive" });
            return;
        }
        
        const itemsToProcess = receivedItems
            .filter(item => item.quantityReceived > 0)
            .map(item => ({
                id: item.id,
                quantityReceived: item.quantityReceived,
            }));
        
        if (itemsToProcess.length === 0 && !forceComplete) {
            toast({ title: dict.noChangeTitle, description: dict.noNewQuantitiesDescription });
            return;
        }

        try {
            const { mrvId } = await receiveOrderItems(order.id, itemsToProcess, forceComplete);
            // If there's an attachment and an MRV was created, upload via server API to avoid CORS
            if (attachmentFile && mrvId) {
                setUploading(true);
                try {
                    const form = new FormData();
                    form.append('mrvId', mrvId);
                    form.append('file', attachmentFile);
                    const res = await fetch('/api/uploads/mrv', { method: 'POST', body: form });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || `Upload failed (${res.status})`);
                    } else {
                        // Server persists metadata; fallback to client write if needed
                        const data = await res.json().catch(() => null);
                        if (data && data.url && !data.wroteToFirestore) {
                            try {
                                await updateDoc(doc(db!, 'mrvs', mrvId), {
                                    attachmentUrl: data.url,
                                    attachmentPath: data.path || null,
                                    attachmentRef: data.attachmentRef || null,
                                });
                            } catch (e) {
                                // ignore; UI will still navigate
                                console.warn('Client fallback MRV update failed:', e);
                            }
                        }
                        toast({ title: 'Attachment uploaded', description: 'Linked to MRV successfully.' });
                    }
                } catch (e) {
                    console.error('Attachment upload failed', e);
                    toast({ title: 'Upload failed', description: 'Receipt saved, but attachment could not be uploaded.', variant: 'destructive' });
                } finally {
                    setUploading(false);
                }
            } else if (attachmentFile && !mrvId) {
                // No MRV created (e.g., close without receiving quantities)
                toast({ title: 'No MRV created', description: 'Order was closed without posting items; attachment was not uploaded.' });
            }
            // Navigate to MRV details if available, else back to orders
            if (mrvId) {
                router.push(`/inventory/receive/receipts/${mrvId}`);
            } else {
                router.push('/inventory/orders');
            }
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
                    <h1 className="text-2xl font-bold">{dict.receiveMrvTitle}</h1>
                    <p className="text-muted-foreground">{dict.receiveMrvDescription.replace('{id}', order.id)}</p>
                </div>
                                 <div className="flex items-center gap-2">
                                        {/* Optional attachment upload */}
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="mrv-attachment" className="whitespace-nowrap">Attachment</Label>
                                            <Input
                                                id="mrv-attachment"
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                                                className="max-w-[240px]"
                                                disabled={ordersLoading || uploading}
                                            />
                                        </div>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                                                        <Button variant="secondary" disabled={ordersLoading || uploading}>
                                                                 {ordersLoading || uploading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /></>
                                ) : (
                                    <><PackageX className="mr-2 h-4 w-4" /> Receive & Close Order</>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{dict.confirmCloseTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {dict.confirmCloseDescription}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{dict.ui.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleConfirmReceipt(true)}>
                                        {dict.confirmAndClose}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => handleConfirmReceipt(false)} disabled={ordersLoading || uploading || (!!currentUser && !(currentUser.role === 'Admin' || currentUser.role === 'Supervisor'))}>
                        {ordersLoading || uploading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {dict.processing}</>
                        ) : (
                            <><PackageCheck className="mr-2 h-4 w-4" /> {dict.confirmReceiptAndUpdateStock}</>
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
