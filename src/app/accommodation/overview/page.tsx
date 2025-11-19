"use client";

import React, { useMemo } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users, Building2, FileText, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ManualSyncButton } from '@/components/accommodation/manual-sync-button';

export default function AccommodationOverviewPage() {
  const ctx = useAccommodation();
  const { workers, occupants, residences, contracts, invoices, transferRequests, companies } = ctx;
  const { currentUser } = useUsers();
  
  // Filter residences based on user role
  const filteredResidences = useMemo(() => {
    if (!currentUser) return residences;
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences]);

  // Calculate metrics
  const metrics = useMemo(() => {
    // Total workers
    const totalWorkers = workers.length;
    const assignedWorkers = occupants.length;
    const unassignedWorkers = totalWorkers - assignedWorkers;

    // Occupancy by residence
    const occupancyByResidence: Record<string, { occupied: number; capacity: number; rooms: number }> = {};
    
    for (const res of filteredResidences) {
      let totalCapacity = 0;
      let totalRooms = 0;

      const processRooms = (rooms: any[]) => {
        for (const room of rooms) {
          totalRooms++;
          if (room.spaceSqm && room.roomType) {
            const per = room.roomType === "Worker" ? 4 : room.roomType === "Supervisor" ? 8 : 16;
            totalCapacity += Math.floor(room.spaceSqm / per);
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

      const occupied = occupants.filter(occ => occ.residenceId === res.id).length;
      occupancyByResidence[res.id] = { occupied, capacity: totalCapacity, rooms: totalRooms };
    }

    // Calculate overall occupancy rate
    const totalCapacity = Object.values(occupancyByResidence).reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = Object.values(occupancyByResidence).reduce((sum, r) => sum + r.occupied, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    // Capacity warnings - rooms over 90% full
    const capacityWarnings: Array<{ residenceId: string; residenceName: string; occupied: number; capacity: number; rate: number }> = [];
    for (const [resId, data] of Object.entries(occupancyByResidence)) {
      if (data.capacity > 0) {
        const rate = (data.occupied / data.capacity) * 100;
        if (rate >= 90) {
          const residence = residences.find(r => r.id === resId);
          capacityWarnings.push({
            residenceId: resId,
            residenceName: residence?.name || resId,
            occupied: data.occupied,
            capacity: data.capacity,
            rate: Math.round(rate),
          });
        }
      }
    }

    // Nationality conflicts - rooms with multiple nationalities
    const nationalityConflicts: Array<{ residenceId: string; roomId: string; nationalities: string[] }> = [];
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
        nationalityConflicts.push({
          residenceId,
          roomId,
          nationalities: Array.from(nats),
        });
      }
    }

    // Active contracts
    const activeContracts = contracts.filter(c => c.status === 'Active').length;
    const totalContracts = contracts.length;

    // Pending transfers
    const pendingTransfers = transferRequests.filter(t => t.status === 'Pending').length;

    // Unpaid invoices
    const unpaidInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;

    return {
      totalWorkers,
      assignedWorkers,
      unassignedWorkers,
      occupancyRate,
      totalCapacity,
      totalOccupied,
      capacityWarnings,
      nationalityConflicts,
      activeContracts,
      totalContracts,
      pendingTransfers,
      unpaidInvoices,
      overdueInvoices,
      totalCompanies: companies.length,
      occupancyByResidence,
    };
  }, [workers, occupants, residences, contracts, invoices, transferRequests, companies]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accommodation Overview</h1>
          <p className="text-muted-foreground mt-2">Dashboard and key metrics for accommodation management</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 🚨 EMERGENCY MODE: Manual sync button (replaces real-time listeners) */}
          <Alert className="py-2 px-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              البيانات من ذاكرة التخزين المحلية - اضغط لتحديث من قاعدة البيانات
            </AlertDescription>
          </Alert>
          <ManualSyncButton />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalWorkers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.assignedWorkers} assigned, {metrics.unassignedWorkers} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalOccupied} / {metrics.totalCapacity} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalContracts} total contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Registered companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Capacity Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Capacity Warnings
            </CardTitle>
            <CardDescription>Residences with high occupancy (&gt;90%)</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.capacityWarnings.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No capacity issues
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.capacityWarnings.map((warning, idx) => (
                  <Alert key={idx} variant="default" className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-sm">{warning.residenceName}</AlertTitle>
                    <AlertDescription className="text-xs">
                      {warning.occupied} / {warning.capacity} occupied ({warning.rate}%)
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nationality Conflicts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Nationality Conflicts
            </CardTitle>
            <CardDescription>Rooms with mixed nationalities</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.nationalityConflicts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No nationality conflicts
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.nationalityConflicts.map((conflict, idx) => (
                  <Alert key={idx} variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm">
                      {residences.find(r => r.id === conflict.residenceId)?.name || conflict.residenceId}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      Room {conflict.roomId}: {conflict.nationalities.join(', ')}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.pendingTransfers}</div>
            <Link href="/accommodation/transfers" className="text-sm text-primary hover:underline mt-2 inline-block">
              View transfers →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unpaid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.unpaidInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overdueInvoices} overdue
            </p>
            <Link href="/accommodation/invoices" className="text-sm text-primary hover:underline mt-2 inline-block">
              View invoices →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unassigned Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.unassignedWorkers}</div>
            <Link href="/accommodation/assign" className="text-sm text-primary hover:underline mt-2 inline-block">
              Assign workers →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy by Residence */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy by Residence</CardTitle>
          <CardDescription>Current occupancy status across all residences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredResidences.map(res => {
              const data = metrics.occupancyByResidence[res.id] || { occupied: 0, capacity: 0, rooms: 0 };
              const rate = data.capacity > 0 ? Math.round((data.occupied / data.capacity) * 100) : 0;
              const statusColor = rate >= 90 ? 'bg-red-500' : rate >= 70 ? 'bg-orange-500' : 'bg-green-500';
              
              return (
                <div key={res.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{res.name}</span>
                    <span className="text-muted-foreground">
                      {data.occupied} / {data.capacity} ({rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${statusColor}`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {residences.length === 0 && (
              <p className="text-sm text-muted-foreground">No residences configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/accommodation/workers" className="p-3 border rounded-lg hover:bg-accent transition-colors text-center">
              <Users className="h-5 w-5 mx-auto mb-2" />
              <div className="text-sm font-medium">Manage Workers</div>
            </Link>
            <Link href="/accommodation/companies" className="p-3 border rounded-lg hover:bg-accent transition-colors text-center">
              <Building2 className="h-5 w-5 mx-auto mb-2" />
              <div className="text-sm font-medium">Manage Companies</div>
            </Link>
            <Link href="/accommodation/contracts" className="p-3 border rounded-lg hover:bg-accent transition-colors text-center">
              <FileText className="h-5 w-5 mx-auto mb-2" />
              <div className="text-sm font-medium">Manage Contracts</div>
            </Link>
            <Link href="/accommodation/reports" className="p-3 border rounded-lg hover:bg-accent transition-colors text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2" />
              <div className="text-sm font-medium">View Reports</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
