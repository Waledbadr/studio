'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders, type Order } from '@/context/orders-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Pencil, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useUsers } from '@/context/users-context';
import type { OrderItem } from '@/context/orders-context';
import { useInventory } from '@/context/inventory-context';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';


export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { getOrderById, updateOrderStatus, loading: ordersLoading } = useOrders();
    const { getStockForResidence, items: allItems } = useInventory();
    const { currentUser, users, loading: usersLoading, getUserById } = useUsers();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = currentUser?.role === 'Admin';
    const requestedBy = order?.requestedById ? getUserById(order.requestedById) : null;
    const approvedBy = order?.approvedById ? getUserById(order.approvedById) : null;


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

    const handleApprove = async () => {
        if (!order || !currentUser) return;
        const ok = window.confirm('Approve this request?');
        if (!ok) return;
        await updateOrderStatus(order.id, 'Approved', currentUser.id);
        setOrder({ ...order, status: 'Approved', approvedById: currentUser.id });
    };

    const handleReject = async () => {
        if (!order) return;
        const ok = window.confirm('Reject and cancel this request?');
        if (!ok) return;
        await updateOrderStatus(order.id, 'Cancelled');
        setOrder({ ...order, status: 'Cancelled' });
    };

    const goToReceive = () => {
        if (!order) return;
        router.push(`/inventory/receive/${order.id}`);
    };

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
    
     const handleGetStockForResidence = (item: OrderItem) => {
        if (!order?.residenceId) return 0;
        // Some legacy orders may store itemId instead of id
        const rawId = (item as any).id ?? (item as any).itemId;
        if (!rawId) return 0;
        const baseItemId = String(rawId).split('-')[0]; 
        const baseItem = allItems.find(i => i.id === baseItemId);
        if (!baseItem) return 0;
        return getStockForResidence(baseItem, order.residenceId);
    }

    const totalItems = order.items.length;


    const groupedItems = order.items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, Order['items']>);

    const canApproveReject = isAdmin && order.status === 'Pending';
    const canReceive = order.status === 'Approved' || order.status === 'Partially Delivered';

    return (
        <div className="space-y-6">
             <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 5mm;
                }
                @media print {
                  html, body { height: auto !important; }
                  body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    font-size: 13px !important; /* was 9px */
                    line-height: 1.25 !important; /* was 1.15 */
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background-color: white !important;
                    color: black !important;
                  }
                  .no-print { display: none !important; }

                  /* Compact table for printing */
                  .print-compact-table { border-collapse: collapse !important; width: 100% !important; }
                  .print-compact-table thead th {
                    font-weight: 700 !important;
                    font-size: 10px !important; /* was 9px */
                    padding: 4px 6px !important; /* was 3px 4px */
                    background: #f2f3f5 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    color: #111 !important;
                    white-space: nowrap !important;
                  }
                  .print-compact-table tbody td {
                    font-size: 10px !important; /* was 9px */
                    padding: 3px 6px !important; /* was 2px 4px */
                    border-top: 1px solid #f1f5f9 !important;
                    vertical-align: middle !important;
                  }
                  .print-compact-table .category-row td {
                    padding-top: 4px !important; /* was 3px */
                    padding-bottom: 4px !important; /* was 3px */
                    background: #fafafa !important;
                    color: #0f766e !important;
                    font-weight: 700 !important;
                    border-top: 1px solid #e2e8f0 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                  }

                  /* Clamp and tighten notes column */
                  .print-notes {
                    max-width: 220px !important; /* was 180px */
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    color: #374151 !important;
                  }

                  /* Tighten header area */
                  .print-header-title { font-size: 16px !important; /* was 14px */ margin-bottom: 2px !important; }
                  .print-subtle { font-size: 10px !important; /* was 9px */ color: #4b5563 !important; }
                  .print-badge { font-size: 10px !important; /* was 9px */ padding: 2px 8px !important; /* slightly larger */ }

                  /* Total row */
                  .print-total { margin-top: 6px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; font-size: 11px !important; /* was 10px */ }

                  /* Signatures compact */
                  .print-signatures { margin-top: 8px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; }
                  .print-signatures .slot { width: 120px !important; margin-top: 6px !important; }
                  .print-signatures .label { font-size: 10px !important; /* was 9px */ color: #111 !important; }
                  .print-signatures .line { border-top: 1px solid #000 !important; width: 90px !important; /* was 80px */ margin-top: 6px !important; }
                }
            `}</style>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requests
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                    {canApproveReject && (
                        <>
                            <Button onClick={handleApprove} disabled={ordersLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                            </Button>
                            <Button onClick={handleReject} variant="destructive" disabled={ordersLoading}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </>
                    )}
                    {canReceive && (
                        <Button onClick={goToReceive} variant="secondary">
                            <PackageCheck className="mr-2 h-4 w-4" /> Receive MRV
                        </Button>
                    )}
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

            <Card className="printable-area">
                <CardHeader className="border-b print:border-b-2">
                    <div className="flex justify-between items-start">
                        <div>
                            {/* Bilingual compact title for print */}
                            <CardTitle className="text-3xl print-title print-header-title">طلب مواد • Materials Request</CardTitle>
                            <CardDescription className="text-lg print-subtle">ID: #{order.id}</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold print-subtle" style={{ fontWeight: 700 }}>{order.residence}</p>
                            <p className="text-sm text-muted-foreground print-subtle">Date: {format(order.date.toDate(), 'PPP')}</p>
                            <Badge className="mt-2 print-badge" variant={
                                order.status === 'Delivered' ? 'default'
                                : order.status === 'Approved' ? 'secondary'
                                : order.status === 'Partially Delivered' ? 'secondary'
                                : order.status === 'Cancelled' ? 'destructive'
                                : 'outline'
                            }>
                                {order.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                     {order.notes && (
                        <Card className="mb-6 bg-muted/50 print-bg-muted">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">General Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{order.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                    <Table className="print-table print-compact-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[45%]">الصنف • Item</TableHead>
                                <TableHead className="w-[25%]">ملاحظات • Notes</TableHead>
                                <TableHead className="w-[10%]">وحدة • Unit</TableHead>
                                <TableHead className="w-[10%] text-right">الكمية • Qty</TableHead>
                                <TableHead className="w-[10%] text-center">المتوفر • Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <React.Fragment key={category}>
                                    <TableRow key={`cat-${category}`} className="bg-muted/50 hover:bg-muted/50 print-bg-muted category-row">
                                        <TableCell colSpan={5} className="font-semibold text-primary capitalize py-2">
                                            {category}
                                        </TableCell>
                                    </TableRow>
                                    {items.map((item: OrderItem) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.nameAr} / {item.nameEn}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground notes-cell print-notes">{item.notes || '-'}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                            <TableCell className="text-center">{handleGetStockForResidence(item)}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                    
                    <div className="mt-6 text-right font-bold text-lg pr-4 border-t pt-4 print-total">
                        Total Items: {totalItems}
                    </div>
                </CardContent>

                <CardFooter className="mt-8 pt-4 border-t print-signatures">
                    <div className="grid grid-cols-2 gap-8 w-full">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground label">Requested By:</p>
                            <p className="font-semibold print-subtle" style={{ fontWeight: 700 }}>{requestedBy?.name || '...'}</p>
                            <div className="mt-2 border-t-2 w-48 line slot"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground label">Approved By:</p>
                            <p className="font-semibold print-subtle" style={{ fontWeight: 700 }}>{approvedBy?.name || '...'}</p>
                            <div className="mt-2 border-t-2 w-48 line slot"></div>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
