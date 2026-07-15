"use client";

import React, { useState, useMemo } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, AlertCircle, Users, Building2, FileText, Download, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const { 
    residences, 
    workers, 
    occupants, 
    contracts, 
    invoices, 
    transferRequests, 
    companies 
  } = useAccommodation();

  // Occupancy Report
  const occupancyReport = useMemo(() => {
    const report: Array<{
      residenceId: string;
      residenceName: string;
      totalRooms: number;
      capacity: number;
      occupied: number;
      rate: number;
      byNationality: Record<string, number>;
    }> = [];

    for (const res of residences) {
      let totalRooms = 0;
      let totalCapacity = 0;

      const processRooms = (rooms: any[]) => {
        if (!Array.isArray(rooms)) return;
        for (const room of rooms) {
          totalRooms++;
          if (room.spaceSqm && room.roomType) {
            const space = Number(room.spaceSqm);
            const per = room.roomType === "Worker" ? 4 : room.roomType === "Supervisor" ? 8 : 16;
            totalCapacity += Math.floor(space / per);
          } else if (room.capacity) {
            totalCapacity += Number(room.capacity);
          }
        }
      };

      if (res.rooms) processRooms(res.rooms);
      if (res.buildings) {
        for (const building of res.buildings) {
          if (building.floors) {
            for (const floor of building.floors) {
              if (floor.rooms) processRooms(floor.rooms);
            }
          }
        }
      }

      const residenceOccupants = occupants.filter(occ => occ.residenceId === res.id);
      const occupied = residenceOccupants.length;
      const rate = totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;

      const byNationality: Record<string, number> = {};
      for (const occ of residenceOccupants) {
        const worker = workers.find(w => w.id === occ.workerId);
        const nat = worker?.nationaliy || 'Unknown';
        byNationality[nat] = (byNationality[nat] || 0) + 1;
      }

      report.push({
        residenceId: res.id,
        residenceName: res.name,
        totalRooms,
        capacity: totalCapacity,
        occupied,
        rate,
        byNationality,
      });
    }

    return report;
  }, [residences, workers, occupants]);

  // Capacity Warnings
  const capacityWarnings = useMemo(() => {
    return occupancyReport.filter(r => r.rate >= 90);
  }, [occupancyReport]);

  // Nationality Violations
  const nationalityViolations = useMemo(() => {
    const violations: Array<{ residenceId: string; residenceName: string; roomId: string; nationalities: string[] }> = [];
    const roomNationalities: Record<string, Set<string>> = {};
    
    for (const occ of occupants) {
      const worker = workers.find(w => w.id === occ.workerId);
      if (worker?.nationaliy) {
        const key = `${occ.residenceId}_${occ.roomId}`;
        if (!roomNationalities[key]) roomNationalities[key] = new Set();
        roomNationalities[key].add(worker.nationaliy);
      }
    }

    for (const [key, nats] of Object.entries(roomNationalities)) {
      if (nats.size > 1) {
        const [residenceId, roomId] = key.split('_');
        const residence = residences.find(r => r.id === residenceId);
        violations.push({
          residenceId,
          residenceName: residence?.name || residenceId,
          roomId,
          nationalities: Array.from(nats),
        });
      }
    }

    return violations;
  }, [occupants, workers, residences]);

  // Contract Summary
  const contractSummary = useMemo(() => {
    return contracts.map(contract => {
      const company = companies.find(c => c.id === contract.companyId);
      const residence = residences.find(r => r.id === contract.residenceId);
      const actualWorkers = occupants.filter(occ => occ.residenceId === contract.residenceId).length;
      const contractInvoices = invoices.filter(inv => inv.contractId === contract.id);
      const paidInvoices = contractInvoices.filter(inv => inv.status === 'Paid').length;
      const pendingInvoices = contractInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').length;
      const totalRevenue = contractInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidRevenue = contractInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        contract,
        companyName: company?.name || contract.companyId,
        residenceName: residence?.name || contract.residenceId,
        actualWorkers,
        expectedWorkers: contract.expectedWorkers || 0,
        totalInvoices: contractInvoices.length,
        paidInvoices,
        pendingInvoices,
        totalRevenue,
        paidRevenue,
      };
    });
  }, [contracts, companies, residences, occupants, invoices]);

  // Unpaid Invoices
  const unpaidInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
      .map(inv => {
        const company = companies.find(c => c.id === inv.companyId);
        const residence = residences.find(r => r.id === inv.residenceId);
        return { invoice: inv, companyName: company?.name || inv.companyId, residenceName: residence?.name || inv.residenceId };
      })
      .sort((a, b) => new Date(a.invoice.generatedAt).getTime() - new Date(b.invoice.generatedAt).getTime());
  }, [invoices, companies, residences]);

  // Transfer History
  const transferHistory = useMemo(() => {
    return transferRequests
      .map(tr => {
  const fromResidence = tr.from?.residenceId ? residences.find(r => r.id === tr.from?.residenceId) : null;
        const toResidence = residences.find(r => r.id === tr.to.residenceId);
        return {
          transfer: tr,
          fromResidenceName: fromResidence?.name || tr.from?.residenceId || 'N/A',
          toResidenceName: toResidence?.name || tr.to.residenceId,
          workerCount: tr.workerIds.length,
        };
      })
      .sort((a, b) => new Date(b.transfer.requestedAt).getTime() - new Date(a.transfer.requestedAt).getTime());
  }, [transferRequests, residences]);

  const handleExport = (reportType: string) => {
    // TODO: Implement CSV/PDF export
    alert(`Export ${reportType} - Feature coming soon!`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-2">Comprehensive accommodation analytics and insights</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Printable Reports Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link href="/accommodation/reports/daily-housing">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                Daily Housing Report
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/accommodation/reports/vacancy">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Vacancy Report
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/accommodation/reports/nationality-distribution">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Nationality Dist.
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/accommodation/reports/overcrowding">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Overcrowding
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/accommodation/reports/workers-by-company">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-600" />
                Workers by Company
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/accommodation/reports/unassigned-workers">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                Unassigned Workers
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="occupancy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Warnings</TabsTrigger>
          <TabsTrigger value="violations">Nationality Violations</TabsTrigger>
          <TabsTrigger value="contracts">Contract Summary</TabsTrigger>
          <TabsTrigger value="invoices">Unpaid Invoices</TabsTrigger>
          <TabsTrigger value="transfers">Transfer History</TabsTrigger>
        </TabsList>

        {/* Occupancy Report */}
        <TabsContent value="occupancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Occupancy by Residence
              </CardTitle>
              <CardDescription>Current occupancy status and nationality distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Residence</TableHead>
                    <TableHead className="text-center">Rooms</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Occupied</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                    <TableHead>Nationality Breakdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occupancyReport.map((item) => (
                    <TableRow key={item.residenceId}>
                      <TableCell className="font-medium">{item.residenceName}</TableCell>
                      <TableCell className="text-center">{item.totalRooms}</TableCell>
                      <TableCell className="text-center">{item.capacity}</TableCell>
                      <TableCell className="text-center">{item.occupied}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.rate >= 90 ? 'destructive' : item.rate >= 70 ? 'default' : 'secondary'}>
                          {item.rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(item.byNationality).map(([nat, count]) => (
                            <Badge key={nat} variant="outline" className="text-xs">
                              {nat}: {count}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capacity Warnings */}
        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                High Occupancy Warnings
              </CardTitle>
              <CardDescription>Residences with occupancy ≥ 90%</CardDescription>
            </CardHeader>
            <CardContent>
              {capacityWarnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No capacity warnings. All residences are within safe occupancy levels.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {capacityWarnings.map((item) => (
                    <Alert key={item.residenceId} variant="default" className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertTitle>{item.residenceName}</AlertTitle>
                      <AlertDescription>
                        <div className="flex items-center justify-between mt-2">
                          <span>{item.occupied} / {item.capacity} occupied</span>
                          <Badge variant="destructive">{item.rate}%</Badge>
                        </div>
                        <div className="text-xs mt-2">
                          Recommendation: Consider restricting new assignments or expanding capacity
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nationality Violations */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Nationality Policy Violations
              </CardTitle>
              <CardDescription>Rooms with mixed nationalities (violates same-nationality rule)</CardDescription>
            </CardHeader>
            <CardContent>
              {nationalityViolations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No violations found. All rooms comply with the same-nationality policy.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nationalityViolations.map((item, idx) => (
                    <Alert key={idx} variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{item.residenceName} - Room {item.roomId}</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2">
                          Mixed nationalities detected: {item.nationalities.join(', ')}
                        </div>
                        <div className="text-xs mt-2">
                          Action Required: Transfer workers to separate rooms by nationality
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Summary */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Performance Summary
              </CardTitle>
              <CardDescription>Revenue and occupancy metrics by contract</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Residence</TableHead>
                    <TableHead className="text-center">Workers</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractSummary.map((item) => (
                    <TableRow key={item.contract.id}>
                      <TableCell className="font-medium">{item.companyName}</TableCell>
                      <TableCell>{item.residenceName}</TableCell>
                      <TableCell className="text-center">
                        {item.actualWorkers}
                        {item.expectedWorkers > 0 && (
                          <span className="text-muted-foreground"> / {item.expectedWorkers}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.totalInvoices}
                        {item.pendingInvoices > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {item.pendingInvoices} pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.totalRevenue.toFixed(2)} SAR
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.paidRevenue.toFixed(2)} SAR
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.contract.status === 'Active' ? 'default' : 'secondary'}>
                          {item.contract.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unpaid Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Unpaid Invoices
              </CardTitle>
              <CardDescription>Pending and overdue payments</CardDescription>
            </CardHeader>
            <CardContent>
              {unpaidInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All invoices are paid. Great job!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Residence</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidInvoices.map((item) => (
                      <TableRow key={item.invoice.id}>
                        <TableCell className="font-mono text-sm">{item.invoice.id}</TableCell>
                        <TableCell className="font-medium">{item.companyName}</TableCell>
                        <TableCell>{item.residenceName}</TableCell>
                        <TableCell>{item.invoice.month}</TableCell>
                        <TableCell className="text-right font-bold">
                          {item.invoice.totalAmount.toFixed(2)} SAR
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.invoice.status === 'Overdue' ? 'destructive' : 'default'}>
                            {item.invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {unpaidInvoices.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="font-semibold">Total Outstanding</div>
                  <div className="text-2xl font-bold text-destructive">
                    {unpaidInvoices.reduce((sum, item) => sum + item.invoice.totalAmount, 0).toFixed(2)} SAR
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer History */}
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Worker Transfer History
              </CardTitle>
              <CardDescription>All transfer requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {transferHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transfer history available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer ID</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-center">Workers</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferHistory.map((item) => (
                      <TableRow key={item.transfer.id}>
                        <TableCell className="font-mono text-sm">{item.transfer.id}</TableCell>
                        <TableCell>{item.fromResidenceName}</TableCell>
                        <TableCell>{item.toResidenceName}</TableCell>
                        <TableCell className="text-center">{item.workerCount}</TableCell>
                        <TableCell>{new Date(item.transfer.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              item.transfer.status === 'Approved' ? 'secondary' :
                              item.transfer.status === 'Rejected' ? 'destructive' :
                              item.transfer.status === 'Cancelled' ? 'outline' :
                              'default'
                            }
                          >
                            {item.transfer.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
