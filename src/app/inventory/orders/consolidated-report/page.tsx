
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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

interface GroupedAggregatedItems {
    [category: string]: AggregatedItem[];
}

export default function ConsolidatedReportPage() {
    const router = useRouter();
    const { orders, loading, loadOrders } = useOrders();
    const { currentUser } = useUsers();
    
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const { groupedItems, residenceNames } = useMemo(() => {
        if (loading || !currentUser || currentUser.role !== 'Admin') {
            return { groupedItems: {}, residenceNames: [] };
        }

        const pendingOrders = orders.filter(o => o.status === 'Pending');
        const itemMap = new Map<string, AggregatedItem>();
        const uniqueResidenceNames = new Set<string>();

        pendingOrders.forEach(order => {
            uniqueResidenceNames.add(order.residence);
            order.items.forEach(item => {
                const existing = itemMap.get(item.id);
                if (existing) {
                    existing.totalQuantity += item.quantity;
                } else {
                    itemMap.set(item.id, {
                        id: item.id,
                        nameAr: item.nameAr,
                        nameEn: item.nameEn,
                        category: item.category || 'Uncategorized',
                        unit: item.unit,
                        totalQuantity: item.quantity
                    });
                }
            });
        });

        const sortedItems = Array.from(itemMap.values()).sort((a,b) => a.nameEn.localeCompare(b.nameEn));
        
        const grouped = sortedItems.reduce((acc, item) => {
            const category = item.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as GroupedAggregatedItems);
        
        return { groupedItems: grouped, residenceNames: Array.from(uniqueResidenceNames) };
        
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
                @page {
                    size: A4;
                    margin: 10mm;
                }
                @media print {
                  body {
                    -webkit-print-color-adjust: exact;
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
                   .no-print {
                       display: none !important;
                   }
                   .print-title {
                       font-size: 2rem !important;
                   }
                   .print-table th, .print-table td {
                        padding-top: 0.25rem !important;
                        padding-bottom: 0.25rem !important;
                        padding-left: 0.5rem !important;
                        padding-right: 0.5rem !important;
                        border-color: #e5e7eb !important;
                        color: black !important;
                   }
                   .print-table {
                       border-top: 1px solid #e5e7eb !important;
                       border-bottom: 1px solid #e5e7eb !important;
                   }
                   .print-bg-muted {
                       background-color: #f3f4f6 !important;
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
                <CardHeader className="border-b print:border-b-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl print-title">Consolidated Pending Requests</CardTitle>
                            <CardDescription className="text-lg">Aggregated material needs from all pending requests.</CardDescription>
                        </div>
                         <div className="text-right">
                            <p className="font-semibold">{residenceNames.join(', ') || 'All Residences'}</p>
                            <p className="text-sm text-muted-foreground">Report Date: {format(new Date(), 'PPP')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table className="print-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Item</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                                <TableHead className="text-right">Total Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.keys(groupedItems).length > 0 ? Object.entries(groupedItems).map(([category, items]) => (
                                <React.Fragment key={category}>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 print-bg-muted">
                                        <TableCell colSpan={3} className="font-semibold text-primary capitalize py-2">
                                            {category}
                                        </TableCell>
                                    </TableRow>
                                    {items.map(item => (
                                         <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.nameAr} / {item.nameEn}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">{item.unit}</TableCell>
                                            <TableCell className="text-right font-bold text-lg">{item.totalQuantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
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
                <CardFooter className="mt-8 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-8 w-full">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Requested By:</p>
                            <div className="mt-4 border-t-2 w-48"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Approved By:</p>
                            <div className="mt-4 border-t-2 w-48"></div>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
