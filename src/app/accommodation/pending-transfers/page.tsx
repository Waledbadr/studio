'use client';

import { useAccommodation } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, MapPin, ArrowRight, Truck, RefreshCw } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function PendingTransfersPage() {
  const { workers, loading, residences, bulkCheckIn, occupants } = useAccommodation();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Assignment Dialog State
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [selectedResidenceId, setSelectedResidenceId] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInType, setCheckInType] = useState('Transfer');

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Refresh page to trigger listeners
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to sync data", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Get accessible residences for current user
  const accessibleResidences = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences?.includes(r.id));
  }, [residences, currentUser]);

  // Filter residences by destination city
  const destinationResidences = useMemo(() => {
    if (!selectedWorker?.transferDestination) return accessibleResidences;
    return accessibleResidences.filter(r => r.city === selectedWorker.transferDestination);
  }, [accessibleResidences, selectedWorker]);

  const selectedResidence = destinationResidences.find(r => r.id === selectedResidenceId);
  const buildings = selectedResidence?.buildings || [];
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const floors = selectedBuilding?.floors || [];
  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const rooms = selectedFloor?.rooms || [];

  // Calculate room occupancy
  const roomOccupancy = useMemo(() => {
    const occupancyMap: Record<string, number> = {};
    occupants
      .filter(o => o.residenceId === selectedResidenceId && o.roomId && !o.until)
      .forEach(o => {
        occupancyMap[o.roomId] = (occupancyMap[o.roomId] || 0) + 1;
      });
    return occupancyMap;
  }, [occupants, selectedResidenceId]);

  const handleAssignClick = (worker: any) => {
    setSelectedWorker(worker);
    setSelectedResidenceId('');
    setSelectedBuildingId('');
    setSelectedFloorId('');
    setSelectedRoomId('');
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setCheckInType('Transfer');
    setAssignDialog(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedWorker || !selectedResidenceId || !selectedRoomId) {
      toast({ title: "Error", description: "Please select a room", variant: "destructive" });
      return;
    }

    try {
      const result = await bulkCheckIn({
        workerIds: [selectedWorker.id],
        residenceId: selectedResidenceId,
        buildingId: selectedBuildingId,
        floorId: selectedFloorId,
        roomId: selectedRoomId,
        checkInDate: new Date(checkInDate).toISOString(),
        notes: checkInType,
        performedBy: currentUser?.id || 'Admin',
        emergencyMode: false
      });

      if (result.ok) {
        toast({ title: "Success", description: `${selectedWorker.name} assigned successfully` });
        setAssignDialog(false);
        setSelectedWorker(null);
      } else {
        const errorMsg = Object.values(result.results)[0] as any;
        toast({ 
          title: "Error", 
          description: errorMsg?.error || "Failed to assign worker", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast({ title: "Error", description: "Assignment failed", variant: "destructive" });
    }
  };

  // Get accessible cities for current user
  const accessibleCities = useMemo(() => {
    if (!currentUser) {
      console.log('[PendingTransfers] No current user');
      return [];
    }
    
    console.log('[PendingTransfers] Current user:', {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      assignedResidences: currentUser.assignedResidences
    });
    
    if (currentUser.role === 'Admin') {
      // Admin sees all cities
      const cities = residences.map(r => r.city).filter(Boolean);
      console.log('[PendingTransfers] Admin - all cities:', cities);
      return cities;
    }
    
    // Filter residences by user's assignedResidences IDs
    const userResidences = residences.filter(r => 
      currentUser.assignedResidences?.includes(r.id)
    );
    
    console.log('[PendingTransfers] User assigned residences:', userResidences.map(r => ({
      id: r.id,
      name: r.name,
      city: r.city
    })));
    
    // Extract unique cities from assigned residences
    const cities = [...new Set(userResidences.map(r => r.city).filter(Boolean))];
    console.log('[PendingTransfers] User accessible cities:', cities);
    
    return cities;
  }, [currentUser, residences]);

  // Filter workers with status 'Transferring' and destination city in accessible cities
  const pendingTransfers = useMemo(() => {
    console.log('[PendingTransfers] === FILTERING WORKERS ===');
    console.log('[PendingTransfers] Total workers:', workers.length);
    console.log('[PendingTransfers] Accessible cities:', accessibleCities);
    
    const transferring = workers.filter(w => {
      if (w.status !== 'Transferring') return false;
      
      console.log('[PendingTransfers] Found Transferring worker:', { 
        id: w.id, 
        name: w.name, 
        employeeId: w.employeeId,
        status: w.status, 
        transferDestination: w.transferDestination,
        allWorkerFields: w
      });
      
      // If no destination, show to admin only
      if (!w.transferDestination) {
        const showToAdmin = currentUser?.role === 'Admin';
        console.log('[PendingTransfers] No destination, show to admin?', showToAdmin);
        return showToAdmin;
      }
      
      // Check if destination city is in accessible cities (case-insensitive)
      const isAccessible = accessibleCities.some(city => 
        city.toLowerCase().trim() === w.transferDestination?.toLowerCase().trim()
      );
      console.log('[PendingTransfers] Is accessible?', {
        destination: w.transferDestination,
        accessibleCities,
        isAccessible,
        comparison: accessibleCities.map(c => ({
          city: c,
          matches: c.toLowerCase().trim() === w.transferDestination?.toLowerCase().trim()
        }))
      });
      return isAccessible;
    });
    
    console.log('[PendingTransfers] === FILTERING COMPLETE ===');
    console.log('[PendingTransfers] Total transferring workers found:', transferring.length);
    return transferring;
  }, [workers, accessibleCities, currentUser]);

  // Filter by search
  const filtered = pendingTransfers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.employeeId && w.employeeId.includes(searchQuery)) ||
    (w.transferDestination && w.transferDestination.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pending Transfers</h2>
          <p className="text-muted-foreground">Workers currently in transit between locations.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">In Transit ({pendingTransfers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mb-4 opacity-20" />
              <p>No pending transfers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="font-medium">{worker.name}</div>
                      <div className="text-xs text-muted-foreground">{worker.employeeId}</div>
                    </TableCell>
                    <TableCell>{worker.role || 'Worker'}</TableCell>
                    <TableCell>{worker.nationaliy || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {worker.transferDestination || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleAssignClick(worker)}
                      >
                        Assign Room <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog - Professional Design */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Assign Worker to Room</DialogTitle>
            <DialogDescription className="text-base">
              Complete the transfer process for <span className="font-semibold text-foreground">{selectedWorker?.name}</span> ({selectedWorker?.employeeId})
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-6 py-6">
            {/* Left Column - Worker Info */}
            <div className="col-span-1 space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Worker Details</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium">{selectedWorker?.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Employee ID</div>
                    <div className="font-medium">{selectedWorker?.employeeId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Nationality</div>
                    <div className="font-medium">{selectedWorker?.nationaliy || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Role</div>
                    <div className="font-medium">{selectedWorker?.role || 'Worker'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Destination City</div>
                    <Badge variant="outline" className="mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedWorker?.transferDestination}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Assignment Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Check-in Date</Label>
                    <Input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Check-in Type</Label>
                    <Select value={checkInType} onValueChange={setCheckInType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transfer">Transfer from Another Location</SelectItem>
                        <SelectItem value="New Recruitment">New Recruitment</SelectItem>
                        <SelectItem value="Return from Leave">Return from Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Location Selection (2 columns) */}
            <div className="col-span-2 space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  Select Accommodation
                </h3>

                <div className="space-y-4">
                  {/* Residence Grid */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Residence</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {destinationResidences.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedResidenceId(r.id);
                            setSelectedBuildingId('');
                            setSelectedFloorId('');
                            setSelectedRoomId('');
                          }}
                          className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                            selectedResidenceId === r.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border bg-background'
                          }`}
                        >
                          <div className="font-semibold text-sm">{r.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{r.city}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Building Selection */}
                  {buildings.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Building</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {buildings.map(b => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setSelectedFloorId('');
                              setSelectedRoomId('');
                            }}
                            className={`cursor-pointer rounded-md border p-2 text-center transition-all hover:border-primary/50 ${
                              selectedBuildingId === b.id 
                                ? 'border-primary bg-primary/10 font-semibold' 
                                : 'border-border'
                            }`}
                          >
                            <div className="text-sm">{b.name || b.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floor Selection */}
                  {floors.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Floor</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {floors.map(f => (
                          <div
                            key={f.id}
                            onClick={() => {
                              setSelectedFloorId(f.id);
                              setSelectedRoomId('');
                            }}
                            className={`cursor-pointer rounded-md border p-2 text-center transition-all hover:border-primary/50 ${
                              selectedFloorId === f.id 
                                ? 'border-primary bg-primary/10 font-semibold' 
                                : 'border-border'
                            }`}
                          >
                            <div className="text-sm">{f.name || f.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Room Grid */}
                  {rooms.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Room (Select Available Room)</Label>
                      <div className="grid grid-cols-5 gap-2 max-h-[240px] overflow-y-auto p-1">
                        {rooms.map(room => {
                          const isSelected = selectedRoomId === room.id;
                          const capacity = room.capacity || 0;
                          const occupied = roomOccupancy[room.id] || 0;
                          const available = capacity - occupied;
                          const isFull = available <= 0;
                          
                          return (
                            <div
                              key={room.id}
                              onClick={() => !isFull && setSelectedRoomId(room.id)}
                              className={`cursor-pointer rounded-md border p-3 text-center transition-all ${
                                isFull 
                                  ? 'border-border bg-muted/50 cursor-not-allowed opacity-50' 
                                  : isSelected
                                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50 hover:shadow'
                              }`}
                            >
                              <div className={`text-sm font-semibold ${isSelected ? 'text-primary' : ''}`}>
                                {room.name || room.id}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {available > 0 ? (
                                  <span className="text-green-600 dark:text-green-400">
                                    {available} available
                                  </span>
                                ) : (
                                  <span className="text-red-600 dark:text-red-400">Full</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignConfirm}
              disabled={!selectedResidenceId || !selectedRoomId}
              className="min-w-[180px]"
            >
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
