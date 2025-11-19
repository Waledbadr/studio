'use client';

import React from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { PrintLayout } from '@/components/reports/print-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VacancyReportPage() {
  const { residences } = useAccommodation();

  // Calculate vacancies
  const vacancies = React.useMemo(() => {
    const list: any[] = [];
    residences.forEach(res => {
      res.buildings?.forEach(b => {
        b.floors?.forEach(f => {
          f.rooms?.forEach(r => {
            const capacity = r.capacity || 0;
            const occupied = r.occupants?.length || 0;
            if (occupied < capacity) {
              list.push({
                residence: res.name,
                building: b.name,
                floor: f.name,
                room: r.name,
                capacity,
                occupied,
                vacant: capacity - occupied
              });
            }
          });
        });
        // Handle rooms directly under residence if any (fallback structure)
        res.rooms?.forEach(r => {
            const capacity = r.capacity || 0;
            const occupied = r.occupants?.length || 0;
            if (occupied < capacity) {
              list.push({
                residence: res.name,
                building: 'N/A',
                floor: 'N/A',
                room: r.name,
                capacity,
                occupied,
                vacant: capacity - occupied
              });
            }
        });
      });
    });
    return list;
  }, [residences]);

  const totalVacant = vacancies.reduce((acc, curr) => acc + curr.vacant, 0);

  return (
    <PrintLayout 
      title="Vacancy Report" 
      description="List of all available beds across residences."
    >
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVacant}</div>
            <p className="text-sm text-muted-foreground">Total Vacant Beds</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Residence</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead className="text-right">Occupied</TableHead>
              <TableHead className="text-right font-bold">Vacant Spots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vacancies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">No vacancies found.</TableCell>
              </TableRow>
            ) : (
              vacancies.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.residence}</TableCell>
                  <TableCell>{item.building}</TableCell>
                  <TableCell>{item.floor}</TableCell>
                  <TableCell>{item.room}</TableCell>
                  <TableCell className="text-right">{item.capacity}</TableCell>
                  <TableCell className="text-right">{item.occupied}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{item.vacant}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PrintLayout>
  );
}
