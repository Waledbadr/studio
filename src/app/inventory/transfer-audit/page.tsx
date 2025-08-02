'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, writeBatch, query, where, Timestamp } from 'firebase/firestore';

interface TransferAuditResult {
    transferId: string;
    status: string;
    date: string;
    fromResidence: string;
    toResidence: string;
    items: Array<{
        id: string;
        nameEn: string;
        quantity: number;
        hasTransferOutRecord: boolean;
        hasTransferInRecord: boolean;
    }>;
}

export default function TransferAuditPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [auditResults, setAuditResults] = useState<TransferAuditResult[]>([]);
    const { toast } = useToast();

    const scanTransfers = async () => {
        if (!db) {
            toast({ title: 'Error', description: 'Firebase not configured', variant: 'destructive' });
            return;
        }

        setIsScanning(true);
        try {
            // Get all completed transfers
            const transfersRef = collection(db, 'stockTransfers');
            const transfersQuery = query(transfersRef, where('status', '==', 'Completed'));
            const transfersSnapshot = await getDocs(transfersQuery);

            const results: TransferAuditResult[] = [];

            for (const transferDoc of transfersSnapshot.docs) {
                const transferData = transferDoc.data();
                const transferId = transferDoc.id;
                
                // Check inventory transactions for this transfer
                const transactionsRef = collection(db, 'inventoryTransactions');
                const transactionsQuery = query(transactionsRef, where('referenceDocId', '==', transferId));
                const transactionsSnapshot = await getDocs(transactionsQuery);
                
                const transactions = transactionsSnapshot.docs.map(doc => doc.data());

                const auditResult: TransferAuditResult = {
                    transferId,
                    status: transferData.status,
                    date: transferData.date?.toDate?.()?.toLocaleDateString() || 'Unknown',
                    fromResidence: transferData.fromResidenceId || 'Unknown',
                    toResidence: transferData.toResidenceId || 'Unknown',
                    items: []
                };

                // Check each item in the transfer
                for (const item of transferData.items || []) {
                    const transferOutRecord = transactions.find(t => 
                        t.itemId === item.id && 
                        t.type === 'TRANSFER_OUT' && 
                        t.residenceId === transferData.fromResidenceId
                    );
                    
                    const transferInRecord = transactions.find(t => 
                        t.itemId === item.id && 
                        t.type === 'TRANSFER_IN' && 
                        t.residenceId === transferData.toResidenceId
                    );

                    auditResult.items.push({
                        id: item.id,
                        nameEn: item.nameEn,
                        quantity: item.quantity,
                        hasTransferOutRecord: !!transferOutRecord,
                        hasTransferInRecord: !!transferInRecord
                    });
                }

                results.push(auditResult);
            }

            setAuditResults(results);
            toast({ 
                title: 'Scan Complete', 
                description: `Found ${results.length} completed transfers. Review missing transaction records.` 
            });
        } catch (error) {
            console.error('Error scanning transfers:', error);
            toast({ title: 'Error', description: 'Failed to scan transfers', variant: 'destructive' });
        } finally {
            setIsScanning(false);
        }
    };

    const fixMissingTransactions = async () => {
        if (!db) {
            toast({ title: 'Error', description: 'Firebase not configured', variant: 'destructive' });
            return;
        }

        setIsFixing(true);
        try {
            const batch = writeBatch(db);
            let fixedCount = 0;

            for (const transfer of auditResults) {
                const transferRef = doc(db, 'stockTransfers', transfer.transferId);
                const transferDoc = await getDoc(transferRef);
                
                if (!transferDoc.exists()) continue;
                
                const transferData = transferDoc.data();
                const transferTime = transferData.approvedAt || transferData.date || Timestamp.now();

                for (const item of transfer.items) {
                    // Add missing TRANSFER_OUT record
                    if (!item.hasTransferOutRecord) {
                        const transferOutRef = doc(collection(db, "inventoryTransactions"));
                        batch.set(transferOutRef, {
                            itemId: item.id,
                            itemNameEn: item.nameEn,
                            itemNameAr: item.nameEn, // Fallback if Arabic name not available
                            residenceId: transfer.fromResidence,
                            date: transferTime,
                            type: 'TRANSFER_OUT',
                            quantity: item.quantity,
                            referenceDocId: transfer.transferId,
                            relatedResidenceId: transfer.toResidence,
                            locationName: `Transfer to residence (${transfer.toResidence})`
                        });
                        fixedCount++;
                    }

                    // Add missing TRANSFER_IN record
                    if (!item.hasTransferInRecord) {
                        const transferInRef = doc(collection(db, "inventoryTransactions"));
                        batch.set(transferInRef, {
                            itemId: item.id,
                            itemNameEn: item.nameEn,
                            itemNameAr: item.nameEn, // Fallback if Arabic name not available
                            residenceId: transfer.toResidence,
                            date: transferTime,
                            type: 'TRANSFER_IN',
                            quantity: item.quantity,
                            referenceDocId: transfer.transferId,
                            relatedResidenceId: transfer.fromResidence,
                            locationName: `Transfer from residence (${transfer.fromResidence})`
                        });
                        fixedCount++;
                    }
                }
            }

            if (fixedCount > 0) {
                await batch.commit();
                toast({ 
                    title: 'Fix Complete', 
                    description: `Added ${fixedCount} missing transaction records.` 
                });
                
                // Re-scan to verify fixes
                await scanTransfers();
            } else {
                toast({ 
                    title: 'No Issues Found', 
                    description: 'All transfer transactions are properly recorded.' 
                });
            }
        } catch (error) {
            console.error('Error fixing transactions:', error);
            toast({ title: 'Error', description: 'Failed to fix missing transactions', variant: 'destructive' });
        } finally {
            setIsFixing(false);
        }
    };

    const getMissingTransactionsCount = () => {
        return auditResults.reduce((total, transfer) => {
            return total + transfer.items.reduce((itemTotal, item) => {
                let missing = 0;
                if (!item.hasTransferOutRecord) missing++;
                if (!item.hasTransferInRecord) missing++;
                return itemTotal + missing;
            }, 0);
        }, 0);
    };

    const getTransferIssues = (transfer: TransferAuditResult) => {
        return transfer.items.some(item => !item.hasTransferOutRecord || !item.hasTransferInRecord);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Transfer Audit & Fix</h1>
                    <p className="text-muted-foreground">
                        Scan for missing transfer transaction records and fix data inconsistencies
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={scanTransfers} 
                        disabled={isScanning || isFixing}
                        variant="outline"
                    >
                        <RotateCcw className={`mr-2 h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? 'Scanning...' : 'Scan Transfers'}
                    </Button>
                    
                    {auditResults.length > 0 && getMissingTransactionsCount() > 0 && (
                        <Button 
                            onClick={fixMissingTransactions} 
                            disabled={isScanning || isFixing}
                            variant="default"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isFixing ? 'Fixing...' : `Fix ${getMissingTransactionsCount()} Missing Records`}
                        </Button>
                    )}
                </div>
            </div>

            {auditResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Audit Results</CardTitle>
                        <CardDescription>
                            Found {auditResults.length} completed transfers. 
                            {getMissingTransactionsCount() > 0 ? (
                                <span className="text-orange-600 font-semibold ml-1">
                                    {getMissingTransactionsCount()} missing transaction records detected.
                                </span>
                            ) : (
                                <span className="text-green-600 font-semibold ml-1">
                                    All transfers have proper transaction records.
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {auditResults.map((transfer) => (
                                <Card key={transfer.transferId} className={getTransferIssues(transfer) ? 'border-orange-200' : 'border-green-200'}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">
                                                Transfer {transfer.transferId}
                                            </CardTitle>
                                            {getTransferIssues(transfer) ? (
                                                <Badge variant="destructive">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    Missing Records
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Complete
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            {transfer.date} | From: {transfer.fromResidence} → To: {transfer.toResidence}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {transfer.items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                                    <div>
                                                        <span className="font-medium">{item.nameEn}</span>
                                                        <span className="text-sm text-muted-foreground ml-2">Qty: {item.quantity}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant={item.hasTransferOutRecord ? "secondary" : "destructive"} className="text-xs">
                                                            OUT: {item.hasTransferOutRecord ? '✓' : '✗'}
                                                        </Badge>
                                                        <Badge variant={item.hasTransferInRecord ? "secondary" : "destructive"} className="text-xs">
                                                            IN: {item.hasTransferInRecord ? '✓' : '✗'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {auditResults.length === 0 && !isScanning && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No audit data available</p>
                        <p className="text-sm text-muted-foreground">Click "Scan Transfers" to start the audit process</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
