'use client';

import React from 'react';
import { useMaintenance } from '@/context/maintenance-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RequestsByStatusReportPage() {
  const { requests } = useMaintenance();

  const groupedRequests = React.useMemo(() => {
    const groups: Record<string, typeof requests> = {
        'Pending': [],
        'In Progress': [],
        'Completed': [],
        'Cancelled': []
    };
    
    requests.forEach(r => {
      const status = r.status || 'Pending';
      if (!groups[status]) groups[status] = [];
      groups[status].push(r);
    });
    return groups;
  }, [requests]);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
          case 'In Progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
          case 'Completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
          case 'Cancelled': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <PrintLayout 
      title="Maintenance Requests by Status" 
      description="Overview of maintenance requests grouped by their current status."
    >
      <div className="space-y-8">
        {Object.entries(groupedRequests).map(([status, items]) => (
            <div key={status} className="border rounded-md overflow-hidden break-inside-avoid">
                <div className="bg-muted/50 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">{status}</h3>
                    <Badge variant="outline" className="bg-white">{items.length} Requests</Badge>
                </div>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground h-16">No requests in this status.</TableCell>
                        </TableRow>
                    ) : (
                        items.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="whitespace-nowrap">
                                {req.date?.toDate ? req.date.toDate().toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{req.complexName || req.buildingName}</span>
                                    <span className="text-xs text-muted-foreground">{req.roomName}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{req.issueTitle}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{req.issueDescription}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={req.priority === 'High' ? 'destructive' : 'outline'}>
                                    {req.priority}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
                </Table>
            </div>
        ))}
      </div>
    </PrintLayout>
  );
}
