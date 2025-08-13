'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useInventory, type MIV } from "@/context/inventory-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';

export default function MIVHistoryPage() {
    const { getMIVs, loading } = useInventory();
    const { residences, loading: residencesLoading } = useResidences();
    const { currentUser, loading: usersLoading } = useUsers();
    const [mivs, setMivs] = useState<MIV[]>([]);
    const router = useRouter();
    const isAdmin = currentUser?.role === 'Admin';

    const formatMivId = (id: string) => {
        if (!id) return id;
        if (id.startsWith('MIV-') && !id.includes('-')) return id; // already short
        const m = id.match(/^MIV-(\d{2})-(\d{2})-(\d{3})$/);
        if (m) {
            const yy = m[1];
            const mmNoPad = String(parseInt(m[2], 10));
            const seq = String(parseInt(m[3], 10));
            return `MIV-${yy}${mmNoPad}${seq}`;
        }
        return id;
    }

    useEffect(() => {
        if (!loading && !residencesLoading && !usersLoading) {
            getMIVs().then(setMivs);
        }
    }, [loading, residencesLoading, usersLoading, getMIVs]);
    
    const filteredMIVs = useMemo(() => {
        if (!currentUser) return [];
        if (isAdmin) return mivs;
        return mivs.filter(miv => currentUser.assignedResidences.includes(miv.residenceId));
    }, [mivs, currentUser, isAdmin]);
    
    const getResidenceName = (residenceId: string) => {
        return residences.find(r => r.id === residenceId)?.name || residenceId;
    }

    const renderSkeleton = () => (
        Array.from({ length: 5 }).map((_, i) => (
             <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Material Issue Vouchers (MIVs)</h1>
                    <p className="text-muted-foreground">A history of all materials issued from storerooms.</p>
                </div>
            </div>
            
            <Card>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>MIV ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Issued From (Residence)</TableHead>
                                <TableHead>Issued To (Location)</TableHead>
                                <TableHead># of Items</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading || residencesLoading ? renderSkeleton() : filteredMIVs.length > 0 ? filteredMIVs.map((miv) => (
                                <TableRow key={miv.id} className="cursor-pointer" onClick={() => router.push(`/inventory/issue-history/${miv.id}`)}>
                                    <TableCell className="font-medium">{formatMivId(miv.id)}</TableCell>
                                    <TableCell>{format(miv.date.toDate(), 'PPP p')}</TableCell>
                                    <TableCell>{getResidenceName(miv.residenceId)}</TableCell>
                                    <TableCell>{miv.locationName}</TableCell>
                                    <TableCell>{miv.itemCount}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">No MIVs found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
