'use client';

import React from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function UnassignedWorkersReportPage() {
  const { workers, occupants } = useAccommodation();

  const unassignedWorkers = React.useMemo(() => {
    // Create a set of currently occupied worker IDs
    const occupiedWorkerIds = new Set(
        occupants
            .filter(occ => !occ.until) // Only active occupants
            .map(occ => occ.workerId)
    );

    return workers.filter(w => !occupiedWorkerIds.has(w.id));
  }, [workers, occupants]);

  return (
    <PrintLayout 
      title="Unassigned Workers Report" 
      description="List of workers currently not assigned to any room."
    >
      <div className="mb-6">
         <div className="text-2xl font-bold">{unassignedWorkers.length}</div>
         <p className="text-muted-foreground">Total Unassigned Workers</p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unassignedWorkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">All workers are assigned.</TableCell>
              </TableRow>
            ) : (
              unassignedWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.idNumber || '-'}</TableCell>
                  <TableCell>{worker.employeeId || '-'}</TableCell>
                  <TableCell>{worker.company || '-'}</TableCell>
                  <TableCell>{worker.nationaliy || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Unassigned</Badge>
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
