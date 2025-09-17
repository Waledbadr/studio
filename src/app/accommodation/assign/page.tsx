"use client";

import React, { useEffect, useState } from "react";
import { useResidences } from "@/context/residences-context";

export default function AccommodationAssignPage() {
  const { residences, loadResidences } = useResidences();
  const [loading, setLoading] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<string | null>(residences?.[0]?.id || null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [filterNationality, setFilterNationality] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!residences || residences.length === 0) loadResidences();
    if (residences && residences.length && !selectedResidence) setSelectedResidence(residences[0].id);
  }, [residences, loadResidences]);

  useEffect(() => {
    if (!selectedResidence) return;
    const complex = residences.find((r) => r.id === selectedResidence);
    if (!complex) return setRooms([]);
    const flattened = (complex.buildings || []).flatMap((b) => (b.floors || []).flatMap((f) => f.rooms || []));
    setRooms(flattened || []);
    if (flattened && flattened.length) setSelectedRoom(flattened[0].id || null);
  }, [selectedResidence, residences]);

  async function doSearch(q: string) {
    setSearchQ(q);
    try {
      const res = await fetch('/api/accommodation/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) });
      const data = await res.json();
      if (data?.ok) setSearchResults(data.results || []);
    } catch (e) {
      console.error(e);
    }
  }

  function toggleWorker(wid: string) {
    setSelectedWorkers(prev => prev.includes(wid) ? prev.filter(x => x !== wid) : [...prev, wid]);
  }

  async function handleBulkAssign() {
    if (!selectedResidence || !selectedRoom || selectedWorkers.length === 0) return alert('Choose residence, room and select workers');
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerIds: selectedWorkers, residenceId: selectedResidence, roomId: selectedRoom }) });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      alert('Assigned: ' + JSON.stringify(data));
      setSelectedWorkers([]);
    } catch (e: any) {
      console.error(e);
      alert('Assign failed: ' + (e?.message || ''));
    } finally {
      setSubmitting(false);
    }
  }

  // simple DnD: drag worker id onto room element
  function onDragStart(e: React.DragEvent, id: string) { e.dataTransfer.setData('text/plain', id); }
  async function onDropToRoom(e: React.DragEvent, roomId: string) {
    const wid = e.dataTransfer.getData('text/plain');
    if (!wid || !selectedResidence) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId: wid, residenceId: selectedResidence, roomId }) });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      alert('Assigned ' + wid + ' to room');
    } catch (e:any) {
      console.error(e);
      alert('Assign failed: ' + (e?.message || ''));
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Assign tenants</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 rounded-md border p-4">
          <label className="block text-sm">Residence</label>
          <select className="border rounded px-3 py-2 w-full" value={selectedResidence ?? ''} onChange={(e) => setSelectedResidence(e.target.value)}>
            {residences.map((r:any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <label className="block mt-3 text-sm">Rooms (drop here)</label>
          <div className="space-y-2">
            {rooms.map((rm:any) => (
              <div key={rm.id} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onDropToRoom(e, rm.id)} className="p-2 border rounded cursor-pointer bg-white">
                <div className="flex justify-between"><div>{rm.name||rm.label}</div><div className="text-xs text-muted-foreground">{rm.roomType || ''} {rm.spaceSqm ? `${rm.spaceSqm} sqm` : ''}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 rounded-md border p-4">
          <div className="flex gap-2 mb-3">
            <input value={searchQ} onChange={(e)=>doSearch(e.target.value)} placeholder="Search workers by name, id, nationality" className="border rounded px-3 py-2 flex-1" />
            <select value={filterNationality} onChange={(e)=>setFilterNationality(e.target.value)} className="border rounded px-3 py-2">
              <option value="">All nationalities</option>
              {/* nationality options could be derived from searchResults */}
            </select>
            <button onClick={handleBulkAssign} disabled={submitting || selectedWorkers.length===0} className="rounded-md bg-amber-600 text-white px-4 py-2">Bulk assign</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="font-medium">Search results</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {searchResults.filter(s=>!filterNationality|| (s.nationaliy||'').toLowerCase().includes(filterNationality.toLowerCase())).map((w:any)=> (
                  <div key={w.id} draggable onDragStart={(e)=>onDragStart(e,w.id)} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.id} • {w.nationaliy}</div>
                    </div>
                    <div>
                      <input type="checkbox" checked={selectedWorkers.includes(w.id)} onChange={()=>toggleWorker(w.id)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium">Selected ({selectedWorkers.length})</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {selectedWorkers.map(id => {
                  const w = searchResults.find((s:any)=>s.id===id) || { id, name: id };
                  return <div key={id} className="p-2 border rounded flex items-center justify-between"><div>{w.name}</div><div className="text-xs">{w.id}</div></div>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
