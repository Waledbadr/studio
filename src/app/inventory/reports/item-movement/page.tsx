
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory, type InventoryTransaction } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function ItemMovementContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { getInventoryTransactions, items, loading: inventoryLoading, getStockForResidence } = useInventory();
    const { residences, loading: residencesLoading } = useResidences();
    
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);

    const itemId = searchParams.get('itemId');
    const residenceId = searchParams.get('residenceId');

    const item = useMemo(() => items.find(i => i.id === itemId), [items, itemId]);
    const residence = useMemo(() => residences.find(r => r.id === residenceId), [residences, residenceId]);

    useEffect(() => {
        if (itemId && residenceId && !inventoryLoading && !residencesLoading) {
            setTransactionsLoading(true);
            getInventoryTransactions(itemId, residenceId).then(data => {
                setTransactions(data);
                setTransactionsLoading(false);
            });
        }
    }, [itemId, residenceId, getInventoryTransactions, inventoryLoading, residencesLoading]);

    const currentStock = useMemo(() => {
        if (!item || !residenceId) return 0;
        return getStockForResidence(item, residenceId);
    }, [item, residenceId, getStockForResidence]);


    const transactionsWithBalance = useMemo(() => {
        if (!item || !residenceId) return [];

        const netMovement = transactions.reduce((acc, tx) => {
            return acc + (tx.type === 'IN' ? tx.quantity : -tx.quantity);
        }, 0);

        const startingBalance = currentStock - netMovement;
        
        let runningBalance = startingBalance;
        return transactions.map(tx => {
            runningBalance += (tx.type === 'IN' ? tx.quantity : -tx.quantity);
            return { ...tx, balance: runningBalance };
        });

    }, [transactions, item, residenceId, currentStock]);
    
    const pageLoading = inventoryLoading || residencesLoading;
    
    const renderSkeleton = () => (
        Array.from({ length: 5 }).map((_, i) => (
             <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
        ))
    );

    if (pageLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>{renderSkeleton()}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!item || !residence) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">Item or Residence not found.</p>
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
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
                    </Button>
                    <h1 className="text-2xl font-bold mt-2">Item Movement Report (Ledger)</h1>
                    <p className="text-muted-foreground">
                        Showing history for <span className="font-semibold text-primary">{item.nameEn} / {item.nameAr}</span> at <span className="font-semibold text-primary">{residence.name}</span>
                    </p>
                </div>
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <div className="text-3xl font-bold">
                        {inventoryLoading || transactionsLoading ? <Skeleton className="h-8 w-16" /> : currentStock}
                    </div>
                </div>
            </div>

             <Card>
                <CardContent className="pt-6">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-center">Quantity</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactionsLoading ? renderSkeleton() : (
                                <>
                                    {transactionsWithBalance.length > 0 ? transactionsWithBalance.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{format(tx.date.toDate(), 'PPP p')}</TableCell>
                                            <TableCell className="font-medium">{tx.referenceDocId}</TableCell>
                                            <TableCell>
                                                <Badge variant={tx.type === 'IN' ? 'secondary' : 'destructive'}>
                                                    {tx.type === 'IN' ? 'Received' : 'Issued'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-center font-semibold ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                             {`${tx.type === 'IN' ? '+' : '-'}${tx.quantity}`}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{tx.balance}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">No movement history found for this item in this residence.</TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ItemMovementPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <ItemMovementContent />
        </Suspense>
    )
}
