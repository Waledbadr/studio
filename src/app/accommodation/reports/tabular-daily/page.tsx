"use client";

import React, { useMemo, useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import './tabular-styles.css';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function TabularDailyReport() {
    const { residences, workers, occupants, loading } = useAccommodation();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const data = useMemo(() => {
        if (!residences || !residences.length) return null;

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

        // 3. Normalization & Grouping (Company -> Project)
        const groups: Record<string, { company: string; projects: Record<string, string[]> }> = {};

        workers.forEach(w => {
            if (!w.company) return;

            // Normalize Company Name (e.g. Sacodeco vs SACODECO)
            const rawCompany = w.company.trim();
            const normalizedCompany = rawCompany.toUpperCase();

            // Split Project (e.g. ABCD-جامعه و حرس)
            let companyLabel = rawCompany;
            let projectLabel = 'General';

            if (rawCompany.includes('-')) {
                const parts = rawCompany.split('-');
                companyLabel = parts[0].trim();
                projectLabel = parts[1].trim();
            }

            const compKey = companyLabel.toUpperCase();
            if (!groups[compKey]) {
                groups[compKey] = { company: companyLabel, projects: {} };
            }
            if (!groups[compKey].projects[projectLabel]) {
                groups[compKey].projects[projectLabel] = [];
            }
        });

        // Sorted list for rendering
        const sortedCompanies = Object.values(groups).sort((a, b) => a.company.localeCompare(b.company));

        // 4. Matrix: (Company + Project) -> (ResidenceId -> Count)
        const matrix: Record<string, Record<string, number>> = {};

        activeOccupants.forEach(occ => {
            const worker = workers.find(w => w.id === occ.workerId);
            if (worker && worker.company) {
                const raw = worker.company.trim();
                let cLabel = raw;
                let pLabel = 'General';
                if (raw.includes('-')) {
                    const parts = raw.split('-');
                    cLabel = parts[0].trim();
                    pLabel = parts[1].trim();
                }

                const key = `${cLabel.toUpperCase()}|${pLabel}`;
                if (!matrix[key]) matrix[key] = {};
                matrix[key][occ.residenceId] = (matrix[key][occ.residenceId] || 0) + 1;
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

        return { cityGroups, sortedCompanies, matrix, resStats, activeOccupants };
    }, [residences, workers, occupants, selectedDate]);

    if (loading) return <div className="matrix-container flex items-center justify-center font-bold text-xl">Loading Nocturnal Matrix...</div>;
    if (!data) return <div className="matrix-container flex items-center justify-center">No data found.</div>;

    const { cityGroups, sortedCompanies, matrix, resStats, activeOccupants } = data;
    const globalTotal = activeOccupants.length;
    const globalCapacity = Object.values(resStats).reduce((a, b) => a + b.capacity, 0);

    const getCityTotal = (resList: typeof residences) => resList.reduce((acc, r) => acc + resStats[r.id].occupied, 0);

    return (
        <div className="matrix-container">
            <div className="no-print flex justify-between items-center mb-8 w-full max-w-[297mm] bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                <div className="flex items-center gap-6">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Date</label>
                    <input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="bg-transparent border-b-2 border-emerald-500/50 text-white font-black px-2 py-1 outline-none text-xl"
                    />
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-emerald-500 text-white px-10 py-3 rounded-2xl hover:bg-emerald-600 font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20"
                >
                    Print Matrix
                </button>
            </div>

            <div className="matrix-page">
                <div className="watermark-matrix">MATRIX REPORT</div>

                <div className="matrix-content">
                    <header className="matrix-header">
                        <div>
                            <h1>DAILY HOUSING MATRIX</h1>
                            <div className="text-emerald-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-1">Management Report</div>
                        </div>
                        <div className="text-right">
                            <h1 className="arabic">مصفوفة الإسكان اليومية</h1>
                            <div className="text-slate-400 font-mono text-xs">{format(selectedDate, 'dd MMMM yyyy')}</div>
                        </div>
                    </header>

                    <table className="matrix-table">
                        <thead>
                            <tr className="header-tier-1">
                                <th rowSpan={3} className="bg-transparent border-none"></th>
                                {Object.entries(cityGroups).map(([city, resList]) => (
                                    <th key={city} colSpan={resList.length} className="border-b-emerald-500/30">
                                        {getCityTotal(resList)}
                                    </th>
                                ))}
                                <th rowSpan={3} className="header-tier-1 border-none bg-transparent"></th>
                            </tr>
                            <tr className="header-tier-2">
                                {Object.entries(cityGroups).map(([city, resList]) => (
                                    <th key={city} colSpan={resList.length}>
                                        {city}
                                    </th>
                                ))}
                            </tr>
                            <tr className="header-tier-3">
                                {Object.entries(cityGroups).map(([city, resList]) => (
                                    resList.map(res => (
                                        <th key={res.id}>{res.name}</th>
                                    ))
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCompanies.map(comp => (
                                <React.Fragment key={comp.company}>
                                    {/* Company Header Row */}
                                    <tr className="bg-emerald-500/5 group">
                                        <td className="side-label-total font-black text-emerald-300">
                                            {Object.keys(comp.projects).reduce((sum, proj) => {
                                                const key = `${comp.company.toUpperCase()}|${proj}`;
                                                return sum + Object.values(matrix[key] || {}).reduce((a, b) => a + b, 0);
                                            }, 0) || '-'}
                                        </td>
                                        {Object.values(cityGroups).map(resList => (
                                            resList.map(res => {
                                                const val = Object.keys(comp.projects).reduce((sum, proj) => {
                                                    const key = `${comp.company.toUpperCase()}|${proj}`;
                                                    return sum + (matrix[key]?.[res.id] || 0);
                                                }, 0);
                                                return <td key={res.id} className={val > 0 ? 'text-emerald-200 font-bold' : 'text-white/5'}>{val || '-'}</td>;
                                            })
                                        ))}
                                        <td className="side-label-project bg-emerald-500/10 border-l-2 border-l-emerald-500 text-emerald-400">
                                            {comp.company}
                                        </td>
                                    </tr>

                                    {/* Project Rows */}
                                    {Object.keys(comp.projects).sort().map(proj => {
                                        const key = `${comp.company.toUpperCase()}|${proj}`;
                                        const projTotal = Object.values(matrix[key] || {}).reduce((a, b) => a + b, 0);
                                        if (projTotal === 0 && proj === 'General' && Object.keys(comp.projects).length > 1) return null;

                                        return (
                                            <tr key={proj} className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                                                <td className="side-label-total opacity-50">{projTotal || '-'}</td>
                                                {Object.values(cityGroups).map(resList => (
                                                    resList.map(res => {
                                                        const val = matrix[key]?.[res.id];
                                                        return <td key={res.id} className={val > 0 ? 'text-white/80' : 'text-white/5'}>{val || '-'}</td>;
                                                    })
                                                ))}
                                                <td className="side-label-project opacity-70 italic text-sm pr-8">
                                                    └ {proj}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}

                            {/* Total Row */}
                            <tr className="row-total h-12">
                                <td className="text-lg">{globalTotal}</td>
                                {Object.values(cityGroups).map(resList => (
                                    resList.map(res => (
                                        <td key={res.id} className="text-lg">{resStats[res.id].occupied}</td>
                                    ))
                                ))}
                                <td className="side-label-project text-emerald-500">الإجمالي الكلي</td>
                            </tr>

                            {/* Occupancy % Row */}
                            <tr className="row-occupancy h-10">
                                <td className="font-black text-emerald-400">
                                    {Math.round((globalTotal / globalCapacity) * 100)}%
                                </td>
                                {Object.values(cityGroups).map(resList => (
                                    resList.map(res => {
                                        const { capacity, occupied } = resStats[res.id];
                                        const p = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
                                        return <td key={res.id} className={p >= 90 ? 'text-rose-400 font-bold' : p > 0 ? 'text-emerald-400' : ''}>{p}%</td>;
                                    })
                                ))}
                                <td className="side-label-project">نسبة الإشغال</td>
                            </tr>

                            {/* Spacer */}
                            <tr className="h-4"><td colSpan={residences.length + 2} className="border-none"></td></tr>

                            {/* Stats Rows */}
                            <tr className="bg-white/5">
                                <td className="font-bold">{globalCapacity}</td>
                                {Object.values(cityGroups).map(resList => (
                                    resList.map(res => <td key={res.id}>{resStats[res.id].capacity}</td>)
                                ))}
                                <td className="side-label-project">الطاقة الاستيعابية</td>
                            </tr>
                            <tr>
                                <td>{Object.values(resStats).reduce((a, b) => a + b.totalRooms, 0)}</td>
                                {Object.values(cityGroups).map(resList => (
                                    resList.map(res => <td key={res.id}>{resStats[res.id].totalRooms}</td>)
                                ))}
                                <td className="side-label-project font-normal opacity-70">إجمالي الغرف</td>
                            </tr>
                            <tr>
                                <td className="text-rose-400">{Object.values(resStats).reduce((a, b) => a + b.emptyBeds, 0)}</td>
                                {Object.values(cityGroups).map(resList => (
                                    resList.map(res => <td key={res.id} className={resStats[res.id].emptyBeds > 0 ? 'bg-rose-500/10 text-rose-300 font-bold' : ''}>{resStats[res.id].emptyBeds}</td>)
                                ))}
                                <td className="side-label-project font-normal opacity-70">الأسرة الفارغة</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="matrix-footer">
                        <span>ESTATECARE SYSTEMS • NOCTURNAL MATRIX ENGINE v2.5</span>
                        <span>{format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</span>
                        <span>CONFIDENTIAL - FOR INTERNAL USE ONLY</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
