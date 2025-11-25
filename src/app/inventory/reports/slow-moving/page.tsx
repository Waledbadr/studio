'use client';

import React, { useEffect, useState } from 'react';
import { useInventory, InventoryItem } from '@/context/inventory-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Timestamp } from 'firebase/firestore';

interface SlowMovingItem {
    item: InventoryItem;
    lastIssueDate: Date | null;
    daysSinceLastIssue: number;
}

export default function SlowMovingReportPage() {
  const { items, getAllInventoryTransactions } = useInventory();
  const [loading, setLoading] = useState(true);
  const [slowItems, setSlowItems] = useState<SlowMovingItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const transactions = await getAllInventoryTransactions();
        const issueTransactions = transactions.filter(t => t.type === 'ISSUE' || t.type === 'OUT');
        
        const lastIssueMap: Record<string, Date> = {};

        issueTransactions.forEach(t => {
            const date = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date as any);
            if (!lastIssueMap[t.itemId] || date > lastIssueMap[t.itemId]) {
                lastIssueMap[t.itemId] = date;
            }
        });

        const now = new Date();
        const thresholdDays = 90; // Define "slow moving" as 90 days
        const result: SlowMovingItem[] = [];

        items.forEach(item => {
            // Skip items with 0 stock as they aren't "moving" anyway but aren't holding value
            if (item.stock <= 0) return;

            const lastDate = lastIssueMap[item.id] || null;
            let days = -1;

            if (lastDate) {
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
                days = 9999; // Never issued
            }

            if (days > thresholdDays) {
                result.push({
                    item,
                    lastIssueDate: lastDate,
                    daysSinceLastIssue: days
                });
            }
        });

        setSlowItems(result.sort((a, b) => b.daysSinceLastIssue - a.daysSinceLastIssue));

      } catch (error) {
        console.error("Failed to load slow moving report", error);
      } finally {
        setLoading(false);
      }
    };

    if (items.length > 0) {
        loadData();
    } else {
        setLoading(false);
    }
  }, [items, getAllInventoryTransactions]);

  if (loading) {
    return (
        <PrintLayout title="Slow Moving Items Report">
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </PrintLayout>
    );
  }

  return (
    <PrintLayout 
      title="Slow Moving Items Report" 
      description="Items with stock that haven't been issued in the last 90 days."
    >
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Last Issue Date</TableHead>
              <TableHead className="text-right">Days Since Issue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slowItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No slow moving items found.</TableCell>
              </TableRow>
            ) : (
              slowItems.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{entry.item.nameEn}</span>
                        <span className="text-xs text-muted-foreground">{entry.item.nameAr}</span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.item.category}</TableCell>
                  <TableCell className="text-right">{entry.item.stock}</TableCell>
                  <TableCell className="text-right">
                    {entry.lastIssueDate ? entry.lastIssueDate.toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-600">
                    {entry.daysSinceLastIssue === 9999 ? 'Never' : `${entry.daysSinceLastIssue} days`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PrintLayout>
  );
}
