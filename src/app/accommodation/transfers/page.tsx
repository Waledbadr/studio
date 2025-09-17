"use client";

import React, { useEffect, useState } from 'react';

export default function TransfersPage() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(()=>{
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_transfers') : null;
      const arr = raw ? JSON.parse(raw) : [];
      setRequests(arr);
    } catch(e){ console.error(e); }
  },[]);

  function review(id: string, approve: boolean) {
    const raw = localStorage.getItem('ac_transfers') || '[]';
    const arr = JSON.parse(raw);
    const updated = arr.map((t:any)=> t.id===id ? { ...t, status: approve? 'Approved' : 'Rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'local-manager' } : t);
    localStorage.setItem('ac_transfers', JSON.stringify(updated));
    setRequests(updated);
    // if approved: try auto-assign (simple)
    if (approve) {
      const tr = updated.find((x:any)=>x.id===id);
      if (tr) {
        const wRaw = localStorage.getItem('ac_workers') || '[]';
        const occRaw = localStorage.getItem('ac_occupants') || '[]';
        const workers = JSON.parse(wRaw);
        const occupants = JSON.parse(occRaw);
        // try to assign to specified room or find first room with space
        if (tr.to?.roomId) {
          for (const wid of tr.workerIds) occupants.push({ workerId: wid, residenceId: tr.to.residenceId, roomId: tr.to.roomId, since: new Date().toISOString() });
        } else {
          // naive: place into rooms of residence sequentially
          const resRaw = localStorage.getItem('estatecare_residences') || '[]';
          const res = JSON.parse(resRaw).find((r:any)=>r.id===tr.to.residenceId);
          const rooms: any[] = [];
          if (res) {
            if (res.rooms) rooms.push(...res.rooms);
            if (res.buildings) for (const b of res.buildings) if (b.floors) for (const f of b.floors) if (f.rooms) rooms.push(...f.rooms);
          }
          for (const wid of tr.workerIds) {
            const w = workers.find((x:any)=>x.id===wid);
            if (!w) continue;
            for (const rm of rooms) {
              const occCount = occupants.filter((o:any)=>o.roomId===rm.id && o.residenceId===tr.to.residenceId).length;
              const cap = rm.spaceSqm && rm.roomType ? Math.floor(rm.spaceSqm / (rm.roomType==='Worker'?4: rm.roomType==='Supervisor'?8:16)) : (rm.capacity || 1);
              const firstOcc = occupants.find((o:any)=>o.roomId===rm.id && o.residenceId===tr.to.residenceId);
              const firstNat = firstOcc ? (workers.find((x:any)=>x.id===firstOcc.workerId)?.nationaliy) : null;
              if (occCount < cap && (!firstNat || firstNat === w.nationaliy)) { occupants.push({ workerId: wid, residenceId: tr.to.residenceId, roomId: rm.id, since: new Date().toISOString() }); break; }
            }
          }
        }
        localStorage.setItem('ac_occupants', JSON.stringify(occupants));
      }
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Transfer requests</h1>
      <div className="rounded-md border p-4 bg-white/80">
        <ul className="space-y-2">
          {requests.length ? requests.map(r=> (
            <li key={r.id} className="p-3 border rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.id} • {r.status}</div>
                  <div className="text-sm text-muted-foreground">To: {r.to?.residenceId} {r.to?.roomId? '/ '+r.to.roomId : ''}</div>
                  <div className="text-sm">Workers: {r.workerIds.join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  {r.status==='Pending' && <button className="rounded-md bg-emerald-600 text-white px-3 py-1" onClick={()=>review(r.id, true)}>Approve</button>}
                  {r.status==='Pending' && <button className="rounded-md bg-red-600 text-white px-3 py-1" onClick={()=>review(r.id,false)}>Reject</button>}
                </div>
              </div>
            </li>
          )) : <li className="text-sm text-muted-foreground">No requests</li>}
        </ul>
      </div>
    </div>
  );
}
