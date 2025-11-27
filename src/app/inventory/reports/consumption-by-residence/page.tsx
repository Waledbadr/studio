'use client';


import React, { useEffect, useState } from 'react';
import { useInventory, InventoryTransaction } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';


export default function ConsumptionReportPage() {
  const { getAllInventoryTransactions } = useInventory();
  const { residences } = useResidences();
  const { dict } = useLanguage();
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
            return res ? (res.nameEn || res.nameAr || res.name || dict.unknownResidence) : dict.unknownResidence;
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
                    name: t.itemNameEn || t.itemNameAr || dict.unknownItem,
                    quantity: 0,
                    unit: 'units'
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
  }, [getAllInventoryTransactions, residences, dict.unknownResidence, dict.unknownItem]);


  const exportToCSV = () => {
    const rows: string[] = [];
    rows.push([dict.consumptionByResidence, dict.itemName, dict.totalQuantity].join(','));
    Object.values(data).forEach(group => {
      Object.values(group.items).forEach(item => {
        rows.push([`"${group.residenceName}"`, `"${item.name}"`, item.quantity].join(','));
      });
    });
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consumption-by-residence-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PrintLayout title={dict.consumptionByResidence}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PrintLayout>
    );
  }

  return (
    <PrintLayout 
      title={dict.consumptionByResidenceReport}
      description={dict.totalItemsIssuedPerResidence || 'Total items issued/consumed per residence.'}
    >
      <div className="flex justify-end mb-4 print:hidden">
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> {dict.exportCsvButton || 'Export CSV'}
        </Button>
      </div>
      <div className="space-y-8">
        {Object.keys(data).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">{dict.noConsumptionDataFound}</div>
        ) : (
          Object.entries(data).map(([resId, group]) => (
            <div key={resId} className="border rounded-md overflow-hidden break-inside-avoid">
              <div className="bg-muted/50 px-4 py-3 border-b">
                <h3 className="font-bold text-lg">{group.residenceName}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.itemName}</TableHead>
                    <TableHead className="text-right">{dict.totalQuantity}</TableHead>
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
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .shadow-lg, .shadow, .border { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </PrintLayout>
  );
}
