
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useInventory, type StockTransfer } from "@/context/inventory-context";
import { useMemo, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useUsers } from "@/context/users-context";
import { useResidences } from "@/context/residences-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/context/language-context";


export default function TransferHistoryPage() {
    const { transfers, loading, approveTransfer, rejectTransfer } = useInventory();
    const { currentUser } = useUsers();
    const { residences } = useResidences();
    const router = useRouter();
    const isAdmin = currentUser?.role === 'Admin';
    const { dict } = useLanguage();

    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<StockTransfer | null>(null);

    const userTransfers = useMemo(() => {
        if (!currentUser) return [];
        if (isAdmin) return transfers;

        return transfers.filter(t => 
            currentUser.assignedResidences.includes(t.fromResidenceId) || 
            currentUser.assignedResidences.includes(t.toResidenceId)
        );
    }, [transfers, currentUser, isAdmin]);

    const getResidenceName = (id: string) => residences.find(r => r.id === id)?.name || id;

    const formatTrsId = (id?: string | null) => {
        if (!id) return '—';
        if (id.startsWith('TRS-') && !id.includes('-')) return id; // already short
        const m = id.match(/^TRS-(\d{2})-(\d{2})-(\d{3})$/);
        if (m) {
            const yy = m[1];
            const mmNoPad = String(parseInt(m[2], 10));
            const seq = String(parseInt(m[3], 10));
            return `TRS-${yy}${mmNoPad}${seq}`;
        }
        return id; // fallback (e.g., legacy 'internal-...')
    };

    const canApproveOrReject = (transfer: StockTransfer) => {
        if (transfer.status !== 'Pending') return false;
        if (!currentUser) return false;
        // The user must be assigned to the destination residence to approve/reject
        return currentUser.assignedResidences.includes(transfer.toResidenceId);
    }

    const handleApprove = (transferId: string) => {
        if (!currentUser) return;
        approveTransfer(transferId, currentUser.id);
    }

    const handleReject = (transferId: string) => {
        if (!currentUser) return;
        rejectTransfer(transferId, currentUser.id);
    }

    const openDetails = useCallback((t: StockTransfer) => {
        setSelected(t);
        setDetailOpen(true);
    }, []);

    const renderSkeleton = () => (
        Array.from({ length: 5 }).map((_, i) => (
             <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold">Stock Transfer History</h1>
                <p className="text-muted-foreground">Review and manage all stock transfer requests.</p>
                </div>
                 <Button asChild>
                    <Link href="/inventory/transfer/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Transfer
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>{dict.referenceLabel}</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? renderSkeleton() : userTransfers.length > 0 ? userTransfers.map((transfer) => (
                                <TableRow key={transfer.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetails(transfer)}>
                                    <TableCell>{format(transfer.date.toDate(), 'PPP')}</TableCell>
                                    <TableCell>{getResidenceName(transfer.fromResidenceId)}</TableCell>
                                    <TableCell>{getResidenceName(transfer.toResidenceId)}</TableCell>
                                    <TableCell>{transfer.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                    <TableCell className="font-mono">{formatTrsId(transfer.codeShort)}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            transfer.status === 'Completed' ? 'default' 
                                            : transfer.status === 'Approved' ? 'secondary'
                                            : transfer.status === 'Rejected' ? 'destructive'
                                            : 'outline'
                                        }>
                        {transfer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {canApproveOrReject(transfer) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleApprove(transfer.id)}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleReject(transfer.id)}>
                                                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">No transfer requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Details dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{dict.movementDetailsTitle}</DialogTitle>
                    </DialogHeader>
                    {selected ? (
                        <div className="text-sm text-muted-foreground space-y-1 mb-3">
                            <div>
                                {dict.typeLabel}: <span className="font-medium text-foreground">TRANSFER</span>
                            </div>
                            <div>
                                {dict.date}: {format(selected.date.toDate(), 'PPP p')}
                            </div>
                            <div>
                                {dict.referenceLabel}: <span className="font-mono">{formatTrsId(selected.codeShort)}</span>
                            </div>
                            <div>{dict.residenceLabel}: {getResidenceName(selected.toResidenceId)}</div>
                            <div>{dict.location}: {`${dict.transferFromPrefix} ${getResidenceName(selected.fromResidenceId)}`}</div>
                        </div>
                    ) : null}

                    {selected ? (
                        <div className="overflow-x-auto mt-3">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{dict.itemLabel}</TableHead>
                                        <TableHead className="text-right">{dict.quantity}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selected.items?.map((it) => (
                                        <TableRow key={it.id}>
                                            <TableCell>{it.nameEn || it.nameAr}</TableCell>
                                            <TableCell className="text-right">{it.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">{dict.noAdditionalMovementDetails}</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
