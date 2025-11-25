'use client';

import React from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function NationalityReportPage() {
  const { workers } = useAccommodation();

  const stats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    workers.forEach(w => {
      const nat = w.nationaliy || 'Unknown';
      counts[nat] = (counts[nat] || 0) + 1;
      total++;
    });

    return Object.entries(counts)
      .map(([nationality, count]) => ({
        nationality,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [workers]);

  return (
    <PrintLayout 
      title="Nationality Distribution Report" 
      description="Breakdown of workers by nationality."
    >
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nationality</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">No data available.</TableCell>
              </TableRow>
            ) : (
              stats.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.nationality}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                </TableRow>
              ))
            )}
            {stats.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{workers.length}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PrintLayout>
  );
}
