"use client";

import React, { useEffect, useState } from 'react';
import { useResidences } from '@/context/residences-context';

export default function AccommodationAssignPage() {
  const { residences, loadResidences, buildings } = useResidences();
  const [loading, setLoading] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<string | null>(residences?.[0]?.id || null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // ensure residences are loaded from the canonical provider
    if (!residences || residences.length === 0) {
      loadResidences();
    }
    if (residences && residences.length && !selectedResidence) {
      setSelectedResidence(residences[0].id);
    }
  }, [residences, loadResidences]);

  useEffect(() => {
    if (!selectedResidence) return;
  const complex = residences.find(r => r.id === selectedResidence);
  if (!complex) return setRooms([]);
  // Flatten buildings -> floors -> rooms (this repo stores rooms inside buildings->floors)
  const flattened = (complex.buildings || []).flatMap(b => (b.floors || []).flatMap(f => f.rooms || []) );
  setRooms(flattened || []);
  if (flattened && flattened.length) setSelectedRoom(flattened[0].id || null);
  }, [selectedResidence, residences]);

  const handleAssign = async () => {
  if (!selectedResidence || !selectedRoom || !tenantName) return alert('Select residence, room and enter tenant name');
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residenceId: selectedResidence, roomId: selectedRoom, tenantName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
  alert('Assigned successfully');
      setTenantName('');
    } catch (e: any) {
      console.error(e);
      alert('فشل التعيين: ' + (e?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">تعيين ساكن</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="rounded-md border p-4 bg-white/80">
          <div className="flex flex-col md:flex-row gap-3">
            <select className="border rounded px-3 py-2" value={selectedResidence ?? ''} onChange={(e) => setSelectedResidence(e.target.value)}>
              {residences.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="border rounded px-3 py-2" value={selectedRoom ?? ''} onChange={(e) => setSelectedRoom(e.target.value)}>
              {rooms.map((rm:any) => <option key={rm.id} value={rm.id} disabled={rm.occupied}>{rm.name || rm.label}{rm.occupied ? ' (Occupied)' : ''}</option>)}
            </select>
            <input value={tenantName} onChange={(e)=>setTenantName(e.target.value)} placeholder="Tenant name" className="border rounded px-3 py-2 flex-1" />
            <button onClick={handleAssign} disabled={submitting} className="rounded-md bg-amber-600 text-white px-4 py-2">{submitting? 'Working...' : 'Assign'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
