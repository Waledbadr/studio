"use client";

import React, { useState, useMemo } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, AlertCircle, Users, Building2, FileText, Download } from 'lucide-react';
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

  const reportDateLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return new Date().toDateString();
    }
  }, []);

  const residenceRoomStats = useMemo(() => {
    const stats: Array<{
      residenceId: string;
      residenceName: string;
      city: string;
      rooms: number;
      occupiedRooms: number;
      emptyRooms: number;
      bathrooms: number;
      kitchens: number;
    }> = [];

    const roomIdsByResidence: Record<string, Set<string>> = {};
    const occupiedRoomIdsByResidence: Record<string, Set<string>> = {};

    for (const occ of occupants) {
      if (!occupiedRoomIdsByResidence[occ.residenceId]) {
        occupiedRoomIdsByResidence[occ.residenceId] = new Set();
      }
      if (occ.roomId) {
        occupiedRoomIdsByResidence[occ.residenceId].add(occ.roomId);
      }
    }

    const countFacilities = (facilities?: any[]) => {
      let bathrooms = 0;
      let kitchens = 0;
      if (!Array.isArray(facilities)) return { bathrooms, kitchens };
      for (const f of facilities) {
        const type = String(f?.type || '').toLowerCase();
        if (type === 'bathroom') bathrooms += 1;
        if (type === 'kitchen') kitchens += 1;
      }
      return { bathrooms, kitchens };
    };

    const collectRooms = (rooms?: any[]) => {
      const ids = new Set<string>();
      if (!Array.isArray(rooms)) return ids;
      for (const r of rooms) {
        if (r?.id) ids.add(String(r.id));
      }
      return ids;
    };

    for (const res of residences) {
      const resRoomIds = new Set<string>();
      const resCity = (res.city || res.address || 'غير محدد') as string;

      // Flat rooms
      collectRooms(res.rooms).forEach((id) => resRoomIds.add(id));

      // Nested rooms
      if (Array.isArray(res.buildings)) {
        for (const b of res.buildings) {
          if (Array.isArray(b?.floors)) {
            for (const f of b.floors) {
              collectRooms(f?.rooms).forEach((id) => resRoomIds.add(id));
            }
          }
        }
      }

      roomIdsByResidence[res.id] = resRoomIds;
      const occupiedSet = occupiedRoomIdsByResidence[res.id] || new Set();
      const occupiedRooms = Array.from(occupiedSet).filter((id) => resRoomIds.has(id)).length;
      const rooms = resRoomIds.size;
      const emptyRooms = Math.max(0, rooms - occupiedRooms);

      // Facilities counts (residence + building + floor)
      let bathrooms = 0;
      let kitchens = 0;
      const resFacilities = countFacilities(res.facilities);
      bathrooms += resFacilities.bathrooms;
      kitchens += resFacilities.kitchens;

      if (Array.isArray(res.buildings)) {
        for (const b of res.buildings) {
          const bFacilities = countFacilities(b?.facilities);
          bathrooms += bFacilities.bathrooms;
          kitchens += bFacilities.kitchens;
          if (Array.isArray(b?.floors)) {
            for (const f of b.floors) {
              const fFacilities = countFacilities(f?.facilities);
              bathrooms += fFacilities.bathrooms;
              kitchens += fFacilities.kitchens;
            }
          }
        }
      }

      stats.push({
        residenceId: res.id,
        residenceName: res.name,
        city: resCity,
        rooms,
        occupiedRooms,
        emptyRooms,
        bathrooms,
        kitchens,
      });
    }

    return stats.sort((a, b) => a.city.localeCompare(b.city) || a.residenceName.localeCompare(b.residenceName));
  }, [residences, occupants]);

  const citySummary = useMemo(() => {
    const byCity = new Map<string, { city: string; rooms: number; emptyRooms: number; bathrooms: number; kitchens: number }>();
    for (const row of residenceRoomStats) {
      if (!byCity.has(row.city)) {
        byCity.set(row.city, { city: row.city, rooms: 0, emptyRooms: 0, bathrooms: 0, kitchens: 0 });
      }
      const agg = byCity.get(row.city)!;
      agg.rooms += row.rooms;
      agg.emptyRooms += row.emptyRooms;
      agg.bathrooms += row.bathrooms;
      agg.kitchens += row.kitchens;
    }
    return Array.from(byCity.values()).sort((a, b) => a.city.localeCompare(b.city));
  }, [residenceRoomStats]);

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
        const nat = worker?.nationality || 'Unknown';
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

  const residenceColumns = useMemo(() => {
    return residences
      .map(r => ({ id: r.id, name: r.name, city: r.city || r.address || 'غير محدد' }))
      .sort((a, b) => String(a.city).localeCompare(String(b.city)) || a.name.localeCompare(b.name));
  }, [residences]);

  const residenceStatsById = useMemo(() => {
    const map = new Map<string, {
      rooms: number;
      emptyRooms: number;
      bathrooms: number;
      kitchens: number;
    }>();
    residenceRoomStats.forEach(r => {
      map.set(r.residenceId, {
        rooms: r.rooms,
        emptyRooms: r.emptyRooms,
        bathrooms: r.bathrooms,
        kitchens: r.kitchens,
      });
    });
    return map;
  }, [residenceRoomStats]);

  const cityGroups = useMemo(() => {
    const groups: Array<{ city: string; count: number }> = [];
    let currentCity = '';
    let count = 0;
    for (const res of residenceColumns) {
      const city = String(res.city || 'غير محدد');
      if (city !== currentCity) {
        if (count > 0) groups.push({ city: currentCity, count });
        currentCity = city;
        count = 1;
      } else {
        count += 1;
      }
    }
    if (count > 0) groups.push({ city: currentCity, count });
    return groups;
  }, [residenceColumns]);

  const occupancyByResidence = useMemo(() => {
    const map = new Map<string, { capacity: number; occupied: number; rate: number }>();
    occupancyReport.forEach(r => {
      map.set(r.residenceId, { capacity: r.capacity, occupied: r.occupied, rate: r.rate });
    });
    return map;
  }, [occupancyReport]);

  const companyMatrix = useMemo(() => {
    const companyMap = new Map<string, { name: string; total: number; byResidence: Record<string, number> }>();
    const workerMap = new Map(workers.map(w => [w.id, w]));

    for (const occ of occupants) {
      const worker = workerMap.get(occ.workerId);
      const rawName = worker?.company || 'Unknown';
      const name = String(rawName || 'Unknown').trim() || 'Unknown';
      if (!companyMap.has(name)) {
        companyMap.set(name, { name, total: 0, byResidence: {} });
      }
      const row = companyMap.get(name)!;
      row.total += 1;
      row.byResidence[occ.residenceId] = (row.byResidence[occ.residenceId] || 0) + 1;
    }

    return Array.from(companyMap.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [occupants, workers]);

  const residenceTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const occ of occupants) {
      totals[occ.residenceId] = (totals[occ.residenceId] || 0) + 1;
    }
    return totals;
  }, [occupants]);

  const overallTotals = useMemo(() => {
    let totalOccupied = 0;
    let totalCapacity = 0;
    occupancyReport.forEach(r => {
      totalOccupied += r.occupied;
      totalCapacity += r.capacity;
    });
    const rate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    return { totalOccupied, totalCapacity, rate };
  }, [occupancyReport]);

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
      if (worker?.nationality) {
        const key = `${occ.residenceId}_${occ.roomId}`;
        if (!roomNationalities[key]) roomNationalities[key] = new Set();
        roomNationalities[key].add(worker.nationality);
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
    <div className="p-6 space-y-6 reports-page-container">
      <div className="flex items-center justify-between print-hidden">
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 print-hidden">
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
        <TabsList className="print-hidden">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Warnings</TabsTrigger>
          <TabsTrigger value="violations">Nationality Violations</TabsTrigger>
          <TabsTrigger value="contracts">Contract Summary</TabsTrigger>
          <TabsTrigger value="invoices">Unpaid Invoices</TabsTrigger>
          <TabsTrigger value="transfers">Transfer History</TabsTrigger>
        </TabsList>

        {/* Daily Housing Report */}
        <TabsContent value="daily" className="space-y-4">
          <style jsx global>{`
            @media print {
              @page { 
                size: A4 landscape; 
                margin: 0;
              }
              
              /* Hide navigation and UI elements */
              .print-hidden,
              nav, aside, header, footer,
              [data-sidebar],
              button:not(.no-hide) {
                display: none !important;
              }
              
              /* Full page report */
              .daily-report-container {
                display: block !important;
                width: 297mm !important;
                height: 210mm !important;
                padding: 5mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
              
              /* Reset page styles */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                width: 297mm !important;
                height: 210mm !important;
              }
              
              /* Full Width Header */
              .report-header {
                display: flex !important;
                justify-content: space-between;
                align-items: center;
                padding: 8px 15px;
                background: linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%) !important;
                margin-bottom: 8px;
                border-radius: 4px;
              }
              .report-logo-area {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .report-logo {
                width: 36px;
                height: 36px;
                background: #fff !important;
                color: #1e3a5f !important;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 14px;
              }
              .report-title-block h1 {
                font-size: 16px;
                font-weight: 700;
                color: #fff !important;
                margin: 0;
                letter-spacing: 1.5px;
              }
              .report-title-block .subtitle-ar {
                font-size: 10px;
                color: #cbd5e1 !important;
                margin-top: 2px;
              }
              .report-meta {
                text-align: right;
              }
              .report-meta .date-label {
                font-size: 9px;
                color: #94a3b8 !important;
                text-transform: uppercase;
              }
              .report-meta .date-value {
                font-size: 13px;
                font-weight: 600;
                color: #fff !important;
              }
              
              /* Full Page Table */
              .report-table-wrapper { 
                padding: 0; 
                overflow: visible;
                flex: 1;
              }
              .report-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 8px;
                table-layout: fixed;
              }
              .report-table th {
                background: #1e3a5f !important;
                color: #fff !important;
                font-weight: 700;
                text-transform: uppercase;
                padding: 5px 3px;
                border: 0.5px solid #334155;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 7px;
              }
              .report-table th.city-header {
                background: #0f172a !important;
                font-size: 9px;
                padding: 6px 3px;
                border-bottom: 2px solid #3b82f6;
              }
              .report-table th.residence-header {
                background: #334155 !important;
                font-size: 6.5px;
                padding: 4px 2px;
                font-weight: 600;
              }
              .report-table td {
                padding: 4px 2px;
                border: 0.5px solid #cbd5e1;
                text-align: center;
                font-size: 8px;
              }
              .report-table tbody tr:nth-child(even) {
                background: #f1f5f9 !important;
              }
              .report-table td.company-name {
                text-align: left;
                font-weight: 600;
                color: #0f172a !important;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-left: 4px;
                font-size: 7.5px;
              }
              .report-table td.total-cell {
                font-weight: 800;
                background: #e2e8f0 !important;
                color: #0f172a !important;
              }
              
              /* Footer Rows */
              .report-table tfoot tr.total-row {
                background: #0f172a !important;
              }
              .report-table tfoot tr.total-row td {
                color: #fff !important;
                font-weight: 800;
                font-size: 8px;
                border-color: #0f172a;
                padding: 5px 2px;
              }
              .report-table tfoot tr.stats-row td {
                background: #f8fafc !important;
                color: #475569 !important;
                font-size: 7px;
                padding: 3px 2px;
              }
              .report-table tfoot tr.stats-row td.label-cell {
                font-weight: 700;
                color: #1e293b !important;
                text-align: left;
                padding-left: 4px;
                font-size: 7.5px;
              }
              .report-table tfoot tr.capacity-row td {
                background: #dbeafe !important;
                color: #1e40af !important;
                font-weight: 700;
              }
              .report-table tfoot tr.occupancy-row td {
                background: #d1fae5 !important;
                color: #065f46 !important;
                font-weight: 800;
                font-size: 8px;
              }
              
              /* Footer */
              .report-footer {
                margin-top: 8px;
                padding: 6px 12px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                color: #64748b !important;
              }
              .report-footer .company-info { font-weight: 600; }
            }
            
            /* Screen Styles */
            .daily-report-container {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 20px;
              background: linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%);
            }
            .report-logo-area {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .report-logo {
              width: 44px;
              height: 44px;
              background: #fff;
              color: #1e3a5f;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .report-title-block h1 {
              font-size: 20px;
              font-weight: 700;
              color: #fff;
              margin: 0;
              letter-spacing: 1px;
            }
            .report-title-block .subtitle-ar {
              font-size: 12px;
              color: #cbd5e1;
              margin-top: 2px;
            }
            .report-meta { text-align: right; }
            .report-meta .date-label {
              font-size: 10px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .report-meta .date-value {
              font-size: 14px;
              font-weight: 600;
              color: #fff;
              margin-top: 2px;
            }
            
            .report-table-wrapper {
              padding: 12px;
              overflow-x: auto;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .report-table th {
              background: #1e3a5f;
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 10px 8px;
              border: 1px solid #1e3a5f;
            }
            .report-table th.city-header {
              background: #0f172a;
              border-bottom: 2px solid #3b82f6;
            }
            .report-table th.residence-header {
              background: #334155;
              font-size: 10px;
              padding: 8px 6px;
            }
            .report-table td {
              padding: 8px 6px;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            .report-table tbody tr:nth-child(even) { background: #f8fafc; }
            .report-table tbody tr:hover { background: #f1f5f9; }
            .report-table td.company-name {
              text-align: left;
              font-weight: 500;
              color: #334155;
              white-space: nowrap;
            }
            .report-table td.total-cell {
              font-weight: 700;
              background: #f1f5f9;
              color: #1e3a5f;
            }
            .report-table tfoot tr.total-row { background: #0f172a; }
            .report-table tfoot tr.total-row td {
              color: white;
              font-weight: 700;
              border-color: #0f172a;
            }
            .report-table tfoot tr.stats-row td { background: #f8fafc; color: #475569; }
            .report-table tfoot tr.stats-row td.label-cell {
              font-weight: 600;
              color: #334155;
              text-align: left;
            }
            .report-table tfoot tr.capacity-row td {
              background: #dbeafe;
              color: #1e40af;
              font-weight: 600;
            }
            .report-table tfoot tr.occupancy-row td {
              background: #d1fae5;
              color: #065f46;
              font-weight: 700;
            }
            .report-footer {
              padding: 10px 20px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
          `}</style>
          <Card className="print:border-0 print:shadow-none print:bg-transparent">
            <CardHeader className="print-hidden">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Housing Daily Report
              </CardTitle>
              <CardDescription>Executive-level daily housing summary — optimized for single-page A4 landscape printing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 print:p-0 print:m-0">
              <div className="flex items-center justify-between print-hidden">
                <div className="text-sm text-muted-foreground">{reportDateLabel}</div>
                <Button onClick={() => window.print()} className="bg-[#0f172a] hover:bg-[#1e3a5f]">
                  <FileText className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>

              <div className="daily-report-container">
                {/* Professional Header */}
                <div className="report-header">
                  <div className="report-logo-area">
                    <div className="report-logo">EC</div>
                    <div className="report-title-block">
                      <h1>HOUSING DAILY REPORT</h1>
                      <div className="subtitle-ar">التقرير اليومي للإسكان</div>
                    </div>
                  </div>
                  <div className="report-meta">
                    <div className="date-label">Report Date</div>
                    <div className="date-value">{reportDateLabel}</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="report-table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '120px' }}>Company</th>
                        {cityGroups.map((group) => (
                          <th 
                            key={group.city} 
                            className="city-header" 
                            colSpan={group.count}
                          >
                            {group.city}
                          </th>
                        ))}
                        <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '60px' }}>Total</th>
                      </tr>
                      <tr>
                        {residenceColumns.map((res) => (
                          <th key={res.id} className="residence-header">
                            {res.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {companyMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={residenceColumns.length + 2} style={{ padding: '24px', color: '#64748b' }}>
                            No occupancy data available.
                          </td>
                        </tr>
                      ) : (
                        companyMatrix.map((row, idx) => (
                          <tr key={row.name}>
                            <td className="company-name">{row.name}</td>
                            {residenceColumns.map((res) => (
                              <td key={res.id}>
                                {row.byResidence[res.id] || 0}
                              </td>
                            ))}
                            <td className="total-cell">{row.total}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td style={{ textAlign: 'left', fontWeight: 700 }}>TOTAL OCCUPIED</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{residenceTotals[res.id] || 0}</td>
                        ))}
                        <td>{overallTotals.totalOccupied}</td>
                      </tr>
                      <tr className="stats-row">
                        <td className="label-cell">Rooms</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{residenceStatsById.get(res.id)?.rooms || 0}</td>
                        ))}
                        <td>{Array.from(residenceStatsById.values()).reduce((s, r) => s + r.rooms, 0)}</td>
                      </tr>
                      <tr className="stats-row">
                        <td className="label-cell">Empty Rooms</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{residenceStatsById.get(res.id)?.emptyRooms || 0}</td>
                        ))}
                        <td>{Array.from(residenceStatsById.values()).reduce((s, r) => s + r.emptyRooms, 0)}</td>
                      </tr>
                      <tr className="stats-row">
                        <td className="label-cell">Bathrooms</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{residenceStatsById.get(res.id)?.bathrooms || 0}</td>
                        ))}
                        <td>{Array.from(residenceStatsById.values()).reduce((s, r) => s + r.bathrooms, 0)}</td>
                      </tr>
                      <tr className="stats-row">
                        <td className="label-cell">Kitchens</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{residenceStatsById.get(res.id)?.kitchens || 0}</td>
                        ))}
                        <td>{Array.from(residenceStatsById.values()).reduce((s, r) => s + r.kitchens, 0)}</td>
                      </tr>
                      <tr className="stats-row capacity-row">
                        <td className="label-cell">Capacity</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{occupancyByResidence.get(res.id)?.capacity || 0}</td>
                        ))}
                        <td>{overallTotals.totalCapacity}</td>
                      </tr>
                      <tr className="stats-row occupancy-row">
                        <td className="label-cell">Occupancy %</td>
                        {residenceColumns.map((res) => (
                          <td key={res.id}>{occupancyByResidence.get(res.id)?.rate ?? 0}%</td>
                        ))}
                        <td>{overallTotals.rate}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Professional Footer */}
                <div className="report-footer">
                  <div className="company-info">
                    EstateCare Housing Management System
                  </div>
                  <div className="page-info">
                    Generated on {reportDateLabel} • Confidential
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

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
