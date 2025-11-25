'use client';

import React from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function OvercrowdingReportPage() {
  const { residences } = useAccommodation();

  const overcrowdedRooms = React.useMemo(() => {
    const list: any[] = [];
    residences.forEach(res => {
      res.buildings?.forEach(b => {
        b.floors?.forEach(f => {
          f.rooms?.forEach(r => {
            const capacity = r.capacity || 0;
            const occupied = r.occupants?.length || 0;
            if (occupied > capacity) {
              list.push({
                residence: res.name,
                building: b.name,
                floor: f.name,
                room: r.name,
                capacity,
                occupied,
                excess: occupied - capacity
              });
            }
          });
        });
         // Handle rooms directly under residence
         res.rooms?.forEach(r => {
            const capacity = r.capacity || 0;
            const occupied = r.occupants?.length || 0;
            if (occupied > capacity) {
              list.push({
                residence: res.name,
                building: 'N/A',
                floor: 'N/A',
                room: r.name,
                capacity,
                occupied,
                excess: occupied - capacity
              });
            }
        });
      });
    });
    return list;
  }, [residences]);

  return (
    <PrintLayout 
      title="Overcrowding Alert Report" 
      description="Rooms where occupancy exceeds capacity."
    >
      {overcrowdedRooms.length === 0 ? (
        <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">No Overcrowding Detected</AlertTitle>
            <AlertDescription className="text-green-700">
                All rooms are operating within their capacity limits.
            </AlertDescription>
        </Alert>
      ) : (
        <>
            <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention Required</AlertTitle>
                <AlertDescription>
                    Found {overcrowdedRooms.length} rooms exceeding capacity limits.
                </AlertDescription>
            </Alert>

            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Residence</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead className="text-right">Occupants</TableHead>
                    <TableHead className="text-right font-bold text-red-600">Excess</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {overcrowdedRooms.map((item, idx) => (
                        <TableRow key={idx}>
                        <TableCell className="font-medium">{item.residence}</TableCell>
                        <TableCell>{item.building}</TableCell>
                        <TableCell>{item.floor}</TableCell>
                        <TableCell>{item.room}</TableCell>
                        <TableCell className="text-right">{item.capacity}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{item.occupied}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">+{item.excess}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </>
      )}
    </PrintLayout>
  );
}
