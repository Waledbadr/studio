"use client";

import React, { useEffect, useState } from 'react';

export default function WorkerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [worker, setWorker] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(()=>{
    try {
      const wRaw = localStorage.getItem('ac_workers') || '[]';
      const oRaw = localStorage.getItem('ac_occupants') || '[]';
      const tRaw = localStorage.getItem('ac_transfers') || '[]';
      const workers = JSON.parse(wRaw);
      const occ = JSON.parse(oRaw);
      const trs = JSON.parse(tRaw);
      setWorker(workers.find((w:any)=>w.id===id));
      const moves = occ.filter((o:any)=>o.workerId===id).map((o:any)=>({ type: 'assign', ...o }));
      const related = trs.filter((tr:any)=> tr.workerIds.includes(id)).map((tr:any)=>({ type: 'transfer', ...tr }));
      setHistory([...moves, ...related].sort((a:any,b:any)=> (a.since||a.requestedAt||'').localeCompare(b.since||b.requestedAt||'')).reverse());
    } catch(e){ console.error(e); }
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Worker {id}</h1>
        {worker && (
          <a
            href={`/accommodation/worker-certificate?workerId=${worker.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Print Certificate"
          >
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border text-sm font-medium" style={{lineHeight:1}}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-6 0v4m0 0h4m-4 0H8" /></svg>
              <span>Print Certificate</span>
            </button>
          </a>
        )}
      </div>
      {worker ? (
        <div className="rounded-md border p-4 bg-white/80">
          <div className="font-semibold">{worker.name}</div>
          <div className="text-sm text-muted-foreground">Nationality: {worker.nationaliy}</div>
          <div className="text-sm">Role: {worker.role}</div>
        </div>
      ) : <div className="text-sm text-muted-foreground">Worker not found</div>}

      <div className="rounded-md border p-4 bg-white/80">
        <h3 className="font-medium">Movement history</h3>
        <ul className="space-y-2">
          {history.length ? history.map((h:any,idx:number)=> (
            <li key={idx} className="p-2 border rounded">
              <div className="text-sm">{h.type==='assign' ? `Assigned to ${h.residenceId}/${h.roomId} at ${h.since}` : `Transfer request ${h.id} to ${h.to?.residenceId} status ${h.status}`}</div>
            </li>
          )) : <li className="text-sm text-muted-foreground">No history</li>}
        </ul>
      </div>
    </div>
  );
}
