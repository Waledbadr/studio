'use client';

import { useAccommodation } from '@/context/accommodation-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MapPin, ArrowRight, Truck } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function PendingTransfersPage() {
  const { workers, loading } = useAccommodation();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter workers with status 'Transferring'
  const pendingTransfers = workers.filter(w => w.status === 'Transferring');

  // Filter by search
  const filtered = pendingTransfers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.employeeId && w.employeeId.includes(searchQuery)) ||
    (w.transferDestination && w.transferDestination.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pending Transfers</h2>
          <p className="text-muted-foreground">Workers currently in transit between locations.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">In Transit ({pendingTransfers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mb-4 opacity-20" />
              <p>No pending transfers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="font-medium">{worker.name}</div>
                      <div className="text-xs text-muted-foreground">{worker.employeeId}</div>
                    </TableCell>
                    <TableCell>{worker.role || 'Worker'}</TableCell>
                    <TableCell>{worker.nationaliy || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {worker.transferDestination || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/accommodation/assign?search=${worker.employeeId || worker.id}`}>
                          Assign Room <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
