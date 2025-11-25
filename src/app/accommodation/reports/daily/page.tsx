"use client";

import React, { useEffect, useState } from 'react';

export default function DailyReportPage() {
  const [report, setReport] = useState<Record<string, Record<string, number>>>({});
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10));

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/accommodation/reports/daily', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dateISO }) });
      const data = await res.json();
      if (data?.ok) setReport(data.report || {});
    } catch (e) { console.error(e); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Daily occupancy report</h1>
      <div className="rounded-md border p-4 bg-white/80">
        <label className="block">Date</label>
        <input type="date" value={dateISO} onChange={(e)=>setDateISO(e.target.value)} className="border rounded px-3 py-2" />
        <button onClick={load} className="ml-2 rounded-md bg-amber-600 text-white px-3 py-1">Load</button>
      </div>

      <div className="rounded-md border p-4 bg-white/80">
        <h3 className="font-medium">Report</h3>
        {Object.keys(report).length ? Object.entries(report).map(([res, map]) => (
          <div key={res} className="mb-2">
            <div className="font-semibold">{res}</div>
            <div className="pl-4">
              {Object.entries(map).map(([nat, cnt]) => (<div key={nat}>{nat}: {cnt}</div>))}
            </div>
          </div>
        )) : <div className="text-sm text-muted-foreground">No data</div>}
      </div>
    </div>
  );
}
