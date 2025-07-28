
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventory, type MIVDetails } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useResidences } from '@/context/residences-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MIVDetailPage() {
    const { id: mivId } = useParams();
    const router = useRouter();
    const { getMIVById, loading } = useInventory();
    const { residences, loading: residencesLoading } = useResidences();
    const [miv, setMiv] = useState<MIVDetails | null>(null);

    useEffect(() => {
        const fetchMiv = async () => {
            if (typeof mivId === 'string' && residences.length > 0) {
                const fetchedMiv = await getMIVById(mivId);
                setMiv(fetchedMiv);
            }
        };
        fetchMiv();
    }, [mivId, getMIVById, residences]);
    
    const handlePrint = () => {
        window.print();
    }
    
    const residenceName = useMemo(() => {
        if (!miv || !residences) return '...';
        return residences.find(r => r.id === miv.residenceId)?.name || 'Unknown Residence';
    }, [miv, residences]);

    if (loading || residencesLoading) {
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
                    height: auto;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 1rem !important;
                    margin: 0 !important;
                  }
                   .no-print {
                       display: none !important;
                   }
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
                <CardHeader className="border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">Material Issue Voucher</CardTitle>
                            <CardDescription className="text-lg">ID: {miv.id}</CardDescription>
                        </div>
                         <div className="text-right">
                            <p className="font-semibold">{residenceName}</p>
                            <p className="text-sm text-muted-foreground">Date: {format(miv.date.toDate(), 'PPP p')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Accordion type="multiple" defaultValue={Object.keys(miv.locations)}>
                        {Object.entries(miv.locations).map(([locationName, items]) => (
                            <AccordionItem key={locationName} value={locationName}>
                                <AccordionTrigger className="font-semibold text-lg">
                                    {locationName}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="w-[150px] text-right">Quantity Issued</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map(item => (
                                                <TableRow key={item.itemId}>
                                                    <TableCell className="font-medium">
                                                        <p>{item.itemNameAr} / {item.itemNameEn}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    )
}
