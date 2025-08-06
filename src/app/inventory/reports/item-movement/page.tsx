
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
        if (itemId && !inventoryLoading && !residencesLoading) {
            setTransactionsLoading(true);
            if (residenceId) {
                // عرض حركة الصنف لسكن محدد
                getInventoryTransactions(itemId, residenceId).then(data => {
                    const sortedData = data.sort((a, b) => a.date.toMillis() - b.date.toMillis());
                    setTransactions(sortedData);
                    setTransactionsLoading(false);
                });
            } else {
                // عرض حركة الصنف على مستوى النظام كله
                Promise.all(
                    residences.map(residence => 
                        getInventoryTransactions(itemId, residence.id)
                    )
                ).then(results => {
                    const allTransactions = results.flat();
                    const sortedData = allTransactions.sort((a, b) => a.date.toMillis() - b.date.toMillis());
                    setTransactions(sortedData);
                    setTransactionsLoading(false);
                });
            }
        }
    }, [itemId, residenceId, getInventoryTransactions, inventoryLoading, residencesLoading, residences]);

    const currentStock = useMemo(() => {
        if (!item) return 0;
        if (residenceId) {
            // مخزون السكن المحدد
            return getStockForResidence(item, residenceId);
        } else {
            // إجمالي المخزون على مستوى النظام
            return item.stock;
        }
    }, [item, residenceId, getStockForResidence, items]);

    const getRelatedResidenceName = (relatedId: string | undefined) => {
        if (!relatedId) return '';
        return residences.find(r => r.id === relatedId)?.name || 'Unknown';
    }

    const getTransactionResidenceName = (transactionResidenceId: string) => {
        return residences.find(r => r.id === transactionResidenceId)?.name || 'Unknown';
    }


    const transactionsWithBalance = useMemo(() => {
        if (transactionsLoading || !item) return [];

        const isTransfer = (tx: InventoryTransaction) => tx.type === 'TRANSFER_IN' || tx.type === 'TRANSFER_OUT';

        const netMovement = transactions.reduce((acc, tx) => {
            const quantity = (tx.type === 'IN' || tx.type === 'TRANSFER_IN') ? tx.quantity : -tx.quantity;
            return acc + quantity;
        }, 0);

        const startingBalance = currentStock - netMovement;
        
        let runningBalance = startingBalance;
        return transactions.map(tx => {
            runningBalance += (tx.type === 'IN' || tx.type === 'TRANSFER_IN' ? tx.quantity : -tx.quantity);
            return { ...tx, balance: runningBalance };
        }).sort((a,b) => b.date.toMillis() - a.date.toMillis()); // Sort back to descending for display

    }, [transactions, item, currentStock, transactionsLoading]);
    
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

    if (!item || (residenceId && !residence)) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">
                    {!item ? 'Item not found.' : 'Residence not found.'}
                </p>
                 <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    const renderTransactionDetails = (tx: InventoryTransaction) => {
        switch (tx.type) {
            case 'IN':
                return `Received via MRV: ${tx.referenceDocId}`;
            case 'OUT':
                return `Issued to: ${tx.locationName || 'N/A'}`;
            case 'TRANSFER_IN':
                return `Transfer from: ${getRelatedResidenceName(tx.relatedResidenceId)}`;
            case 'TRANSFER_OUT':
                return `Transfer to: ${getRelatedResidenceName(tx.relatedResidenceId)}`;
            default:
                return tx.referenceDocId;
        }
    }
    
     const renderTransactionType = (tx: InventoryTransaction) => {
        switch (tx.type) {
            case 'IN':
                return <Badge variant='secondary'>Received</Badge>;
            case 'OUT':
                return <Badge variant='destructive'>Issued</Badge>;
            case 'TRANSFER_IN':
                return <Badge className="bg-blue-500 hover:bg-blue-500/80">Transfer In</Badge>;
            case 'TRANSFER_OUT':
                return <Badge className="bg-orange-500 hover:bg-orange-500/80">Transfer Out</Badge>;
            default:
                return <Badge>{tx.type}</Badge>;
        }
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
                        Showing history for <span className="font-semibold text-primary">{item.nameEn} / {item.nameAr}</span> 
                        {residenceId ? (
                            <span>at <span className="font-semibold text-primary">{residence?.name}</span></span>
                        ) : (
                            <span className="font-semibold text-primary">across all residences</span>
                        )}
                    </p>
                </div>
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                        {residenceId ? 'Current Stock' : 'Total System Stock'}
                    </p>
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
                                <TableHead>Details</TableHead>
                                <TableHead>Type</TableHead>
                                {!residenceId && <TableHead>Residence</TableHead>}
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
                                            <TableCell className="font-medium">{renderTransactionDetails(tx)}</TableCell>
                                            <TableCell>
                                                {renderTransactionType(tx)}
                                            </TableCell>
                                            {!residenceId && <TableCell className="font-medium">{getTransactionResidenceName(tx.residenceId)}</TableCell>}
                                            <TableCell className={`text-center font-semibold ${tx.type === 'IN' || tx.type === 'TRANSFER_IN' ? 'text-green-600' : 'text-red-600'}`}>
                                             {`${tx.type === 'IN' || tx.type === 'TRANSFER_IN' ? '+' : '-'}${tx.quantity}`}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{tx.balance}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={residenceId ? 5 : 6} className="h-48 text-center text-muted-foreground">
                                                {residenceId 
                                                    ? "No movement history found for this item in this residence." 
                                                    : "No movement history found for this item across all residences."}
                                            </TableCell>
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
