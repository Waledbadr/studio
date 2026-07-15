"use client";

import React, { useMemo, useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useResidences } from '@/context/residences-context';
import './daily-housing-styles.css';
import { format } from 'date-fns';
import {
  Bed,
  Users,
  Building2,
  DoorOpen,
  PieChart as PieChartIcon,
  Printer,
  ArrowLeft,
  UtensilsCrossed,
  Bath,
  ShieldCheck,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const REGION_COLORS = ['#0f3d6e', '#16a34a', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];
const COMPANY_COLORS = ['#0f3d6e', '#16a34a', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#94a3b8'];

function occupancyColor(pct: number) {
  if (pct <= 0) return '#94a3b8';
  if (pct >= 80) return '#16a34a';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function occupancyBadgeClass(pct: number) {
  if (pct <= 0) return 'badge-occ-zero';
  if (pct >= 80) return 'badge-occ-high';
  if (pct >= 60) return 'badge-occ-mid';
  return 'badge-occ-low';
}

function calcCapacityFromRooms(rooms: any[]) {
  let capacity = 0;
  let totalRooms = 0;
  for (const room of rooms || []) {
    totalRooms++;
    if (room.spaceSqm && room.roomType) {
      const per = room.roomType === 'Worker' ? 4 : room.roomType === 'Supervisor' ? 8 : 16;
      capacity += Math.floor(Number(room.spaceSqm) / per);
    } else if (room.capacity) {
      capacity += Number(room.capacity);
    }
  }
  return { capacity, totalRooms };
}

function countFacilities(facilities: any[] | undefined, type: string) {
  if (!Array.isArray(facilities)) return 0;
  return facilities.filter(f => (f?.type || '').toLowerCase().trim() === type).length;
}

const ROLE_LABELS: Record<string, string> = {
  Worker: 'عامل',
  Supervisor: 'مشرف',
  Engineer: 'مهندس',
};

const ROLE_ICONS: Record<string, React.ComponentType<any>> = {
  Worker: Sparkles,
  Supervisor: ShieldCheck,
  Engineer: Wrench,
};

export default function DailyHousingReportPage() {
  const router = useRouter();
  const { residences, workers, occupants, loading } = useAccommodation();
  const { residences: complexes } = useResidences();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const data = useMemo(() => {
    if (!residences.length) return null;

    const dayStr = format(selectedDate, 'yyyy-MM-dd');

    const activeOccupants = occupants.filter(occ => {
      const since = occ.since.slice(0, 10);
      const until = occ.until ? occ.until.slice(0, 10) : null;
      return since <= dayStr && (!until || until >= dayStr);
    });

    const workerById = new Map(workers.map(w => [w.id, w]));
    const complexById = new Map(complexes.map(c => [c.id, c]));

    // Per-residence stats: capacity, rooms, kitchens/bathrooms, occupancy
    const resStats: Record<string, any> = {};
    for (const res of residences) {
      let capacity = 0;
      let totalRooms = 0;

      const roomSets: any[][] = [];
      if (res.rooms) roomSets.push(res.rooms);
      if (res.buildings) {
        for (const b of res.buildings) {
          for (const f of b.floors || []) {
            roomSets.push(f.rooms || []);
          }
        }
      }
      for (const rs of roomSets) {
        const r = calcCapacityFromRooms(rs);
        capacity += r.capacity;
        totalRooms += r.totalRooms;
      }

      // Kitchens / bathrooms come from the matching Complex facilities (complex + building + floor level)
      const complex = complexById.get(res.id);
      let kitchens = 0;
      let bathrooms = 0;
      if (complex) {
        kitchens += countFacilities(complex.facilities, 'kitchen');
        bathrooms += countFacilities(complex.facilities, 'bathroom');
        for (const b of complex.buildings || []) {
          kitchens += countFacilities(b.facilities, 'kitchen');
          bathrooms += countFacilities(b.facilities, 'bathroom');
          for (const f of b.floors || []) {
            kitchens += countFacilities(f.facilities, 'kitchen');
            bathrooms += countFacilities(f.facilities, 'bathroom');
          }
        }
      }

      const occupied = activeOccupants.filter(o => o.residenceId === res.id).length;
      const vacantBeds = Math.max(capacity - occupied, 0);
      const rate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

      resStats[res.id] = {
        residence: res,
        capacity,
        totalRooms,
        vacantRooms: totalRooms, // recalculated below once we know occupied rooms
        occupied,
        vacantBeds,
        rate,
        kitchens,
        bathrooms,
      };
    }

    // Vacant rooms = rooms with zero active occupants
    for (const res of residences) {
      const roomIds: string[] = [];
      const collect = (rooms: any[]) => (rooms || []).forEach(r => roomIds.push(r.id));
      if (res.rooms) collect(res.rooms);
      if (res.buildings) {
        for (const b of res.buildings) {
          for (const f of b.floors || []) collect(f.rooms || []);
        }
      }
      const occupiedRoomIds = new Set(
        activeOccupants.filter(o => o.residenceId === res.id).map(o => o.roomId)
      );
      resStats[res.id].vacantRooms = roomIds.filter(id => !occupiedRoomIds.has(id)).length;
    }

    // Region (city) grouping
    const regionGroups: Record<string, string[]> = {};
    for (const res of residences) {
      const city = res.city || 'أخرى';
      if (!regionGroups[city]) regionGroups[city] = [];
      regionGroups[city].push(res.id);
    }
    const regionStats = Object.entries(regionGroups).map(([city, resIds]) => {
      const capacity = resIds.reduce((a, id) => a + resStats[id].capacity, 0);
      const occupied = resIds.reduce((a, id) => a + resStats[id].occupied, 0);
      const rate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
      return { city, capacity, occupied, rate };
    }).sort((a, b) => b.occupied - a.occupied);

    // Company breakdown (active occupants -> worker.company)
    const companyCounts: Record<string, number> = {};
    for (const occ of activeOccupants) {
      const worker = workerById.get(occ.workerId);
      const company = worker?.company || 'غير محدد';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    }
    const companyStats = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count);

    // Company x Location matrix
    const companyNames = companyStats.map(c => c.company);
    const matrix: Record<string, Record<string, number>> = {};
    companyNames.forEach(c => { matrix[c] = {}; });
    for (const occ of activeOccupants) {
      const worker = workerById.get(occ.workerId);
      const company = worker?.company || 'غير محدد';
      matrix[company][occ.residenceId] = (matrix[company][occ.residenceId] || 0) + 1;
    }

    // Workforce & services (by role, active occupants only)
    const roleCounts: Record<string, number> = { Worker: 0, Supervisor: 0, Engineer: 0 };
    for (const occ of activeOccupants) {
      const worker = workerById.get(occ.workerId);
      const role = worker?.role || 'Worker';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }

    // Totals
    const totalCapacity = Object.values(resStats).reduce((a: number, r: any) => a + r.capacity, 0);
    const totalOccupied = activeOccupants.length;
    const totalVacantBeds = Math.max(totalCapacity - totalOccupied, 0);
    const totalRooms = Object.values(resStats).reduce((a: number, r: any) => a + r.totalRooms, 0);
    const totalVacantRooms = Object.values(resStats).reduce((a: number, r: any) => a + r.vacantRooms, 0);
    const totalKitchens = Object.values(resStats).reduce((a: number, r: any) => a + r.kitchens, 0);
    const totalBathrooms = Object.values(resStats).reduce((a: number, r: any) => a + r.bathrooms, 0);
    const overallRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      resStats,
      regionStats,
      companyStats,
      companyNames,
      matrix,
      roleCounts,
      totalCapacity,
      totalOccupied,
      totalVacantBeds,
      totalRooms,
      totalVacantRooms,
      totalKitchens,
      totalBathrooms,
      overallRate,
    };
  }, [residences, workers, occupants, complexes, selectedDate]);

  if (loading) {
    return <div className="dhr-container flex items-center justify-center">جاري تحميل البيانات...</div>;
  }
  if (!data) {
    return <div className="dhr-container flex items-center justify-center">لا توجد بيانات سكنات.</div>;
  }

  const {
    resStats,
    regionStats,
    companyStats,
    companyNames,
    matrix,
    roleCounts,
    totalCapacity,
    totalOccupied,
    totalVacantBeds,
    totalRooms,
    totalVacantRooms,
    totalKitchens,
    totalBathrooms,
    overallRate,
  } = data;

  const resList = residences.map(r => resStats[r.id]).sort((a, b) => b.occupied - a.occupied);
  const totalWorkforce = roleCounts.Worker + roleCounts.Supervisor + roleCounts.Engineer;

  return (
    <div className="dhr-root">
      <div className="dhr-container">
        <div className="dhr-toolbar no-print">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className="border rounded-md px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-[#0f3d6e] text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-[#0a2c50]"
            >
              <Printer className="h-4 w-4" /> طباعة التقرير
            </button>
          </div>
        </div>

        <div className="dhr-page">
          <header className="dhr-header">
            <div className="dhr-title-block">
              <h1>التقرير اليومي للسكنات</h1>
              <div className="sub">Daily Housing Report</div>
            </div>
            <div className="dhr-date-badge">{format(selectedDate, 'EEEE، dd MMMM yyyy')}</div>
            <div className="dhr-total-badge">
              <div className="label">المجموع الكلي / TOTAL</div>
              <div className="value">{totalOccupied.toLocaleString()}</div>
            </div>
          </header>

          <section className="dhr-kpi-row">
            <div className="dhr-kpi-card">
              <div className="icon-wrap" style={{ background: '#e0f2fe' }}>
                <Bed className="h-4 w-4" style={{ color: '#0284c7' }} />
              </div>
              <div className="kpi-label-ar">الطاقة الاستيعابية</div>
              <div className="kpi-label">Total Capacity</div>
              <div className="kpi-value">{totalCapacity.toLocaleString()}</div>
            </div>
            <div className="dhr-kpi-card">
              <div className="icon-wrap" style={{ background: '#dcfce7' }}>
                <Users className="h-4 w-4" style={{ color: '#16a34a' }} />
              </div>
              <div className="kpi-label-ar">المشغول</div>
              <div className="kpi-label">Total Occupied</div>
              <div className="kpi-value">{totalOccupied.toLocaleString()}</div>
            </div>
            <div className="dhr-kpi-card">
              <div className="icon-wrap" style={{ background: '#fee2e2' }}>
                <Bed className="h-4 w-4" style={{ color: '#dc2626' }} />
              </div>
              <div className="kpi-label-ar">الأسرة الشاغرة</div>
              <div className="kpi-label">Vacant Beds</div>
              <div className="kpi-value">{totalVacantBeds.toLocaleString()}</div>
            </div>
            <div className="dhr-kpi-card">
              <div className="icon-wrap" style={{ background: '#f3e8ff' }}>
                <PieChartIcon className="h-4 w-4" style={{ color: '#9333ea' }} />
              </div>
              <div className="kpi-label-ar">نسبة الإشغال</div>
              <div className="kpi-label">Occupancy Rate</div>
              <div className="kpi-value">{overallRate}%</div>
            </div>
            <div className="dhr-kpi-card">
              <div className="icon-wrap" style={{ background: '#fef3c7' }}>
                <Building2 className="h-4 w-4" style={{ color: '#d97706' }} />
              </div>
              <div className="kpi-label-ar">إجمالي الغرف</div>
              <div className="kpi-label">Total Rooms</div>
              <div className="kpi-value">{totalRooms.toLocaleString()}</div>
            </div>
          </section>

          <section className="dhr-charts-row">
            <div className="dhr-section" style={{ marginBottom: 0 }}>
              <div className="dhr-section-title">نسبة الإشغال حسب المنطقة</div>
              <div className="dhr-section-title-en">Occupancy Rate by Region</div>
              {regionStats.map(r => (
                <div className="dhr-bar-row" key={r.city}>
                  <div className="bar-label">{r.city}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${r.rate}%`, background: occupancyColor(r.rate) }}
                    />
                  </div>
                  <div className="bar-value">{r.rate}%</div>
                </div>
              ))}
            </div>

            <div className="dhr-section" style={{ marginBottom: 0 }}>
              <div className="dhr-section-title">القوة العاملة حسب المنطقة</div>
              <div className="dhr-section-title-en">Workforce by Region</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={regionStats} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="city" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="occupied" radius={[4, 4, 0, 0]}>
                    {regionStats.map((_, i) => (
                      <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dhr-section" style={{ marginBottom: 0 }}>
              <div className="dhr-section-title">المشغول حسب الشركة</div>
              <div className="dhr-section-title-en">Occupied by Company</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={companyStats}
                    dataKey="count"
                    nameKey="company"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                  >
                    {companyStats.map((_, i) => (
                      <Cell key={i} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center" style={{ fontSize: 10 }}>
                {companyStats.slice(0, 6).map((c, i) => (
                  <div key={c.company} className="flex items-center gap-1">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: COMPANY_COLORS[i % COMPANY_COLORS.length],
                        display: 'inline-block',
                      }}
                    />
                    {c.company} ({Math.round((c.count / totalOccupied) * 100) || 0}%)
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="dhr-section">
            <div className="dhr-section-title">ملخص الإشغالات حسب السكن</div>
            <div className="dhr-section-title-en">Housing Summary by Location</div>
            <div className="dhr-table-wrap">
              <table className="dhr-table">
                <thead>
                  <tr>
                    <th>المطابخ</th>
                    <th>الحمامات</th>
                    <th>إجمالي الغرف</th>
                    <th>الغرف الشاغرة</th>
                    <th>الأسرة الشاغرة</th>
                    <th>الطاقة الاستيعابية</th>
                    <th>نسبة الإشغال</th>
                    <th>المشغول</th>
                    <th>السكن</th>
                  </tr>
                </thead>
                <tbody>
                  {resList.map((r: any) => (
                    <tr key={r.residence.id}>
                      <td>{r.kitchens}</td>
                      <td>{r.bathrooms}</td>
                      <td>{r.totalRooms}</td>
                      <td>{r.vacantRooms}</td>
                      <td>{r.vacantBeds}</td>
                      <td>{r.capacity}</td>
                      <td>
                        <div className="dhr-occ-cell">
                          <span className="pct">{r.rate}%</span>
                          <div className="dhr-mini-bar">
                            <div style={{ width: `${r.rate}%`, background: occupancyColor(r.rate) }} />
                          </div>
                        </div>
                      </td>
                      <td>{r.occupied}</td>
                      <td className="cell-location">{r.residence.name}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{totalKitchens}</td>
                    <td>{totalBathrooms}</td>
                    <td>{totalRooms}</td>
                    <td>{totalVacantRooms}</td>
                    <td>{totalVacantBeds}</td>
                    <td>{totalCapacity}</td>
                    <td>{overallRate}%</td>
                    <td>{totalOccupied}</td>
                    <td>الإجمالي</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="dhr-section">
            <div className="dhr-section-title">تفاصيل الإشغال حسب الشركة</div>
            <div className="dhr-section-title-en">Occupancy Details by Company</div>
            <div className="dhr-table-wrap">
              <table className="dhr-table">
                <thead>
                  <tr>
                    <th>الإجمالي</th>
                    {resList.map((r: any) => (
                      <th key={r.residence.id}>{r.residence.name}</th>
                    ))}
                    <th>الشركة</th>
                  </tr>
                </thead>
                <tbody>
                  {companyNames.map(company => {
                    const total = Object.values(matrix[company] || {}).reduce((a: number, b: any) => a + b, 0);
                    return (
                      <tr key={company}>
                        <td>{total}</td>
                        {resList.map((r: any) => (
                          <td key={r.residence.id}>{matrix[company][r.residence.id] || '-'}</td>
                        ))}
                        <td className="cell-company">{company}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td>{totalOccupied}</td>
                    {resList.map((r: any) => (
                      <td key={r.residence.id}>{r.occupied}</td>
                    ))}
                    <td className="cell-company">الإجمالي</td>
                  </tr>
                  <tr>
                    <td>{overallRate}%</td>
                    {resList.map((r: any) => (
                      <td key={r.residence.id}>{r.rate}%</td>
                    ))}
                    <td className="cell-company">نسبة الإشغال</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="dhr-info-row">
            <div className="dhr-info-card">
              <div className="dhr-section-title">تفاصيل السكن</div>
              <div className="dhr-section-title-en">Housing Details</div>
              <div className="dhr-stat-line">
                <span className="flex items-center gap-2"><DoorOpen className="h-3.5 w-3.5" /> إجمالي الغرف</span>
                <span className="stat-value">{totalRooms}</span>
              </div>
              <div className="dhr-stat-line">
                <span className="flex items-center gap-2"><DoorOpen className="h-3.5 w-3.5" /> الغرف الشاغرة</span>
                <span className="stat-value">{totalVacantRooms}</span>
              </div>
              <div className="dhr-stat-line">
                <span className="flex items-center gap-2"><Bath className="h-3.5 w-3.5" /> إجمالي الحمامات</span>
                <span className="stat-value">{totalBathrooms}</span>
              </div>
              <div className="dhr-stat-line">
                <span className="flex items-center gap-2"><UtensilsCrossed className="h-3.5 w-3.5" /> إجمالي المطابخ</span>
                <span className="stat-value">{totalKitchens}</span>
              </div>
            </div>

            <div className="dhr-info-card">
              <div className="dhr-section-title">القوى العاملة والخدمات</div>
              <div className="dhr-section-title-en">Workforce &amp; Services</div>
              {(['Supervisor', 'Engineer', 'Worker'] as const).map(role => {
                const Icon = ROLE_ICONS[role];
                return (
                  <div className="dhr-stat-line" key={role}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" /> {ROLE_LABELS[role]}
                    </span>
                    <span className="stat-value">{roleCounts[role]}</span>
                  </div>
                );
              })}
              <div className="dhr-stat-line">
                <span className="flex items-center gap-2 font-bold">
                  <Users className="h-3.5 w-3.5" /> إجمالي القوى العاملة
                </span>
                <span className="stat-value">{totalWorkforce}</span>
              </div>
            </div>

            <div className="dhr-info-card">
              <div className="dhr-section-title">مفتاح نسبة الإشغال</div>
              <div className="dhr-section-title-en">Occupancy Rate Scale</div>
              <div className="dhr-legend-row">
                <span className="dhr-legend-swatch" style={{ background: '#16a34a' }} />
                80% - 100% &nbsp; مرتفع
              </div>
              <div className="dhr-legend-row">
                <span className="dhr-legend-swatch" style={{ background: '#f59e0b' }} />
                60% - 79% &nbsp; متوسط
              </div>
              <div className="dhr-legend-row">
                <span className="dhr-legend-swatch" style={{ background: '#ef4444' }} />
                0% - 59% &nbsp; منخفض
              </div>
              <div className="dhr-legend-row">
                <span className="dhr-legend-swatch" style={{ background: '#94a3b8' }} />
                0% &nbsp; لا يوجد إشغال
              </div>
            </div>
          </section>

          <div className="dhr-footer">
            <span>EstateCare Studio - إدارة الإسكان</span>
            <span>جميع الأرقام حتى تاريخ التقرير</span>
          </div>
        </div>
      </div>
    </div>
  );
}
