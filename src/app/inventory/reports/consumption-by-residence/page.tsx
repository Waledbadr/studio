'use client';

import React, { useEffect, useState } from 'react';
import { useInventory, InventoryTransaction } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function ConsumptionReportPage() {
  const { getAllInventoryTransactions } = useInventory();
  const { residences } = useResidences();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, { residenceName: string, items: Record<string, { name: string, quantity: number, unit: string }> }>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const transactions = await getAllInventoryTransactions();
        const consumption = transactions.filter(t => t.type === 'ISSUE' || t.type === 'OUT');
        
        const grouped: Record<string, { residenceName: string, items: Record<string, { name: string, quantity: number, unit: string }> }> = {};

        // Helper to get residence name
        const getResidenceName = (id: string) => {
            const res = residences.find(r => r.id === id);
            return res ? res.name : 'Unknown Residence';
        };

        consumption.forEach(t => {
            const resId = t.residenceId || 'unknown';
            if (!grouped[resId]) {
                grouped[resId] = {
                    residenceName: getResidenceName(resId),
                    items: {}
                };
            }

            const itemId = t.itemId;
            if (!grouped[resId].items[itemId]) {
                grouped[resId].items[itemId] = {
                    name: t.itemNameEn || t.itemNameAr || 'Unknown Item',
                    quantity: 0,
                    unit: 'units' // Unit is not always in transaction, might need to fetch item details if critical, but for now generic
                };
            }

            grouped[resId].items[itemId].quantity += t.quantity;
        });

        setData(grouped);
      } catch (error) {
        console.error("Failed to load consumption report", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getAllInventoryTransactions, residences]);

  if (loading) {
    return (
        <PrintLayout title="Consumption by Residence">
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </PrintLayout>
    );
  }

  return (
    <PrintLayout 
      title="Consumption by Residence Report" 
      description="Total items issued/consumed per residence."
    >
      <div className="space-y-8">
        {Object.keys(data).length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">No consumption data found.</div>
        ) : (
            Object.entries(data).map(([resId, group]) => (
            <div key={resId} className="border rounded-md overflow-hidden break-inside-avoid">
                <div className="bg-muted/50 px-4 py-3 border-b">
                    <h3 className="font-bold text-lg">{group.residenceName}</h3>
                </div>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.values(group.items).sort((a, b) => b.quantity - a.quantity).map((item, idx) => (
                    <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            ))
        )}
      </div>
    </PrintLayout>
  );
}
