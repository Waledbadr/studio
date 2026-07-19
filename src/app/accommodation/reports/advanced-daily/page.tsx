"use client";

import React, { useMemo, useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import './report-styles.css';
import { format } from 'date-fns';
import { Home, Users, Bed, Building2, MapPin, Search } from 'lucide-react';

export default function AdvancedDailyReport() {
    const { residences, workers, occupants, loading } = useAccommodation();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const data = useMemo(() => {
        if (!residences.length) return null;

        const dayStr = format(selectedDate, 'yyyy-MM-dd');

        // 1. Group Residences by City (Region)
        const cityGroups: Record<string, typeof residences> = {};
        residences.forEach(res => {
            const city = res.city || 'Other';
            if (!cityGroups[city]) cityGroups[city] = [];
            cityGroups[city].push(res);
        });

        // 2. Identify active occupants
        const activeOccupants = occupants.filter(occ => {
            const since = occ.since.slice(0, 10);
            const until = occ.until ? occ.until.slice(0, 10) : null;
            return since <= dayStr && (!until || until >= dayStr);
        });

        // 3. Companies/Projects
        const projectNames = Array.from(new Set(workers.map(w => w.company || 'Unknown'))).filter(Boolean).sort();

        // 4. Matrix: Project -> (ResidenceId -> Count)
        const matrix: Record<string, Record<string, number>> = {};
        projectNames.forEach(proj => {
            matrix[proj] = {};
            residences.forEach(res => {
                matrix[proj][res.id] = 0;
            });
        });

        activeOccupants.forEach(occ => {
            const worker = workers.find(w => w.id === occ.workerId);
            if (worker && worker.company) {
                const proj = worker.company;
                if (matrix[proj]) {
                    matrix[proj][occ.residenceId] = (matrix[proj][occ.residenceId] || 0) + 1;
                }
            }
        });

        // 5. Stats
        const resStats: Record<string, any> = {};
        residences.forEach(res => {
            let capacity = 0;
            let totalRooms = 0;
const occupiedRooms = new Set<string>();

            const processRooms = (rooms: any[]) => {
                rooms?.forEach(r => {
                    totalRooms++;
                    capacity += r.capacity || 0;
                    const rOcc = activeOccupants.filter(o => o.roomId === r.id).length;
                    if (rOcc > 0) occupiedRooms.add(r.id);
                });
            };

            if (res.buildings) {
                res.buildings.forEach(b => {
                    b.floors?.forEach(f => processRooms(f.rooms || []));
                });
            } else if (res.rooms) {
                processRooms(res.rooms);
            }

            const occupied = activeOccupants.filter(o => o.residenceId === res.id).length;
            resStats[res.id] = {
                capacity,
                totalRooms,
                occupied,
                emptyRooms: totalRooms - occupiedRooms.size,
                emptyBeds: capacity - occupied
            };
        });

        return { cityGroups, projectNames, matrix, resStats, activeOccupants };
    }, [residences, workers, occupants, selectedDate]);

    if (loading) return <div className="report-container flex items-center justify-center font-bold text-xl">Loading Masterpiece...</div>;
    if (!data) return <div className="report-container flex items-center justify-center">No data found.</div>;

    const { cityGroups, projectNames, matrix, resStats, activeOccupants } = data;
    const globalTotal = activeOccupants.length;
    const globalCapacity = Object.values(resStats).reduce((a, b) => a + b.capacity, 0);
    const globalEmptyBeds = globalCapacity - globalTotal;

    return (
        <div className="report-container">
            {/* Header Controls */}
            <div className="no-print flex justify-between items-center mb-8 w-full max-w-[297mm] bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Select Report Date</span>
                        <input
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="bg-transparent border-b-2 border-emerald-500/50 text-white font-bold px-1 py-1 outline-none focus:border-emerald-500 transition-all text-lg"
                        />
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 rounded-2xl hover:scale-105 active:scale-95 font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                >
                    Print Masterpiece
                </button>
            </div>

            <div className="report-page">
                <div className="watermark-text">EXECUTIVE</div>

                <div className="report-content">
                    {/* Header */}
                    <header className="glass-header">
                        <div className="title-group">
                            <h1 className="tracking-tighter">HOUSING INTELLIGENCE</h1>
                            <h1 className="arabic">التقرير الذكي للسكنات</h1>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-black text-white/90 leading-none">
                                {format(selectedDate, 'dd')}
                            </div>
                            <div className="text-xs uppercase tracking-[0.3em] text-emerald-500 font-bold">
                                {format(selectedDate, 'MMMM yyyy')}
                            </div>
                        </div>
                    </header>

                    {/* KPI Dashboard */}
                    <div className="kpi-grid">
                        <div className="kpi-card highlight">
                            <div className="kpi-label">Total Occupancy / الإشغال الكلي</div>
                            <div className="kpi-value">{globalTotal}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Global Capacity / الطاقة الاستيعابية</div>
                            <div className="kpi-value">{globalCapacity}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Available Beds / الأسرة المتاحة</div>
                            <div className="kpi-value">{globalEmptyBeds}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Active Complexes / المواقع النشطة</div>
                            <div className="kpi-value">{residences.length}</div>
                        </div>
                    </div>

                    {/* Regional Data Cards */}
                    <div className="region-grid">
                        {Object.entries(cityGroups).map(([city, resList]) => {
                            const cityOcc = resList.reduce((acc, r) => acc + resStats[r.id].occupied, 0);
                            const cityCap = resList.reduce((acc, r) => acc + resStats[r.id].capacity, 0);
                            const cityPerc = cityCap > 0 ? Math.round((cityOcc / cityCap) * 100) : 0;

                            return (
                                <section key={city} className="region-card">
                                    <div className="region-header">
                                        <div className="region-name">
                                            <MapPin className="text-emerald-500" size={24} />
                                            <span>{city}</span>
                                        </div>
                                        <div className="region-stats">
                                            <span>Occupancy: <strong>{cityPerc}%</strong></span>
                                            <span>•</span>
                                            <span>Actual: <strong>{cityOcc} / {cityCap}</strong></span>
                                        </div>
                                    </div>

                                    <table className="masterpiece-table">
                                        <thead>
                                            <tr>
                                                <th className="w-[80px]">Total</th>
                                                {resList.map(res => (
                                                    <th key={res.id}>{res.name}</th>
                                                ))}
                                                <th className="text-right pr-4 w-[180px]">Project / المشروع</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectNames.map(proj => {
                                                const projRowTotal = resList.reduce((acc, r) => acc + (matrix[proj][r.id] || 0), 0);
                                                if (projRowTotal === 0) return null; // Only show active projects in the region

                                                return (
                                                    <tr key={proj} className="project-row">
                                                        <td className="font-bold text-white/50">{projRowTotal}</td>
                                                        {resList.map(res => {
                                                            const val = matrix[proj][res.id];
                                                            return <td key={res.id} className={val > 0 ? 'text-white' : 'text-white/10'}>{val || '-'}</td>;
                                                        })}
                                                        <td className="project-name-cell">{proj}</td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Sub-totals for the region */}
                                            <tr className="res-total-row border-t border-white/10 mt-2">
                                                <td className="font-black text-xl">{cityOcc}</td>
                                                {resList.map(res => (
                                                    <td key={res.id} className="site-name-cell text-lg">{resStats[res.id].occupied}</td>
                                                ))}
                                                <td className="stat-label-cell">إجمالي الإشغال</td>
                                            </tr>

                                            <tr className="occupancy-row bg-white/5">
                                                <td className="font-bold text-emerald-400">{cityPerc}%</td>
                                                {resList.map(res => {
                                                    const { capacity, occupied } = resStats[res.id];
                                                    const p = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
                                                    let cls = 'badge-low';
                                                    if (p >= 100) cls = 'badge-high';
                                                    else if (p >= 90) cls = 'badge-mid';
                                                    return (
                                                        <td key={res.id}>
                                                            <span className={`occupancy-badge ${cls}`}>{p}%</span>
                                                        </td>
                                                    );
                                                })}
                                                <td className="stat-label-cell">نسبة الإشغال الكلية</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </section>
                            );
                        })}
                    </div>

                    <div className="footer-artwork">
                        <span>ESTATECARE HOUSING INTELLIGENCE • GEN 2.0</span>
                        <div className="flex gap-4">
                            <span>{globalTotal} WORKERS AT {residences.length} SITES</span>
                            <span>•</span>
                            <span>{format(new Date(), 'HH:mm')}</span>
                        </div>
                        <span>PAGE 01 / 01</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
