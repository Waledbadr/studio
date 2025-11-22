"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccommodation } from "@/context/accommodation-context";
import { useResidences } from "@/context/residences-context";
import { useUsers } from "@/context/users-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Users, Building, Home, ArrowRight, CheckCircle2, 
  XCircle, Trash2, ArrowRightLeft, LogOut, Filter, RefreshCw, CloudCog, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddWorkerDialog } from "./add-worker-dialog";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function AccommodationManager() {
  // const { residences } = useResidences(); // Use residences from AccommodationContext for better type support
  const { 
    residences,
    workers, 
    occupants, 
    findWorkerAsync, 
    bulkCheckIn, 
    bulkCheckOut, 
    bulkTransfer,
    deleteWorker,
    fetchOccupantsForFloor,
    getWorkersByIds,
    checkWorkerOccupancy, // NEW
    checkOutWorkerEnhanced,
    manualSyncFromFirestore
  } = useAccommodation();
  const { toast } = useToast();
  const { currentUser } = useUsers();

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await manualSyncFromFirestore();
      toast({ title: "Synced", description: "Data synchronized with database" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter Residences
  const accessibleResidences = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return residences;
    // Filter by assignedResidences array
    return residences.filter(r => currentUser.assignedResidences?.includes(r.id));
  }, [residences, currentUser]);

  // Global State
  const [activeTab, setActiveTab] = useState("assign");
  
  // Sticky Fields for Check-in
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkInType, setCheckInType] = useState<string>("New Recruitment");
  
  // Selection State
  const [selectedResidenceId, setSelectedResidenceId] = useState<string>("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Worker Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<any[]>([]); // Store full worker objects
  const [roomOccupantDetails, setRoomOccupantDetails] = useState<any[]>([]); // Store details of workers in selected room
  const [searchOccupancies, setSearchOccupancies] = useState<Record<string, any>>({}); // Store occupancy status for search results

  // Manage Tab State
  const [manageDate, setManageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manageReason, setManageReason] = useState<string>("End of Contract");
  const [manageSearchQuery, setManageSearchQuery] = useState("");
  const [manageSearchResults, setManageSearchResults] = useState<any[]>([]);
  const [isManageSearching, setIsManageSearching] = useState(false);
  
  // Derived State
  const selectedResidence = accessibleResidences.find(r => r.id === selectedResidenceId);
  const buildings = selectedResidence?.buildings || [];
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const floors = selectedBuilding?.floors || [];
  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  
  // Handle direct rooms (no buildings/floors)
  const rooms = selectedFloor?.rooms || (buildings.length === 0 ? selectedResidence?.rooms || [] : []);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Initialize selection
  useEffect(() => {
    if (accessibleResidences.length > 0 && !selectedResidenceId) {
      setSelectedResidenceId(accessibleResidences[0].id);
    }
  }, [accessibleResidences]);

  // Fetch occupants when floor is selected (Optimization)
  useEffect(() => {
    if (selectedResidenceId) {
      if (selectedFloorId) {
        fetchOccupantsForFloor(selectedResidenceId, selectedFloorId);
      } else if (buildings.length === 0) {
        // If residence has no buildings (direct rooms), fetch all occupants for residence
        fetchOccupantsForFloor(selectedResidenceId, undefined);
      }
    }
  }, [selectedResidenceId, selectedFloorId, fetchOccupantsForFloor, buildings.length]);

  // Fetch worker details for room occupants when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      const roomOccupants = occupants.filter(o => o.roomId === selectedRoomId);
      const workerIds = roomOccupants.map(o => o.workerId);
      if (workerIds.length > 0) {
        getWorkersByIds(workerIds)
          .then(details => setRoomOccupantDetails(details))
          .catch(console.error);
      } else {
        setRoomOccupantDetails([]);
      }
    } else {
      setRoomOccupantDetails([]);
    }
  }, [selectedRoomId, occupants, getWorkersByIds]);

  // Search Logic
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchOccupancies({});
    try {
      // Always use Async search to avoid loading all workers
      const results = await findWorkerAsync(query);
      setSearchResults(results);

      // Check occupancy for results
      const occs: Record<string, any> = {};
      // Use sequential loop to avoid potential race conditions or overload
      for (const w of results) {
        if (!w.id) continue;
        try {
          const occ = await checkWorkerOccupancy(w.id);
          if (occ) occs[w.id] = occ;
        } catch (e) { 
          console.error(`Failed to check occupancy for ${w.id}`, e); 
        }
      }
      setSearchOccupancies(occs);

    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [findWorkerAsync, checkWorkerOccupancy]);

  // Manage Search Logic
  const handleManageSearch = useCallback(async (query: string) => {
    setManageSearchQuery(query);
    if (!query.trim()) {
      setManageSearchResults([]);
      return;
    }

    setIsManageSearching(true);
    try {
      const results = await findWorkerAsync(query);
      
      // Check occupancy for results to know where they are
      const resultsWithOccupancy = [];
      for (const w of results) {
         try {
           const occ = await checkWorkerOccupancy(w.id);
           if (occ) {
               resultsWithOccupancy.push({ ...w, occupancy: occ });
           }
         } catch (e) {
           console.error(e);
         }
      }
      setManageSearchResults(resultsWithOccupancy);

    } catch (error) {
      console.error("Manage search error:", error);
    } finally {
      setIsManageSearching(false);
    }
  }, [findWorkerAsync, checkWorkerOccupancy]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Toggle Worker Selection
  const toggleWorkerSelection = (worker: any) => {
    const workerId = worker.id;
    
    setSelectedWorkerIds(prev => {
      const isSelected = prev.includes(workerId);
      if (isSelected) {
        // Remove
        setSelectedWorkers(curr => curr.filter(w => w.id !== workerId));
        return prev.filter(id => id !== workerId);
      } else {
        // Add - Prevent duplicates
        setSelectedWorkers(curr => {
          if (curr.some(w => w.id === workerId)) return curr;
          return [...curr, worker];
        });
        return [...prev, workerId];
      }
    });
  };

  // Actions
  const handleAssign = async () => {
    if (!selectedResidenceId || !selectedRoomId || selectedWorkerIds.length === 0) {
      toast({ title: "Error", description: "Please select workers and a room", variant: "destructive" });
      return;
    }

    try {
      const result = await bulkCheckIn({
        workerIds: selectedWorkerIds,
        residenceId: selectedResidenceId,
        buildingId: selectedBuildingId,
        floorId: selectedFloorId,
        roomId: selectedRoomId,
        checkInDate: new Date(checkInDate).toISOString(),
        notes: checkInType,
        performedBy: currentUser?.id || "Admin",
        emergencyMode: false
      });

      // Analyze results
      const successfulIds = Object.keys(result.results).filter(id => result.results[id].success);
      const failures = Object.values(result.results).filter((r: any) => !r.success);

      if (successfulIds.length > 0) {
        // Clear successful selections
        const newSelectedIds = selectedWorkerIds.filter(id => !successfulIds.includes(id));
        setSelectedWorkerIds(newSelectedIds);
        setSelectedWorkers(prev => prev.filter(w => newSelectedIds.includes(w.id)));
      }

      if (failures.length > 0) {
        // Show detailed error for failures
        // We take unique error messages
        const uniqueErrors = Array.from(new Set(failures.map(f => f.error).filter(Boolean)));
        toast({ 
          title: "Assignment Issues", 
          description: `Failed to assign ${failures.length} workers. Reasons: ${uniqueErrors.join(", ")}`, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Assignment failed", variant: "destructive" });
    }
  };

  // Data Health Check
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const checkDuplicates = () => {
    if (!workers || workers.length === 0) {
      toast({ title: "No Data", description: "Workers list is empty (Optimization Mode). Cannot check for duplicates locally.", variant: "destructive" });
      return;
    }

    const map = new Map<string, any[]>();
    workers.forEach(w => {
      // Key by ID Number (Iqama) or Employee ID
      const key = w.idNumber || w.employeeId;
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(w);
      }
    });

    const dups: any[] = [];
    map.forEach((list, key) => {
      if (list.length > 1) {
        dups.push({ key, items: list });
      }
    });

    setDuplicates(dups);
    setDuplicateDialog(true);
  };

  const handleDeleteDuplicate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    await deleteWorker(id);
    toast({ title: "Deleted", description: "Worker deleted successfully" });
    
    setDuplicates(prev => {
      const newDuplicates = prev.map(group => ({
        ...group,
        items: group.items.filter((i: any) => i.id !== id)
      })).filter(group => group.items.length > 1);
      
      if (newDuplicates.length === 0) {
        setDuplicateDialog(false);
      }
      return newDuplicates;
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold">Accommodation Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} title="Sync from Database">
            <CloudCog className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Button variant="outline" onClick={checkDuplicates} title="Check for duplicates">
            <RefreshCw className="h-4 w-4 mr-2" /> Data Health
          </Button>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">Assign (Check-In)</TabsTrigger>
              <TabsTrigger value="manage">Manage (Out/Transfer)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Dialog open={duplicateDialog} onOpenChange={setDuplicateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Duplicate Data Check</DialogTitle>
            <DialogDescription>
              Found {duplicates.length} sets of potential duplicates based on ID/Iqama.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            {duplicates.map((group, idx) => (
              <div key={idx} className="mb-4 p-4 border rounded bg-muted/20">
                <div className="font-bold mb-2">Key: {group.key}</div>
                {group.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm p-2 border-b last:border-0">
                    <div>
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-muted-foreground ml-2">({item.id})</span>
                      <div className="text-xs text-muted-foreground">
                        {item.company}
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteDuplicate(item.id)}
                      title="Delete this worker"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="mt-2 text-xs text-red-500">
                  * Please manually delete duplicates from Firestore or use the Import tool with "Merge" enabled.
                </div>
              </div>
            ))}
            {duplicates.length === 0 && (
              <div className="text-center py-10 text-green-600">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
                No duplicates found in currently loaded data.
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {activeTab === "assign" && (
        <div className="grid grid-cols-12 gap-4 h-full overflow-hidden min-h-0">
          {/* Left Panel: Worker Selection */}
          <Card className="col-span-3 flex flex-col h-full min-h-0">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base flex justify-between items-center">
                Workers
                <Badge variant="secondary" className="text-xs">{selectedWorkerIds.length}</Badge>
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      const topResult = searchResults[0];
                      // Only add if not already selected
                      if (!selectedWorkerIds.includes(topResult.id)) {
                        toggleWorkerSelection(topResult);
                      }
                      setSearchQuery('');
                      setSearchResults([]);
                    }
                  }}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-2">
                {/* Selected Workers List */}
                {selectedWorkers.length > 0 && (
                  <div 
                    className="mb-4 border-b pb-2 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({ workerIds: selectedWorkerIds }));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 flex justify-between">
                      <span>Selected ({selectedWorkers.length})</span>
                      <span className="text-[10px] opacity-50">Drag to room</span>
                    </div>
                    <div className="space-y-1">
                      {selectedWorkers.map(worker => (
                        <div 
                          key={worker.id} 
                          className="flex items-start gap-2 p-2 rounded border bg-primary/10 border-primary text-sm"
                        >
                          <Checkbox 
                            checked={true}
                            onCheckedChange={() => toggleWorkerSelection(worker)}
                            className="mt-0.5 h-3 w-3"
                          />
                          <div className="overflow-hidden flex-1">
                            <div className="font-medium truncate">{worker.name}</div>
                            <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                              <span className="truncate">{worker.role || 'Worker'}</span>
                              <span>•</span>
                              <span className="truncate">{worker.nationaliy || 'Unknown'}</span>
                              <span>•</span>
                              <span className="truncate">{worker.company || '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isSearching ? (
                  <div className="text-center py-4 text-xs">Searching...</div>
                ) : (searchResults || []).filter(w => !selectedWorkerIds.includes(w.id)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-xs text-muted-foreground gap-3">
                    {searchQuery ? (
                      <>
                        <span>No workers found matching "{searchQuery}"</span>
                        <AddWorkerDialog 
                          defaultName={searchQuery} 
                          onWorkerAdded={(newWorker) => {
                            toggleWorkerSelection(newWorker);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          trigger={
                            <Button size="sm" className="h-8">
                              <UserPlus className="h-3.5 w-3.5 mr-2" />
                              Add "{searchQuery}"
                            </Button>
                          }
                        />
                      </>
                    ) : (
                      "Type to search for workers"
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.filter(w => !selectedWorkerIds.includes(w.id)).map(worker => {
                      const occupancy = searchOccupancies[worker.id];
                      const isOccupied = !!occupancy;
                      const canManageOccupancy = isOccupied && (
                        currentUser?.role === 'Admin' || 
                        (occupancy.residenceId && currentUser?.assignedResidences?.includes(occupancy.residenceId))
                      );
                      
                      return (
                      <div 
                        key={worker.id} 
                        className={`flex flex-col p-2 rounded border cursor-pointer transition-colors text-sm hover:bg-muted`}
                        onClick={() => toggleWorkerSelection(worker)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox 
                            checked={false}
                            onCheckedChange={() => toggleWorkerSelection(worker)}
                            className="mt-0.5 h-3 w-3"
                          />
                          <div className="overflow-hidden flex-1">
                            <div className="font-medium truncate">{worker.name}</div>
                            <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                              <span className="truncate">{worker.company || 'No Company'}</span>
                              <span>•</span>
                              <span className="truncate">{worker.nationaliy || 'Unknown'}</span>
                              <span>•</span>
                              <span className="truncate">{worker.role || 'Worker'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {isOccupied && (
                          <div className="mt-2 ml-5 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800" onClick={e => e.stopPropagation()}>
                            <div className="font-semibold mb-1 flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              Already in Room
                            </div>
                            <div className="mb-2 opacity-80">
                              Worker is currently assigned to a room.
                            </div>
                            {canManageOccupancy ? (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  className="h-6 text-[10px]"
                                  onClick={async () => {
                                    if (confirm('Check out this worker?')) {
                                      await checkOutWorkerEnhanced({
                                        workerId: worker.id,
                                        performedBy: currentUser?.id || 'Admin',
                                        reason: 'Quick Action'
                                      });
                                      toast({ title: "Checked Out", description: "Worker removed from room" });
                                      // Refresh search to update status
                                      handleSearch(searchQuery);
                                    }
                                  }}
                                >
                                  Check Out
                                </Button>
                              </div>
                            ) : (
                              <div className="text-[10px] text-red-600 font-semibold">
                                You do not have permission to manage this residence.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Middle Panel: Room Grid */}
          <Card className="col-span-6 flex flex-col h-full min-h-0">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base flex justify-between items-center">
                Rooms
                {accessibleResidences.length === 0 && (
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="h-6 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" /> Reload
                  </Button>
                )}
              </CardTitle>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Select value={selectedResidenceId} onValueChange={setSelectedResidenceId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Residence" /></SelectTrigger>
                  <SelectContent>{accessibleResidences.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId} disabled={!buildings.length}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Building" /></SelectTrigger>
                  <SelectContent>{buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!floors.length}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Floor" /></SelectTrigger>
                  <SelectContent>{floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 bg-muted/10">
              <ScrollArea className="h-full p-2">
                {rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    <Building className="h-8 w-8 mb-2 opacity-20" />
                    {buildings.length > 0 && !selectedFloorId 
                      ? "Select a floor to view rooms" 
                      : "No rooms found in this location"}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rooms.map(room => {
                      const roomOccupants = occupants.filter(o => o.roomId === room.id);
                      const isSelected = selectedRoomId === room.id;
                      
                      // Calculate Capacity & Slots
                      const capacity = room.capacity || 4;
                      const slots = Array(capacity).fill(null).map(() => ({ status: 'empty', occupant: null as any, isGhost: false }));
                      
                      let currentSlot = 0;
                      roomOccupants.forEach(occ => {
                        if (currentSlot >= capacity) return;
                        
                        const worker = workers.find(w => w.id === occ.workerId);
                        const role = worker?.role || 'Worker';
                        
                        // Determine weight
                        let weight = 1;
                        if (role === 'Supervisor') weight = 2;
                        if (role === 'Engineer') weight = capacity; // Takes whole room
                        
                        // Fill primary slot
                        slots[currentSlot] = { status: 'occupied', occupant: worker, isGhost: false };
                        currentSlot++;
                        
                        // Fill ghost slots
                        for (let i = 1; i < weight; i++) {
                          if (currentSlot < capacity) {
                            slots[currentSlot] = { status: 'occupied', occupant: worker, isGhost: true };
                            currentSlot++;
                          }
                        }
                      });

                      const isFull = currentSlot >= capacity;
                      
                      return (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData("application/json");
                            if (!data) return;
                            try {
                              const { workerIds } = JSON.parse(data);
                              if (!workerIds || workerIds.length === 0) return;
                              
                              const result = await bulkCheckIn({
                                workerIds,
                                residenceId: selectedResidenceId,
                                buildingId: selectedBuildingId,
                                floorId: selectedFloorId,
                                roomId: room.id,
                                performedBy: currentUser?.id || 'Admin',
                                checkInDate: new Date(checkInDate).toISOString(),
                                notes: checkInType // Pass type as notes for now, or update context to support type
                              });

                              if (result.ok) {
                                // Remove successfully assigned workers from selection
                                const successfulIds = result.results ? Object.keys(result.results).filter(id => result.results[id].success) : [];
                                const failures = result.results ? Object.values(result.results).filter((r: any) => !r.success) : [];
                                
                                const newSelectedIds = selectedWorkerIds.filter(id => !successfulIds.includes(id));
                                setSelectedWorkerIds(newSelectedIds);
                                setSelectedWorkers(prev => prev.filter(w => newSelectedIds.includes(w.id)));
                                
                                if (successfulIds.length > 0) {
                                  toast({ title: "Assigned", description: `Moved ${successfulIds.length} workers to ${room.name}` });
                                }

                                if (failures.length > 0) {
                                  const uniqueErrors = Array.from(new Set(failures.map((f: any) => f.error).filter(Boolean)));
                                  toast({ 
                                    title: "Assignment Issues", 
                                    description: `Failed to assign ${failures.length} workers. Reasons: ${uniqueErrors.join(", ")}`, 
                                    variant: "destructive" 
                                  });
                                }
                              } else {
                                // Handle complete failure
                                const failures = result.results ? Object.values(result.results).filter((r: any) => !r.success) : [];
                                if (failures.length > 0) {
                                  const uniqueErrors = Array.from(new Set(failures.map((f: any) => f.error).filter(Boolean)));
                                  toast({ 
                                    title: "Assignment Failed", 
                                    description: `Reasons: ${uniqueErrors.join(", ")}`, 
                                    variant: "destructive" 
                                  });
                                }
                              }
                            } catch (err) {
                              console.error("Drop failed", err);
                            }
                          }}
                          className={`
                            relative p-2 rounded-lg border cursor-pointer transition-all
                            ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}
                            ${isFull ? "opacity-90" : ""}
                          `}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-semibold text-sm truncate" title={room.name}>{room.name}</div>
                            <Badge variant={isFull ? "destructive" : "secondary"} className="text-[10px] h-4 px-1">
                              {roomOccupants.length}/{capacity}
                            </Badge>
                          </div>
                          
                          {/* Occupants Visualization */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {slots.map((slot, i) => (
                              <div 
                                key={i} 
                                className={`h-2 w-2 rounded-full border ${
                                  slot.status === 'occupied' 
                                    ? (slot.isGhost ? 'bg-primary/30 border-primary/30' : 'bg-primary border-primary') 
                                    : 'bg-muted border-muted-foreground/20'
                                }`}
                                title={slot.status === 'occupied' ? (slot.isGhost ? `Space for ${slot.occupant?.name}` : slot.occupant?.name) : 'Empty'}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel: Room Details & Actions */}
          <Card className="col-span-3 flex flex-col h-full border-l shadow-none rounded-none min-h-0">
            <CardHeader className="pb-2 px-4 pt-4 bg-muted/10">
              <CardTitle className="text-base">Room Details</CardTitle>
              {selectedRoom ? (
                <div className="text-xs text-muted-foreground">
                  {selectedRoom.name} ({selectedRoom.roomType || 'Standard'})
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No room selected</div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedRoom ? (
                  <>
                    <div className="p-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Occupants
                    </div>
                    <ScrollArea className="flex-1 p-2">
                      {occupants.filter(o => o.roomId === selectedRoomId).length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                          Room is empty
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {occupants.filter(o => o.roomId === selectedRoomId).map(occ => {
                            // Try to find worker name from loaded details, then search results, then fallback
                            const worker = roomOccupantDetails.find(w => w.id === occ.workerId) || 
                                           workers.find(w => w.id === occ.workerId);
                            
                            return (
                              <div key={occ.id || occ.workerId} className="flex justify-between items-center p-2 rounded border bg-card text-sm group">
                                <div className="overflow-hidden">
                                  <div className="font-medium truncate">{worker?.name || 'Loading...'}</div>
                                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                                    <span className="truncate">{worker?.role || 'Worker'}</span>
                                    <span>•</span>
                                    <span className="truncate">{worker?.nationaliy || 'Unknown'}</span>
                                  </div>
                                  <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                                    <span>{new Date(occ.since).toLocaleDateString()}</span>
                                    {occ.notes && (
                                        <>
                                            <span>•</span>
                                            <span className="truncate max-w-[100px]" title={occ.notes}>{occ.notes}</span>
                                        </>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Check Out"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if(confirm('Check out this worker?')) {
                                      await bulkCheckOut({
                                        workerIds: [occ.workerId],
                                        performedBy: currentUser?.id || 'Admin',
                                        checkOutDate: new Date().toISOString()
                                      });
                                      toast({ title: "Checked Out", description: "Worker removed" });
                                    }
                                  }}
                                >
                                  <LogOut className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                    <Home className="h-8 w-8 mb-2 opacity-20" />
                    Select a room from the grid to view details and assign workers.
                  </div>
                )}
              </div>
                  
              <div className="p-4 border-t bg-background mt-auto space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Check-in Date</label>
                    <Input 
                      type="date" 
                      className="h-7 text-xs" 
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Type</label>
                    <Select value={checkInType} onValueChange={setCheckInType}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New Recruitment">New Recruitment</SelectItem>
                        <SelectItem value="Return from Leave">Return from Leave</SelectItem>
                        <SelectItem value="Another Accommodation">Another Accommodation</SelectItem>
                        <SelectItem value="Outside Accommodation">Outside Accommodation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleAssign} 
                  disabled={!selectedRoom || selectedWorkerIds.length === 0}
                >
                  Assign {selectedWorkerIds.length > 0 ? `(${selectedWorkerIds.length})` : ''}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "manage" && (
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {/* Manage Search Bar */}
          <Card className="shrink-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for occupied workers to manage..."
                  value={manageSearchQuery}
                  onChange={(e) => handleManageSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {manageSearchResults.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Found {manageSearchResults.length} occupied workers
                </div>
              )}
            </CardContent>
            {manageSearchResults.length > 0 && (
              <div className="border-t max-h-[200px] overflow-y-auto p-2 bg-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {manageSearchResults.map(worker => {
                    // Resolve Residence Name
                    const res = residences.find(r => r.id === worker.occupancy?.residenceId);
                    const resName = res?.name || worker.occupancy?.residenceId || "Unknown Residence";
                    
                    // Resolve Room Name
                    let roomName = worker.occupancy?.roomId;
                    if (res) {
                        if (res.rooms) {
                            const r = res.rooms.find((r: any) => r.id === worker.occupancy?.roomId);
                            if (r) roomName = r.name;
                        }
                        if (res.buildings && roomName === worker.occupancy?.roomId) {
                            for (const b of res.buildings) {
                                if (b.floors) {
                                    for (const f of b.floors) {
                                        if (f.rooms) {
                                            const r = f.rooms.find((r: any) => r.id === worker.occupancy?.roomId);
                                            if (r) { roomName = r.name; break; }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return (
                    <div 
                      key={worker.id} 
                      className="flex items-center justify-between p-2 rounded border bg-card hover:bg-accent cursor-pointer group"
                      onClick={() => {
                        // Navigate to this worker's room
                        if (worker.occupancy) {
                          setSelectedResidenceId(worker.occupancy.residenceId);
                          if (worker.occupancy.buildingId) setSelectedBuildingId(worker.occupancy.buildingId);
                          if (worker.occupancy.floorId) setSelectedFloorId(worker.occupancy.floorId);
                          setSelectedRoomId(worker.occupancy.roomId);
                          
                          if (!selectedWorkerIds.includes(worker.id)) {
                            toggleWorkerSelection(worker);
                          }
                          
                          setManageSearchQuery(""); 
                          setManageSearchResults([]);
                        }
                      }}
                    >
                      <div className="overflow-hidden flex-1">
                        <div className="font-medium truncate flex items-center gap-2">
                            {worker.name}
                            <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal text-muted-foreground">
                                {worker.employeeId || worker.idNumber || 'No ID'}
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          <span title={resName}>{resName}</span>
                          <span className="mx-1 opacity-50">/</span>
                          <Home className="h-3 w-3" />
                          <span title={roomName}>{roomName}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex gap-2">
                            {worker.company && <span>{worker.company}</span>}
                            {worker.nationaliy && <span>• {worker.nationaliy}</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );})}
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden min-h-0">
          {/* Left Panel: Room Navigation */}
          <Card className="col-span-4 flex flex-col h-full">
            <CardHeader>
              <CardTitle>Select Room</CardTitle>
              <div className="space-y-2">
                <Select value={selectedResidenceId} onValueChange={setSelectedResidenceId}>
                  <SelectTrigger><SelectValue placeholder="Select Residence" /></SelectTrigger>
                  <SelectContent>{accessibleResidences.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId} disabled={!buildings.length}>
                  <SelectTrigger><SelectValue placeholder="Building" /></SelectTrigger>
                  <SelectContent>{buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!floors.length}>
                  <SelectTrigger><SelectValue placeholder="Floor" /></SelectTrigger>
                  <SelectContent>{floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-1">
                  {rooms.map(room => {
                    const count = occupants.filter(o => o.roomId === room.id).length;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`flex justify-between items-center p-3 rounded-md cursor-pointer ${
                          selectedRoomId === room.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <span>{room.name}</span>
                        <Badge variant="secondary" className="bg-background/20 text-inherit">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel: Occupants & Actions */}
          <Card className="col-span-8 flex flex-col h-full">
            <CardHeader className="flex flex-col gap-4 border-b bg-muted/10 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Room Occupants</CardTitle>
                  <CardDescription>
                    {selectedRoom ? `${selectedRoom.name} - Select occupants to manage` : "Select a room to view occupants"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    disabled={selectedWorkerIds.length === 0}
                    onClick={async () => {
                      if (confirm(`Check out ${selectedWorkerIds.length} workers on ${manageDate}?`)) {
                        await bulkCheckOut({
                          workerIds: selectedWorkerIds,
                          performedBy: currentUser?.id || "Admin",
                          checkOutDate: new Date(manageDate).toISOString(),
                          reason: manageReason
                        });
                        setSelectedWorkerIds([]);
                        toast({ title: "Checked Out", description: "Workers removed from room" });
                      }
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Check Out ({selectedWorkerIds.length})
                  </Button>
                </div>
              </div>
              
              {/* Action Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Action Date</label>
                  <Input 
                    type="date" 
                    value={manageDate}
                    onChange={(e) => setManageDate(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Reason / Notes</label>
                  <Select value={manageReason} onValueChange={setManageReason}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select Reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="End of Contract">End of Contract</SelectItem>
                      <SelectItem value="Resignation">Resignation</SelectItem>
                      <SelectItem value="Termination">Termination</SelectItem>
                      <SelectItem value="Transfer">Transfer (Internal)</SelectItem>
                      <SelectItem value="Vacation">Vacation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                {!selectedRoomId ? (
                  <div className="text-center py-10 text-muted-foreground">Select a room to view occupants</div>
                ) : occupants.filter(o => o.roomId === selectedRoomId).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">Room is empty</div>
                ) : (
                  <div className="space-y-2">
                    {occupants.filter(o => o.roomId === selectedRoomId).map(occ => {
                      // We need to find the worker details. 
                      // Since workers list might not be fully loaded, we might only have ID.
                      // In a real app, we'd fetch details or rely on what we have.
                      // For now, we assume workers are loaded or we show ID.
                      const worker = workers.find(w => w.id === occ.workerId);
                      return (
                        <div 
                          key={occ.workerId}
                          className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                            selectedWorkerIds.includes(occ.workerId) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox 
                            checked={selectedWorkerIds.includes(occ.workerId)}
                            onCheckedChange={() => toggleWorkerSelection(occ.workerId)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold truncate" title={worker?.name}>{worker?.name || "Unknown Worker"}</div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(worker?.employeeId || worker?.idNumber) && (
                                            <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal bg-background">
                                                {worker?.employeeId ? `Emp: ${worker.employeeId}` : `ID: ${worker?.idNumber}`}
                                            </Badge>
                                        )}
                                        {worker?.role && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1 font-normal">
                                                {worker.role}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Since</div>
                                    <div className="text-sm font-medium">{new Date(occ.since).toLocaleDateString()}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                                {worker?.company && (
                                    <div className="flex items-center gap-1.5 truncate" title={worker.company}>
                                        <Building className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span className="truncate">{worker.company}</span>
                                    </div>
                                )}
                                {worker?.nationaliy && (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Users className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span>{worker.nationaliy}</span>
                                    </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        </div>
      )}
    </div>
  );
}
