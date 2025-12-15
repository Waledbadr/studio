
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
import { FileUploadArea } from '@/components/ui/file-upload-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    // Distinguish lines with same item id but different details
    uniqueKey: string; // `${id}::${notes || ''}`
}

export default function ReceiveOrderPage() {
    const { id } = useParams();
    const router = useRouter();
    const { receiveOrderItems, loading: ordersLoading } = useOrders();
    const [order, setOrder] = useState<Order | null>(null);
    const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { dict, locale } = useLanguage();
    const { currentUser } = useUsers();
    const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
    const [pendingForceComplete, setPendingForceComplete] = useState(false);

    const attachmentI18n = React.useMemo(() => locale === 'ar' ? {
        title: 'مرفقات الاستلام',
        description: 'يمكنك رفع فواتير أو مستندات قبل تأكيد الاستلام (اختياري)',
        descriptionShort: 'PDF, صور • يمكنك رفع حتى 5 ملفات',
        cancel: 'إلغاء',
        confirm: 'تأكيد الاستلام',
        confirming: 'جاري التأكيد...'
    } : {
        title: 'Receipt Attachments',
        description: 'Attach invoices or documents before confirming receipt (optional).',
        descriptionShort: 'PDF, images • you can upload up to 5 files',
        cancel: 'Cancel',
        confirm: 'Confirm Receipt',
        confirming: 'Confirming...'
    }, [locale]);

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
            // Only include:
            // - items without overrideReason (normal flow)
            // - items with overrideReason AND justificationDecision === 'approved' (use approvedQuantity)
            const filteredItems = (Array.isArray(fetchedOrder.items) ? fetchedOrder.items : []).map((item) => {
                const needsReview = !!(item as any).overrideReason;
                if (!needsReview) return item;
                if ((item as any).justificationDecision === 'approved') {
                    const q = typeof (item as any).approvedQuantity === 'number' ? (item as any).approvedQuantity : 0;
                    return { ...item, quantity: q } as any;
                }
                return null as any; // pending or rejected: not receivable yet
            }).filter(Boolean) as OrderItem[];

            const initialReceivedItems = filteredItems.map((item, idx) => {
                const alreadyReceived = fetchedOrder.itemsReceived?.find(ri => ri.id === item.id)?.quantityReceived || 0;
                const remainingToReceive = Math.max(0, (item.quantity || 0) - alreadyReceived);
                const uniqueKey = `${item.id}::${(item.notes || '').trim()}`;
                return {
                    ...item,
                    quantityReceived: remainingToReceive,
                    alreadyReceived: alreadyReceived,
                    uniqueKey,
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

    const handleQuantityChange = (uniqueKey: string, newQuantity: number) => {
        const itemInfo = receivedItems.find(item => item.uniqueKey === uniqueKey);
        if (!itemInfo) return;

        // Allow over-receipt: only enforce non-negative numbers
        const quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;

        setReceivedItems(prevItems =>
            prevItems.map(item => item.uniqueKey === uniqueKey ? { ...item, quantityReceived: quantity } : item)
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
        
        // Aggregate per item id (multiple detail lines share the same inventory id)
        const itemsToProcessMap = receivedItems
            .filter(item => item.quantityReceived > 0)
            .reduce((map, item) => {
                const prev = map.get(item.id) || 0;
                map.set(item.id, prev + item.quantityReceived);
                return map;
            }, new Map<string, number>());
        const itemsToProcess = Array.from(itemsToProcessMap.entries()).map(([id, quantityReceived]) => ({ id, quantityReceived }));
        
        if (itemsToProcess.length === 0 && !forceComplete) {
            toast({ title: dict.noChangeTitle, description: dict.noNewQuantitiesDescription });
            return;
        }

        try {
            const { mrvId } = await receiveOrderItems(order.id, itemsToProcess, forceComplete);
            // If there are attachments and an MRV was created, upload via server API
            if (attachmentFiles.length > 0 && mrvId) {
                setUploading(true);
                try {
                    const attachments: { url: string; path: string; name: string }[] = [];
                    for (const file of attachmentFiles) {
                        const form = new FormData();
                        form.append('mrvId', mrvId);
                        form.append('file', file);
                        const res = await fetch('/api/uploads/mrv', { method: 'POST', body: form });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || `Upload failed (${res.status})`);
                        }
                        const data = await res.json();
                        attachments.push({ url: data.url, path: data.path, name: file.name });
                    }
                    
                    // Update MRV with all attachments
                    if (db && attachments.length > 0) {
                        await updateDoc(doc(db, 'mrvs', mrvId), {
                            attachments,
                            attachmentUrl: attachments[0].url,
                            attachmentPath: attachments[0].path,
                        });
                    }
                    
                    toast({ title: 'تم رفع المرفقات', description: `تم رفع ${attachments.length} ملف` });
                } catch (e) {
                    console.error('Attachment upload failed', e);
                    toast({ title: 'فشل الرفع', description: 'تم حفظ الاستلام، لكن فشل رفع المرفقات.', variant: 'destructive' });
                } finally {
                    setUploading(false);
                }
            } else if (attachmentFiles.length > 0 && !mrvId) {
                // No MRV created (e.g., close without receiving quantities)
                toast({ title: 'لم يتم إنشاء MRV', description: 'تم إغلاق الطلب بدون استلام أصناف؛ لم يتم رفع المرفقات.' });
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

    const openAttachmentDialog = (forceComplete: boolean) => {
        setPendingForceComplete(forceComplete);
        setAttachmentDialogOpen(true);
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
        <>
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{dict.receiveMrvTitle}</h1>
                    <p className="text-muted-foreground">{dict.receiveMrvDescription?.replace('{id}', order.id) || `Request #${order.id}`}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
                                    <AlertDialogAction onClick={() => openAttachmentDialog(true)}>
                                        {dict.confirmAndClose}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                    </AlertDialog>
                        <Button onClick={() => openAttachmentDialog(false)} disabled={ordersLoading || uploading || (!!currentUser && !(currentUser.role === 'Admin' || currentUser.role === 'Supervisor'))}>
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
                                <TableRow key={item.uniqueKey}>
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
                                            onChange={(e) => handleQuantityChange(item.uniqueKey, Number(e.target.value))} 
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

            {/* Attachments handled via dialog */}
        </div>

        <Dialog
            open={attachmentDialogOpen}
            onOpenChange={(open) => { if (!uploading) setAttachmentDialogOpen(open); }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{attachmentI18n.title}</DialogTitle>
                    <DialogDescription>{attachmentI18n.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <FileUploadArea
                        files={attachmentFiles}
                        onFilesChange={setAttachmentFiles}
                        maxFiles={5}
                        compact
                        disabled={ordersLoading || uploading}
                        description={attachmentI18n.descriptionShort}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAttachmentDialogOpen(false)} disabled={uploading}>
                        {attachmentI18n.cancel}
                    </Button>
                    <Button
                        onClick={() => {
                            setAttachmentDialogOpen(false);
                            handleConfirmReceipt(pendingForceComplete);
                        }}
                        disabled={ordersLoading || uploading || (!!currentUser && !(currentUser.role === 'Admin' || currentUser.role === 'Supervisor'))}
                    >
                        {uploading ? attachmentI18n.confirming : attachmentI18n.confirm}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
