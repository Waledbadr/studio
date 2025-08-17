"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Residence as AcResidence } from '@/context/accommodation-context';
import { useResidences } from '@/context/residences-context';
import { useLanguage } from '@/context/language-context';

export default function ResidenceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [residence, setResidence] = useState<AcResidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { residences, loadResidences } = useResidences();
  const { dict } = useLanguage();

  useEffect(() => {
    // Attempt to get the residence from the canonical provider
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!residences || residences.length === 0) await loadResidences();
        const r = (residences || []).find((x: any) => x.id === id);
        if (!r) {
          setResidence(null);
        } else {
          const mapped: AcResidence = {
            id: r.id,
            name: r.name || r.title || 'Unnamed',
            address: r.city || r.address || r.locationString || '',
            location: r.location || null,
            buildings: r.buildings || undefined,
            rooms: r.rooms || undefined,
          };
          if (mounted) setResidence(mapped);
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message || 'Failed');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, residences, loadResidences]);

  if (loading) return <div>{dict.loading || 'Loading...'}</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!residence) return <div>{dict.noResidenceData || 'No residence data.'}</div>;
  // assign form state
  const [selectedRoom, setSelectedRoom] = useState<string | null>(
    (residence && residence.rooms && residence.rooms.length && residence.rooms[0].id) ||
      (residence && (residence as any).buildings && (residence as any).buildings[0]?.floors && (residence as any).buildings[0].floors[0]?.rooms && (residence as any).buildings[0].floors[0].rooms[0]?.id) ||
      null
  );
  const [tenantName, setTenantName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAssign = async () => {
    if (!selectedRoom || !tenantName) return alert('Select a room and enter tenant name');
    setSubmitting(true);
    try {
      const resp = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residenceId: residence.id, roomId: selectedRoom, tenantName }) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed');

      // update local room state
  setResidence(prev => prev ? ({ ...prev, rooms: prev.rooms?.map(r => r.id === selectedRoom ? { ...r, occupied: true } : r) }) : prev);
  setTenantName('');
  alert('Assigned successfully');
    } catch (e: any) {
      console.error(e);
  alert('Assignment failed: ' + (e?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{residence.name}</h1>
          <div className="flex gap-2">
            <button className="rounded-md border px-3 py-1" onClick={() => router.push('/accommodation/residences')}>{dict.back || 'Back'}</button>
          </div>
        </div>

      <div className="rounded-md border p-4 bg-white/80">
  <h3 className="font-medium mb-2">{dict.assignTenant || 'Assign tenant'}</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <select value={selectedRoom ?? ''} onChange={(e) => setSelectedRoom(e.target.value)} className="border rounded px-3 py-2">
            {residence?.rooms?.map(r => (
              <option key={r.id} value={r.id} disabled={r.occupied}>{r.name} {r.occupied ? '(Occupied)' : ''}</option>
            ))}
            {/* If buildings/floors exist, show their rooms grouped */}
            {(!(residence?.rooms && residence.rooms.length) && (residence as any)?.buildings) && ((residence as any).buildings as any[]).map((b: any) => (
              <optgroup key={b.id} label={b.name || 'Building'}>
                {((b.floors as any[]) || []).flatMap((f: any) => (f.rooms || [])).map((r: any) => (
                  <option key={r.id} value={r.id} disabled={r.occupied}>{`${b.name || ''} / ${r.name} ${r.occupied ? '(Occupied)' : ''}`}</option>
                ))}
              </optgroup>
            ))}
          </select>
            <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder={dict.tenantNamePlaceholder || 'Tenant name'} className="border rounded px-3 py-2 flex-1" />
          <button onClick={handleAssign} disabled={submitting} className="rounded-md bg-amber-600 text-white px-4 py-2">{submitting ? (dict.working || 'Working...') : (dict.assign || 'Assign')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="rounded-md border p-4 bg-white/80">
            <h3 className="font-medium mb-2">{dict.address || 'Address'}</h3>
            <p className="text-sm text-muted-foreground">{residence.address || dict.notSpecified || 'Not specified'}</p>

            <h3 className="font-medium mt-4 mb-2">{dict.roomsBuildings || 'Rooms / Buildings'}</h3>
            <ul className="space-y-2">
              {((residence.rooms && residence.rooms.length) || (residence.buildings && residence.buildings.length)) ? (
                // If top-level rooms exist, render them. Otherwise render buildings -> floors -> rooms
                (residence.rooms && residence.rooms.length) ? (
                  residence.rooms.map(r => (
                    <li key={r.id} className="flex items-center justify-between border rounded px-3 py-2 bg-white">
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-muted-foreground">Capacity: {r.capacity}</div>
                      </div>
                      <div className={r.occupied ? 'text-red-600' : 'text-emerald-600'}>{r.occupied ? 'Occupied' : 'Vacant'}</div>
                    </li>
                  ))
                ) : (
                  residence.buildings!.flatMap(b => b.floors || []).flatMap(f => f.rooms || []).map(r => (
                    <li key={r.id} className="flex items-center justify-between border rounded px-3 py-2 bg-white">
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-muted-foreground">Capacity: {r.capacity}</div>
                      </div>
                      <div className={r.occupied ? 'text-red-600' : 'text-emerald-600'}>{r.occupied ? 'Occupied' : 'Vacant'}</div>
                    </li>
                  ))
                )
              ) : (
                <li className="text-muted-foreground">{dict.noRoomsDefined || 'No rooms defined.'}</li>
              )}
            </ul>
          </div>
        </div>
        <div>
          <div className="rounded-md border p-4 bg-white/80">
            <h4 className="font-medium">Location</h4>
            {residence?.location ? (
              <pre className="text-sm text-muted-foreground">{JSON.stringify(residence.location)}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">No coordinates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
