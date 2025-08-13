'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventory, type MIVDetails } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useResidences } from '@/context/residences-context';

export default function MIVDetailPage() {
    const { id: mivId } = useParams();
    const router = useRouter();
    const { getMIVById, loading } = useInventory();
    const { residences, loading: residencesLoading } = useResidences();
    const [miv, setMiv] = useState<MIVDetails | null>(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [triedOnce, setTriedOnce] = useState(false);

    const formatMivId = (id: string) => {
        if (!id) return id;
        if (id.startsWith('MIV-') && !id.includes('-')) return id;
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
        const fetchMiv = async () => {
            if (typeof mivId === 'string' && residences.length > 0) {
                setLocalLoading(true);
                try {
                    const fetchedMiv = await getMIVById(mivId);
                    if (!fetchedMiv && !triedOnce) {
                        // Retry once in case of transient watch close
                        setTriedOnce(true);
                        const retry = await getMIVById(mivId);
                        setMiv(retry);
                    } else {
                        setMiv(fetchedMiv);
                    }
                } finally {
                    setLocalLoading(false);
                }
            }
        };
        if (!residencesLoading) fetchMiv();
    }, [mivId, getMIVById, residences, residencesLoading, triedOnce]);
    
    const handlePrint = () => {
        window.print();
    }
    
    const residenceName = useMemo(() => {
        if (!miv || !residences) return '...';
        return residences.find(r => r.id === miv.residenceId)?.name || 'Unknown Residence';
    }, [miv, residences]);

    if (loading || residencesLoading || localLoading) {
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

    if (!miv) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">MIV not found.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    // Flatten and compute totals for printing
    const entries = Object.entries(miv.locations);
    const totalIssued = entries.reduce((sum, [, items]) => sum + items.reduce((s, it) => s + (Number(it.quantity) || 0), 0), 0);

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
                    font-size: 13px !important;
                    line-height: 1.25 !important;
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
                    font-size: 10px !important;
                    padding: 4px 6px !important;
                    background: #f2f3f5 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    color: #111 !important;
                    white-space: nowrap !important;
                  }
                  .print-compact-table tbody td {
                    font-size: 10px !important;
                    padding: 3px 6px !important;
                    border-top: 1px solid #f1f5f9 !important;
                    vertical-align: middle !important;
                  }
                  .print-compact-table .section-row td {
                    padding-top: 4px !important;
                    padding-bottom: 4px !important;
                    background: #fafafa !important;
                    color: #0f766e !important;
                    font-weight: 700 !important;
                    border-top: 1px solid #e2e8f0 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                  }

                  .print-header-title { font-size: 16px !important; margin-bottom: 2px !important; }
                  .print-subtle { font-size: 10px !important; color: #4b5563 !important; }
                  .print-total { margin-top: 6px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; font-size: 11px !important; }
                  .print-signatures { margin-top: 8px !important; padding-top: 6px !important; border-top: 1px solid #e5e7eb !important; }
                  .print-signatures .slot { width: 120px !important; margin-top: 6px !important; }
                  .print-signatures .label { font-size: 10px !important; color: #111 !important; }
                  .print-signatures .line { border-top: 1px solid #000 !important; width: 90px !important; margin-top: 6px !important; }
                }
            `}</style>

            <div className="flex items-center justify-between no-print mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to MIV History
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print MIV
                </Button>
            </div>

            <Card className="printable-area">
                <CardHeader className="border-b print:border-b-2">
                    <div className="flex justify-between items-start">
                        <div>
                            {/* Bilingual title like MR/MRV */}
                            <CardTitle className="text-3xl print-header-title">إشعار صرف مواد • Material Issue Voucher</CardTitle>
                            <CardDescription className="text-lg print-subtle">ID: {formatMivId(miv.id)}</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold print-subtle" style={{ fontWeight: 700 }}>{residenceName}</p>
                            <p className="text-sm text-muted-foreground print-subtle">Date: {format(miv.date.toDate(), 'PPP p')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table className="print-compact-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[70%]">الصنف • Item</TableHead>
                                <TableHead className="w-[30%] text-right">الكمية المصروفة • Qty Issued</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map(([locName, items]) => (
                                <React.Fragment key={locName}>
                                    <TableRow className="section-row">
                                        <TableCell colSpan={2} className="font-semibold text-primary">
                                            {locName}
                                        </TableCell>
                                    </TableRow>
                                    {items.map((it) => (
                                        <TableRow key={`${locName}-${it.itemId}`}>
                                            <TableCell className="font-medium">{it.itemNameEn} | {it.itemNameAr}</TableCell>
                                            <TableCell className="text-right font-medium">{it.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-6 text-right font-bold text-lg pr-4 border-t pt-4 print-total">
                        Total Issued: {totalIssued}
                    </div>
                </CardContent>

                <CardFooter className="mt-8 pt-4 border-t print-signatures">
                    <div className="grid grid-cols-2 gap-8 w-full">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground label">Issued By:</p>
                            <div className="mt-2 border-t-2 w-48 line slot"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground label">Received By:</p>
                            <div className="mt-2 border-t-2 w-48 line slot"></div>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
