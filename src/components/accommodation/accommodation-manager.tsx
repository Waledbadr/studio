"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccommodation } from "@/context/accommodation-context";
import { useResidences } from "@/context/residences-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Users, Building, Home, ArrowRight, CheckCircle2, 
  XCircle, Trash2, ArrowRightLeft, LogOut, Filter, RefreshCw
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
    checkOutWorkerEnhanced
  } = useAccommodation();
  const { toast } = useToast();

  // Auth & Role State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) setUserRole(userDoc.data().role);
          }
        } catch (e) { console.error(e); }
      } else {
        setCurrentUserId(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter Residences
  const accessibleResidences = React.useMemo(() => {
    if (!currentUserId) return residences;
    if (userRole === 'Admin') return residences;
    return residences.filter(r => !r.managerId || r.managerId === currentUserId);
  }, [residences, currentUserId, userRole]);

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

  // Derived State
  const selectedResidence = accessibleResidences.find(r => r.id === selectedResidenceId);
  const buildings = selectedResidence?.buildings || [];
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const floors = selectedBuilding?.floors || [];
  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const rooms = selectedFloor?.rooms || [];
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Initialize selection
  useEffect(() => {
    if (accessibleResidences.length > 0 && !selectedResidenceId) {
      setSelectedResidenceId(accessibleResidences[0].id);
    }
  }, [accessibleResidences]);

  // Fetch occupants when floor is selected (Optimization)
  useEffect(() => {
    if (selectedResidenceId && selectedFloorId) {
      fetchOccupantsForFloor(selectedResidenceId, selectedFloorId);
    }
  }, [selectedResidenceId, selectedFloorId, fetchOccupantsForFloor]);

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
        checkInDate: new Date().toISOString(),
        performedBy: "Admin" // TODO: Get actual user
      });

      // Analyze results
      const successfulIds = Object.keys(result.results).filter(id => result.results[id].success);
      const failures = Object.values(result.results).filter(r => !r.success);

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
                            <div className="flex gap-2 text-[10px] text-muted-foreground">
                              <span className="truncate">{worker.role || 'Worker'}</span>
                              <span>•</span>
                              <span className="truncate">{worker.nationaliy || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isSearching ? (
                  <div className="text-center py-4 text-xs">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    {searchQuery ? "No workers" : "Type to search"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map(worker => {
                      const occupancy = searchOccupancies[worker.id];
                      const isOccupied = !!occupancy;
                      
                      return (
                      <div 
                        key={worker.id} 
                        className={`flex flex-col p-2 rounded border cursor-pointer transition-colors text-sm ${
                          selectedWorkerIds.includes(worker.id) 
                            ? "bg-primary/10 border-primary" 
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleWorkerSelection(worker)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox 
                            checked={selectedWorkerIds.includes(worker.id)}
                            onCheckedChange={() => toggleWorkerSelection(worker)}
                            className="mt-0.5 h-3 w-3"
                          />
                          <div className="overflow-hidden flex-1">
                            <div className="font-medium truncate">{worker.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {worker.company}
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
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-6 text-[10px]"
                                onClick={async () => {
                                  if (confirm('Check out this worker?')) {
                                    await checkOutWorkerEnhanced({
                                      workerId: worker.id,
                                      performedBy: currentUserId || 'Admin',
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
                {!selectedFloorId ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    <Building className="h-8 w-8 mb-2 opacity-20" />
                    Select a floor to view rooms
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rooms.map(room => {
                      const roomOccupants = occupants.filter(o => o.roomId === room.id);
                      const isSelected = selectedRoomId === room.id;
                      const isFull = (room.capacity || 0) > 0 && roomOccupants.length >= (room.capacity || 0);
                      
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
                                performedBy: currentUserId || 'Admin',
                                checkInDate: new Date(checkInDate).toISOString(),
                                notes: checkInType // Pass type as notes for now, or update context to support type
                              });

                              if (result.ok) {
                                // Remove successfully assigned workers from selection
                                const successfulIds = result.results?.filter(r => r.status === 'success').map(r => r.workerId) || [];
                                const newSelectedIds = selectedWorkerIds.filter(id => !successfulIds.includes(id));
                                setSelectedWorkerIds(newSelectedIds);
                                setSelectedWorkers(prev => prev.filter(w => newSelectedIds.includes(w.id)));
                                toast({ title: "Assigned", description: `Moved ${successfulIds.length} workers to ${room.name}` });
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
                              {roomOccupants.length}/{room.capacity || '-'}
                            </Badge>
                          </div>
                          
                          {/* Occupants Preview - Mini Dots */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {roomOccupants.map((occ, i) => {
                              // Determine role color/size if needed, for now just standard
                              return <div key={i} className="h-2 w-2 rounded-full bg-primary/60" title="Occupied" />
                            })}
                            {(() => {
                              // Dynamic Capacity Visualization
                              // Calculate effective capacity based on occupants
                              let effectiveCapacity = room.capacity || 4;
                              
                              // Check if any occupant is Engineer or Supervisor
                              // We need worker details for this. 
                              // Since we don't have all worker details here easily without performance hit,
                              // we might need to rely on a heuristic or fetch.
                              // However, for visual feedback, we can try to use what we have.
                              
                              // Heuristic: If room has occupants, check if we have their details in 'workers' list
                              // This might be incomplete if workers list is partial.
                              // But 'workers' from context usually has loaded workers.
                              
                              const occupantsDetails = roomOccupants.map(o => workers.find(w => w.id === o.workerId)).filter(Boolean);
                              const hasEngineer = occupantsDetails.some(w => w?.role === 'Engineer');
                              const hasSupervisor = occupantsDetails.some(w => w?.role === 'Supervisor');
                              
                              if (hasEngineer) {
                                // Engineer takes 4 slots (16sqm vs 4sqm) -> Capacity reduces drastically
                                // If capacity is 6 (24sqm). Engineer uses 16. Remainder 8 = 2 slots.
                                // Total slots = 1 (Eng) + 2 (Workers) = 3.
                                // But user wants "shrink to 2 circles" if Engineer is there?
                                // User said: "shrink vacancy circles to only two circles"
                                // If 1 Engineer is there, and we show 2 empty circles. Total 3 circles.
                                // This matches the 1 Eng + 2 Workers calculation.
                                effectiveCapacity = 3; 
                              } else if (hasSupervisor) {
                                // Supervisor takes 2 slots (8sqm vs 4sqm).
                                // If capacity 6. Supervisor uses 8. Remainder 16 = 4 slots.
                                // Total slots = 1 (Sup) + 4 (Workers) = 5.
                                // User said: "shrink to 3".
                                // Maybe Supervisor takes 3 slots? (12sqm).
                                // Let's stick to user request: "shrink to 3" implies total capacity becomes ~4?
                                // If 1 Sup + 3 Empty = 4 total.
                                effectiveCapacity = 4; 
                              }

                              const vacancies = Math.max(0, effectiveCapacity - roomOccupants.length);
                              
                              return Array.from({ length: vacancies }).map((_, i) => (
                                <div key={`e-${i}`} className="h-2 w-2 rounded-full bg-muted border border-muted-foreground/20" title="Empty" />
                              ));
                            })()}
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
                                {/* ID removed as per request */}
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
                                      performedBy: 'Admin',
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
                      disabled={selectedWorkerIds.length === 0}
                    >
                      Assign {selectedWorkerIds.length > 0 ? `(${selectedWorkerIds.length})` : ''}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                  <Home className="h-8 w-8 mb-2 opacity-20" />
                  Select a room from the grid to view details and assign workers.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "manage" && (
        <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
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
            <CardHeader className="flex flex-row justify-between items-center">
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
                    if (confirm(`Check out ${selectedWorkerIds.length} workers?`)) {
                      await bulkCheckOut({
                        workerIds: selectedWorkerIds,
                        performedBy: "Admin",
                        checkOutDate: new Date().toISOString(),
                        reason: "Bulk Check-out"
                      });
                      setSelectedWorkerIds([]);
                      toast({ title: "Checked Out", description: "Workers removed from room" });
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Check Out
                </Button>
                {/* Transfer Button would go here - requires a dialog to select destination */}
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
                          className={`flex items-center gap-3 p-4 rounded-lg border ${
                            selectedWorkerIds.includes(occ.workerId) ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox 
                            checked={selectedWorkerIds.includes(occ.workerId)}
                            onCheckedChange={() => toggleWorkerSelection(occ.workerId)}
                          />
                          <div className="flex-1">
                            <div className="font-bold">{worker?.name || "Unknown Worker"}</div>
                            <div className="text-sm text-muted-foreground">ID: {occ.workerId}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Since: {new Date(occ.since).toLocaleDateString()}
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
      )}
    </div>
  );
}
