
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useUsers } from '@/context/users-context';

interface AggregatedItem {
    id: string;
    nameAr: string;
    nameEn: string;
    category: string;
    unit: string;
    totalQuantity: number;
}

export default function ConsolidatedReportPage() {
    const router = useRouter();
    const { orders, loading, loadOrders } = useOrders();
    const { currentUser } = useUsers();
    
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const aggregatedItems = useMemo(() => {
        if (loading || !currentUser || currentUser.role !== 'Admin') {
            return [];
        }

        const pendingOrders = orders.filter(o => o.status === 'Pending');
        const itemMap = new Map<string, AggregatedItem>();

        pendingOrders.forEach(order => {
            order.items.forEach(item => {
                const existing = itemMap.get(item.id);
                if (existing) {
                    existing.totalQuantity += item.quantity;
                } else {
                    itemMap.set(item.id, {
                        id: item.id,
                        nameAr: item.nameAr,
                        nameEn: item.nameEn,
                        category: item.category,
                        unit: item.unit,
                        totalQuantity: item.quantity
                    });
                }
            });
        });

        return Array.from(itemMap.values()).sort((a,b) => a.category.localeCompare(b.category) || a.nameEn.localeCompare(b.nameEn));
    }, [orders, loading, currentUser]);
    
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

    if (currentUser?.role !== 'Admin') {
         return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">Access Denied.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }


    return (
        <div className="space-y-6">
             <style jsx global>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .printable-area, .printable-area * {
                    visibility: visible;
                  }
                  .printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                   .no-print {
                       display: none !important;
                   }
                }
            `}</style>
            
            <div className="flex items-center justify-between no-print mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requests
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

             <Card className="printable-area">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">Consolidated Pending Requests</CardTitle>
                            <CardDescription className="text-lg">Aggregated material needs from all pending requests.</CardDescription>
                        </div>
                         <div className="text-right">
                            <p className="font-semibold">All Residences</p>
                            <p className="text-sm text-muted-foreground">Report Date: {format(new Date(), 'PPP')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Category</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Total Quantity</TableHead>
                                <TableHead className="text-center w-[100px]">Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregatedItems.length > 0 ? aggregatedItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-sm capitalize">{item.category}</TableCell>
                                    <TableCell className="font-medium">
                                        {item.nameAr} / {item.nameEn}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg">{item.totalQuantity}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{item.unit}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        No pending material requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
