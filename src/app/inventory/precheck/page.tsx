'use client';

import { useState, useMemo } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPrecheckPage() {
  const { items, checkItemLifespanAtLocation } = useInventory();
  const { residences } = useResidences();
  const { toast } = useToast();

  const [residenceId, setResidenceId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [itemId, setItemId] = useState('');
  const [result, setResult] = useState<null | { lifespanDays: number | null; lastIssueDate: string | null; daysSinceLastIssue: number | null; withinLifespan: boolean }>(null);
  const [loading, setLoading] = useState(false);

  const selectedResidence = useMemo(() => residences.find(r => r.id === residenceId), [residences, residenceId]);
  const buildings = selectedResidence?.buildings || [];
  const floors = buildings.find(b => b.id === buildingId)?.floors || [];
  const rooms = floors.find(f => f.id === floorId)?.rooms || [];

  const doCheck = async () => {
    if (!itemId || !roomId) {
      toast({ title: 'Missing data', description: 'Select item and room to run the check.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // For rooms we use the roomId as the canonical locationId (same used by MIV)
      const r = await checkItemLifespanAtLocation(itemId, roomId);
      setResult({
        lifespanDays: r.lifespanDays,
        lastIssueDate: r.lastIssueDate ? new Date(r.lastIssueDate.toMillis()).toLocaleString() : null,
        daysSinceLastIssue: r.daysSinceLastIssue,
        withinLifespan: r.withinLifespan,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Proactive Lifespan Precheck (Beta)</CardTitle>
          <CardDescription>Test the lifetime validation by selecting a residence, room, and item.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Residence</Label>
              <Select value={residenceId} onValueChange={setResidenceId}>
                <SelectTrigger><SelectValue placeholder="Select residence" /></SelectTrigger>
                <SelectContent>
                  {residences.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Building</Label>
              <Select value={buildingId} onValueChange={(v) => { setBuildingId(v); setFloorId(''); setRoomId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select building" /></SelectTrigger>
                <SelectContent>
                  {(buildings).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Floor</Label>
              <Select value={floorId} onValueChange={(v) => { setFloorId(v); setRoomId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>
                  {(floors).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {(rooms).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Item</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {items.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nameEn || i.nameAr || i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={doCheck} disabled={loading || !itemId || !roomId}>{loading ? 'Checking...' : 'Run Check'}</Button>
            {result && (
              <div className="text-sm text-muted-foreground self-center">
                {result.lifespanDays ? (
                  result.withinLifespan ? (
                    <span className="text-amber-700">Within lifespan window • Last issue: {result.lastIssueDate || 'N/A'} • Days since: {result.daysSinceLastIssue ?? 'N/A'} • Lifespan: {result.lifespanDays} days</span>
                  ) : (
                    <span className="text-green-700">Outside lifespan window • OK to request • Last issue: {result.lastIssueDate || 'N/A'} • Days since: {result.daysSinceLastIssue ?? 'N/A'}</span>
                  )
                ) : (
                  <span>No lifespan configured for item.</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
