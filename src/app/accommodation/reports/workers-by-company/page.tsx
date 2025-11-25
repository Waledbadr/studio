'use client';

import React from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WorkersByCompanyReportPage() {
  const { workers } = useAccommodation();

  const groupedWorkers = React.useMemo(() => {
    const groups: Record<string, typeof workers> = {};
    workers.forEach(w => {
      const company = w.company || 'Unspecified';
      if (!groups[company]) groups[company] = [];
      groups[company].push(w);
    });
    return groups;
  }, [workers]);

  return (
    <PrintLayout 
      title="Workers by Company Report" 
      description="List of workers grouped by their company."
    >
      <div className="space-y-8">
        {Object.keys(groupedWorkers).length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">No workers found.</div>
        ) : (
            Object.entries(groupedWorkers).map(([company, companyWorkers]) => (
            <div key={company} className="border rounded-md overflow-hidden break-inside-avoid">
                <div className="bg-muted/50 px-4 py-3 border-b">
                    <h3 className="font-bold text-lg flex justify-between">
                        <span>{company}</span>
                        <span className="text-sm font-normal text-muted-foreground">{companyWorkers.length} Workers</span>
                    </h3>
                </div>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Role</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companyWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                        <TableCell className="font-mono text-xs">{worker.idNumber || worker.id}</TableCell>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.employeeId || '-'}</TableCell>
                        <TableCell>{worker.nationaliy || '-'}</TableCell>
                        <TableCell>{worker.role || 'Worker'}</TableCell>
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
