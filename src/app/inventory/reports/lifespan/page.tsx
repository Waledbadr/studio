
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory, type InventoryTransaction } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { useLanguage } from '@/context/language-context';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LifespanException {
    id: string;
    itemId: string;
    itemName: string;
    locationName: string;
    lifespanDays: number;
    previousIssueDate: Date;
    latestIssueDate: Date;
    actualDays: number;
}

export default function LifespanReportPage() {
    const { items, getAllIssueTransactions, loading: inventoryLoading } = useInventory();
    const { dict } = useLanguage();
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);

    useEffect(() => {
        if (!inventoryLoading) {
            setTransactionsLoading(true);
            getAllIssueTransactions().then(data => {
                setTransactions(data);
                setTransactionsLoading(false);
            });
        }
    }, [inventoryLoading, getAllIssueTransactions]);

    const lifespanExceptions = useMemo(() => {
        if (transactionsLoading || inventoryLoading) {
            return [];
        }

        const exceptions: LifespanException[] = [];
        
        // Group transactions by item and location
        const groupedByItemAndLocation = transactions.reduce((acc, tx) => {
            const key = `${tx.itemId}-${tx.locationId}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(tx);
            return acc;
        }, {} as Record<string, InventoryTransaction[]>);


        for (const key in groupedByItemAndLocation) {
            const group = groupedByItemAndLocation[key];
            if (group.length < 2) continue; // Need at least two transactions to compare

            const itemInfo = items.find(i => i.id === group[0].itemId);
            if (!itemInfo || !itemInfo.lifespanDays || itemInfo.lifespanDays === 0) {
                continue;
            }

            // Transactions are already sorted by date descending
            for (let i = 0; i < group.length - 1; i++) {
                const latestTx = group[i];
                const previousTx = group[i+1];

                const latestDate = latestTx.date.toDate();
                const previousDate = previousTx.date.toDate();
                const actualDays = differenceInDays(latestDate, previousDate);

                if (actualDays < itemInfo.lifespanDays) {
                    exceptions.push({
                        id: `${latestTx.id}-${previousTx.id}`,
                        itemId: itemInfo.id,
                        itemName: `${itemInfo.nameEn} / ${itemInfo.nameAr}`,
                        locationName: latestTx.locationName || dict.notAvailable,
                        lifespanDays: itemInfo.lifespanDays,
                        previousIssueDate: previousDate,
                        latestIssueDate: latestDate,
                        actualDays: actualDays
                    });
                }
            }
        }

        return exceptions.sort((a,b) => b.latestIssueDate.getTime() - a.latestIssueDate.getTime());

    }, [transactions, items, transactionsLoading, inventoryLoading, dict.notAvailable]);

    const loading = transactionsLoading || inventoryLoading;

    const exportToCSV = () => {
        const headers = [dict.itemLabel, dict.location, dict.lifespanDays, dict.previousIssue, dict.latestIssue, dict.actualDays];
        const csvContent = [
            headers.join(','),
            ...lifespanExceptions.map(ex => [
                `"${ex.itemName}"`,
                `"${ex.locationName}"`,
                ex.lifespanDays,
                format(ex.previousIssueDate, 'yyyy-MM-dd'),
                format(ex.latestIssueDate, 'yyyy-MM-dd'),
                ex.actualDays
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifespan-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const renderSkeleton = () => (
        Array.from({ length: 5 }).map((_, i) => (
             <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{dict.lifespanReportTitle}</h1>
                    <p className="text-muted-foreground">{dict.lifespanReportDescription}</p>
                </div>
                <Button variant="outline" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" /> {dict.exportCsvButton || 'Export CSV'}
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{dict.itemLabel}</TableHead>
                                <TableHead>{dict.location}</TableHead>
                                <TableHead className="text-center">{dict.lifespanDays}</TableHead>
                                <TableHead>{dict.previousIssue}</TableHead>
                                <TableHead>{dict.latestIssue}</TableHead>
                                <TableHead className="text-center">{dict.actualDays}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? renderSkeleton() : (
                                <>
                                    {lifespanExceptions.length > 0 ? lifespanExceptions.map((ex) => (
                                        <TableRow key={ex.id}>
                                            <TableCell className="font-medium">{ex.itemName}</TableCell>
                                            <TableCell>{ex.locationName}</TableCell>
                                            <TableCell className="text-center">{ex.lifespanDays}</TableCell>
                                            <TableCell>{format(ex.previousIssueDate, 'PPP')}</TableCell>
                                            <TableCell>{format(ex.latestIssueDate, 'PPP')}</TableCell>
                                            <TableCell className="text-center font-bold text-destructive">{ex.actualDays}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">{dict.noLifespanExceptionsFound}</TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <style jsx global>{`
                @media print {
                    header, nav, aside, footer { display: none !important; }
                    .print\\:hidden { display: none !important; }
                    body { background: white !important; }
                    .shadow-lg, .shadow, .border { box-shadow: none !important; border: none !important; }
                }
            `}</style>
        </div>
    );
}
