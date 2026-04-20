"use client";

import React, { useEffect, useState } from 'react';

export default function MonthlyReportPage() {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth()+1);
  const [report, setReport] = useState<any>(null);

  async function load() {
    try {
      const res = await fetch('/api/accommodation/reports/monthly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, month }) });
      const data = await res.json();
      if (data?.ok) setReport(data.report);
    } catch (e) { console.error(e); }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Monthly occupant-days report</h1>
      <div className="rounded-md border p-4 bg-white/80">
        <label className="block">Year</label>
        <input type="number" value={year} onChange={(e)=>setYear(Number(e.target.value))} className="border rounded px-3 py-2" />
        <label className="block mt-2">Month</label>
        <input type="number" min={1} max={12} value={month} onChange={(e)=>setMonth(Number(e.target.value))} className="border rounded px-3 py-2" />
        <button onClick={load} className="ml-2 rounded-md bg-amber-600 text-white px-3 py-1">Load</button>
      </div>

      <div className="rounded-md border p-4 bg-white/80">
        <h3 className="font-medium">Report</h3>
        {report ? (
          <div>
            <h4 className="font-semibold">Per residence</h4>
            <div className="pl-4">{Object.entries(report.perResidence || {}).map(([k,v])=> <div key={k}>{k}: {String(v)}</div>)}</div>
            <h4 className="font-semibold mt-2">Per occupant</h4>
            <div className="pl-4">{Object.entries(report.perOccupant || {}).map(([k,v])=> <div key={k}>{k}: {String(v)}</div>)}</div>
          </div>
        ) : <div className="text-sm text-muted-foreground">No data</div>}
      </div>
    </div>
  );
}
