"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useResidences } from "@/context/residences-context";
import { useAccommodation } from "@/context/accommodation-context";
import { useToast } from "@/hooks/use-toast";
import { CreateTransferDialog } from "@/components/accommodation/create-transfer-dialog";
import { BatchOperationsDialog } from "@/components/accommodation/batch-operations-dialog";
import { ArrowRightLeft, Users, X, LogIn, LogOut, Repeat2, Calendar, BarChart3, Building, Building2, Layers3, DoorOpen } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AccommodationAssignPage() {
  const { residences, loadResidences } = useResidences();
  const { occupants, workers, checkOutWorkerEnhanced } = useAccommodation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Get current user ID and role from Firebase Auth and Firestore
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        
        // Fetch user role from Firestore
        try {
          if (!db) return;
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || null);
            console.log('👤 User role:', userData.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setCurrentUserId(null);
        setUserRole(null);
      }
    });

    return () => { try { unsubscribe(); } catch {} };
  }, []);
  
  // Filter residences based on user access
  const accessibleResidences = React.useMemo(() => {
    if (!currentUserId) return residences;
    
    // Admin can see all residences
    if (userRole === 'Admin') {
      console.log('✅ Admin user - showing all', residences.length, 'residences');
      return residences;
    }
    
    // Non-admin users see only their managed residences
    const filtered = residences.filter(r => 
      !r.managerId || // No manager assigned = accessible to all
      r.managerId === currentUserId // User is the manager
    );
    console.log('🔒 Non-admin user - showing', filtered.length, 'of', residences.length, 'residences');
    return filtered;
  }, [residences, currentUserId, userRole]);
  const [selectedResidence, setSelectedResidence] = useState<string | null>(residences?.[0]?.id || null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [filterNationality, setFilterNationality] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [roomDetailsDialogOpen, setRoomDetailsDialogOpen] = useState(false);
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<any>(null);
  const [assignDate, setAssignDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Pagination state (increased for faster loading)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // Increased from 50 for better UX
  
  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // NEW: Batch operations state
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchOperationType, setBatchOperationType] = useState<'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER'>('CHECK_IN');

  // Auto-select first accessible residence
  useEffect(() => {
    if (accessibleResidences && accessibleResidences.length > 0 && !selectedResidence) {
      setSelectedResidence(accessibleResidences[0].id);
      console.log('[AUTO-SELECT] First residence:', accessibleResidences[0].name);
    }
  }, [accessibleResidences, selectedResidence]);

  // Check if user is authenticated
  useEffect(() => {
    if (!currentUserId) {
      console.warn('[AUTH] User not authenticated - Firestore permissions may fail');
      toast({
        title: "Authentication Required",
        description: "Please sign in to access accommodation assignment",
        variant: "destructive"
      });
    } else {
      console.log('[AUTH] User authenticated:', currentUserId);
    }
  }, [currentUserId, toast]);

  // Load workers from context - NO API CALLS
  useEffect(() => {
    console.log('[WORKERS] Workers from context:', workers?.length || 0);
    if (workers && workers.length > 0) {
      setSearchResults(workers);
      console.log('[WORKERS] Successfully loaded', workers.length, 'workers from context');
    } else if (currentUserId) {
      console.warn('[WORKERS] No workers loaded yet. Waiting for context...');
    }
  }, [workers, currentUserId]);

  // Extract unique nationalities from workers (memoized & optimized)
  const availableNationalities = React.useMemo(() => {
    if (!workers || workers.length === 0) return [];
    const nationalities = new Set<string>();
    for (const w of workers) {
      if (w.nationaliy) nationalities.add(w.nationaliy);
    }
    return Array.from(nationalities).sort();
  }, [workers]);

  // Debounce search input - LOCAL SEARCH ONLY
  useEffect(() => {
    if (!workers || workers.length === 0) {
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      doSearch(searchInput);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchInput, workers]);

  // Memoized occupant count map for better performance
  const occupantCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    occupants.forEach(occ => {
      map.set(occ.roomId, (map.get(occ.roomId) || 0) + 1);
    });
    return map;
  }, [occupants]);

  // Get occupant count for a room (optimized)
  const getOccupantCount = useCallback((roomId: string) => {
    return occupantCountMap.get(roomId) || 0;
  }, [occupantCountMap]);

  // Get occupants in a specific room (memoized)
  const getRoomOccupants = useCallback((roomId: string) => {
    return occupants
      .filter(occ => occ.roomId === roomId)
      .map(occ => {
        const worker = workers.find(w => w.id === occ.workerId);
        return {
          ...occ,
          id: occ.workerId + '_' + occ.roomId,
          workerName: worker?.name || 'غير معروف',
          workerNationality: worker?.nationaliy || 'غير محدد',
          workerRole: worker?.role || 'Worker',
          employeeId: worker?.employeeId || '',
          assignedAt: occ.since,
        };
      });
  }, [occupants, workers]);

  // Handle room click to show details
  const handleRoomClick = (room: any) => {
    setSelectedRoomForDetails(room);
    setRoomDetailsDialogOpen(true);
  };

  // Handle remove worker from room - UPDATED to use enhanced checkout
  const handleRemoveWorker = async (workerId: string, workerName: string) => {
    try {
      // Get current user info (you may need to add this to your auth context)
      const currentUser = { name: 'User', id: 'current-user-id' }; // TODO: Get from auth context
      
      // Use the enhanced checkout function from context that saves history
      const result = await checkOutWorkerEnhanced({
        workerId,
        checkOutDate: new Date().toISOString(),
        reason: 'Manual check-out from room',
        notes: `${workerName} was checked out from the room`,
        performedBy: currentUser.name
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.error || 'Failed to check out',
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Check-out Successful",
        description: `${workerName} has been checked out and the record has been saved to history`
      });
      // Note: The occupants will be updated automatically by the Firestore listener in the context
      // This will trigger a re-render and the dialog will show updated data
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e?.message || 'An error occurred',
        variant: "destructive"
      });
    }
  };

  // Get available buildings for selected residence
  const availableBuildings = React.useMemo(() => {
    if (!selectedResidence) return [];
    const complex = residences.find((r) => r.id === selectedResidence);
    return complex?.buildings || [];
  }, [selectedResidence, residences]);

  // Get available floors for selected building
  const availableFloors = React.useMemo(() => {
    if (!selectedBuilding) return [];
    const building = availableBuildings.find((b) => b.id === selectedBuilding);
    return building?.floors || [];
  }, [selectedBuilding, availableBuildings]);

  // Get available rooms for selected floor
  const availableRooms = React.useMemo(() => {
    console.log('[ROOMS] ===== START FLOOR PROCESSING =====');
    
    if (!selectedFloor) {
      console.log('[ROOMS] No floor selected');
      return [];
    }
    
    console.log('[ROOMS] Selected Floor ID:', selectedFloor);
    console.log('[ROOMS] Available Floors Count:', availableFloors.length);
    console.log('[ROOMS] Available Floor IDs:', availableFloors.map(f => f.id));
    
    const floor = availableFloors.find((f) => f.id === selectedFloor);
    
    if (!floor) {
      console.error('[ROOMS] ERROR: Floor not found!');
      return [];
    }
    
    console.log('[ROOMS] Floor found:', floor.name);
    console.log('[ROOMS] Floor keys:', Object.keys(floor));
    console.log('[ROOMS] Has rooms property:', 'rooms' in floor);
    console.log('[ROOMS] Rooms type:', typeof floor.rooms);
    console.log('[ROOMS] Rooms is Array:', Array.isArray(floor.rooms));
    console.log('[ROOMS] Rooms length:', floor.rooms?.length || 0);
    
    const roomsList = floor?.rooms || [];
    
    if (roomsList.length === 0) {
      console.warn('[ROOMS] WARNING: No rooms found!');
      console.log('[ROOMS] Full floor object:', JSON.stringify(floor, null, 2));
    } else {
      console.log('[ROOMS] SUCCESS: Found', roomsList.length, 'rooms');
      console.log('[ROOMS] First room:', JSON.stringify(roomsList[0], null, 2));
    }
    
    console.log('[ROOMS] ===== END FLOOR PROCESSING =====');
    return roomsList;
  }, [selectedFloor, availableFloors]);

  // Update rooms when selection changes
  useEffect(() => {
    console.log('[STATE] Updating rooms state. availableRooms count:', availableRooms.length);
    console.log('[STATE] availableRooms data:', availableRooms);
    setRooms(availableRooms);
    
    // Auto-select first room only if we have rooms and no room is selected
    if (availableRooms.length > 0 && !selectedRoom) {
      console.log('[STATE] Auto-selecting first room:', availableRooms[0].id);
      setSelectedRoom(availableRooms[0].id);
    }
  }, [availableRooms]); // Removed selectedRoom from dependencies to avoid infinite loop

  // Reset cascading selections when parent changes
  useEffect(() => {
    setSelectedBuilding(null);
    setSelectedFloor(null);
    setRooms([]);
    setSelectedRoom(null);
  }, [selectedResidence]);

  useEffect(() => {
    setSelectedFloor(null);
    setRooms([]);
    setSelectedRoom(null);
  }, [selectedBuilding]);

  useEffect(() => {
    setRooms([]);
    setSelectedRoom(null);
  }, [selectedFloor]);

  // Optimized search function - runs locally only
  const doSearch = useCallback((q: string) => {
    setSearchQ(q);
    setCurrentPage(1);
    
    if (!workers || workers.length === 0) {
      setSearchResults([]);
      return;
    }
    
    if (!q || !q.trim()) {
      setSearchResults(workers);
      return;
    }

    const norm = q.trim().toLowerCase();
    const filtered = workers.filter((w: any) => 
      (w.name || '').toLowerCase().includes(norm) || 
      (w.nameEn || '').toLowerCase().includes(norm) || 
      (w.nameAr || '').includes(norm) ||
      (w.employeeId || '').toLowerCase().includes(norm) ||
      (w.nationaliy || '').toLowerCase().includes(norm) ||
      (w.role || '').toLowerCase().includes(norm) ||
      (w.idNumber || '').toLowerCase().includes(norm) ||
      (w.iqamaNumber || '').toLowerCase().includes(norm)
    );
    
    setSearchResults(filtered);
  }, [workers]);

  function toggleWorker(wid: string) {
    setSelectedWorkers(prev => prev.includes(wid) ? prev.filter(x => x !== wid) : [...prev, wid]);
  }

  // Filtered results with nationality filter (memoized)
  const filteredResults = React.useMemo(() => {
    if (!filterNationality) return searchResults;
    return searchResults.filter(s => 
      (s.nationaliy || '').toLowerCase().includes(filterNationality.toLowerCase())
    );
  }, [searchResults, filterNationality]);

  // Paginated results
  const paginatedResults = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  async function handleBulkAssign() {
    if (!selectedResidence || !selectedRoom || selectedWorkers.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار المسكن والغرفة والعمال",
        variant: "destructive"
      });
      return;
    }
    
    // Check if any selected worker is already assigned to a room
    const alreadyAssignedWorkers = selectedWorkers.filter(wid => 
      occupants.some(occ => occ.workerId === wid)
    );
    
    if (alreadyAssignedWorkers.length > 0) {
      const workerNames = alreadyAssignedWorkers
        .map(wid => workers.find(w => w.id === wid)?.name || wid)
        .join('، ');
      toast({
        title: "لا يمكن التسكين",
        description: `العمال التالية مسكّنة بالفعل: ${workerNames}`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerIds: selectedWorkers, residenceId: selectedResidence, roomId: selectedRoom }) });
      const data = await res.json();
      if (!data?.ok) {
        const errorMsg = data?.error || 'Assignment failed';
        toast({
          title: "Assignment Failed",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Assignment Successful",
        description: `Assigned ${data.count || selectedWorkers.length} worker(s)`,
      });
      setSelectedWorkers([]);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e?.message || 'An error occurred during assignment',
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  // simple DnD: drag worker id onto room element
  function onDragStart(e: React.DragEvent, id: string) { e.dataTransfer.setData('text/plain', id); }
  async function onDropToRoom(e: React.DragEvent, roomId: string) {
    e.preventDefault();
    const wid = e.dataTransfer.getData('text/plain');
    if (!wid || !selectedResidence) return;
    
    // Check if worker is already assigned
    const isAlreadyAssigned = occupants.some(occ => occ.workerId === wid);
    if (isAlreadyAssigned) {
      const workerName = workers.find((w: any) => w.id === wid)?.name || 'Worker';
      toast({
        title: "Cannot Assign",
        description: `${workerName} is already assigned to another room`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId: wid, residenceId: selectedResidence, roomId }) });
      const data = await res.json();
      if (!data?.ok) {
        const errorMsg = data?.error || 'Assignment failed';
        toast({
          title: "Assignment Failed",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }
      const workerName = workers.find((w: any) => w.id === wid)?.name || 'Worker';
      toast({
        title: "Assigned Successfully",
        description: `تم تسكين ${workerName} بنجاح`
      });
    } catch (e:any) {
      console.error(e);
      toast({
        title: "خطأ",
        description: e?.message || 'حدث خطأ أثناء التسكين',
        variant: "destructive"
      });
    } finally { setSubmitting(false); }
  }

  // Log render state for debugging
  console.log('[RENDER] ===== COMPONENT RENDER =====');
  console.log('[RENDER] selectedResidence:', selectedResidence);
  console.log('[RENDER] selectedBuilding:', selectedBuilding);
  console.log('[RENDER] selectedFloor:', selectedFloor);
  console.log('[RENDER] availableRooms.length:', availableRooms.length);
  console.log('[RENDER] rooms.length:', rooms.length);

  // Show authentication warning if user is not logged in
  if (!currentUserId) {
    return (
      <div className="space-y-4 p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <div className="text-destructive text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to access the Worker Accommodation Assignment page.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Worker Accommodation Assignment</h1>
        <div className="flex gap-3">
          <a 
            href="/accommodation/guide" 
            className="text-sm px-4 py-2 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 font-semibold flex items-center gap-2"
          >
            📚 User Guide
          </a>
          <a href="/accommodation/quick-add-workers" className="text-sm text-primary hover:underline">
            Add Workers
          </a>
        </div>
      </div>

      {/* Warning if no workers loaded */}
      {(!workers || workers.length === 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-yellow-600 dark:text-yellow-400 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">No Workers Data</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Unable to load workers from Firestore. This might be due to:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mt-1">
                <li>Firestore quota exceeded (check Console for errors)</li>
                <li>Network connectivity issues</li>
                <li>No workers have been added yet</li>
              </ul>
              <a 
                href="/accommodation/quick-add-workers" 
                className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:underline"
              >
                Add Workers →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <Button
          onClick={() => {
            setBatchOperationType('CHECK_IN');
            setBatchDialogOpen(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <LogIn className="h-4 w-4" />
          Batch Check-In
        </Button>

        <Button
          onClick={() => {
            setBatchOperationType('CHECK_OUT');
            setBatchDialogOpen(true);
          }}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Batch Check-Out
        </Button>

        <Button
          onClick={() => {
            setBatchOperationType('TRANSFER');
            setBatchDialogOpen(true);
          }}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Batch Transfer
        </Button>

        <Button
          onClick={() => setTransferDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Repeat2 className="h-4 w-4" />
          Transfer Request
        </Button>

        <Button
          onClick={() => window.location.href = '/accommodation/timeline-reports'}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Timeline Reports
        </Button>
      </div>
      
      {/* Dialogs */}
      <CreateTransferDialog 
        isOpen={transferDialogOpen} 
        onOpenChange={setTransferDialogOpen}
        preSelectedWorkers={selectedWorkers}
      />
      
      <BatchOperationsDialog
        isOpen={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        operationType={batchOperationType}
        preSelectedWorkers={selectedWorkers}
        targetResidenceId={selectedResidence || undefined}
        targetRoomId={selectedRoom || undefined}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 rounded-md border p-4 bg-card space-y-4">
          {/* Residence Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Residence</label>
            <select 
              className="border rounded px-3 py-2 w-full bg-background" 
              value={selectedResidence ?? ''} 
              onChange={(e) => setSelectedResidence(e.target.value)}
            >
              <option value="">-- Select Residence --</option>
              {accessibleResidences.map((r:any) => {
                const buildingCount = r.buildings?.length || 0;
                const totalRooms = (r.buildings || []).reduce((sum:number, b:any) => {
                  return sum + (b.floors || []).reduce((fsum:number, f:any) => fsum + (f.rooms?.length || 0), 0);
                }, 0);
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} ({buildingCount} buildings, {totalRooms} rooms)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Building Selection */}
          {selectedResidence && availableBuildings.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Building2 className="h-4 w-4" />
                Building
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableBuildings.map((b:any) => {
                  const isSelected = selectedBuilding === b.id;
                  const floorCount = b.floors?.length || 0;
                  const roomCount = (b.floors || []).reduce((sum:number, f:any) => sum + (f.rooms?.length || 0), 0);
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBuilding(b.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-accent border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-semibold">{b.name}</span>
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        {floorCount} floors, {roomCount} rooms
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floor Selection */}
          {selectedBuilding && availableFloors.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Layers3 className="h-4 w-4" />
                Floor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableFloors.map((f:any) => {
                  const isSelected = selectedFloor === f.id;
                  const roomCount = f.rooms?.length || 0;
                  const occupiedCount = (f.rooms || []).reduce((sum:number, r:any) => {
                    return sum + getOccupantCount(r.id);
                  }, 0);
                  const totalCapacity = (f.rooms || []).reduce((sum:number, r:any) => {
                    return sum + (r.capacity || Math.floor((r.spaceSqm || r.area || 20) / 4));
                  }, 0);
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFloor(f.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-accent border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers3 className="h-4 w-4" />
                        <span className="font-semibold">{f.name}</span>
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        {roomCount} rooms, {occupiedCount}/{totalCapacity} occupied
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Assignment Date</label>
            <input 
              type="date" 
              className="border rounded px-3 py-2 w-full bg-background" 
              value={assignDate} 
              onChange={(e) => setAssignDate(e.target.value)}
            />
          </div>

          {/* Rooms List */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <DoorOpen className="h-4 w-4" />
              Rooms
            </label>
            
            {/* Debug Info */}
            {selectedFloor && (
              <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded">
                <div>Selected Floor: {selectedFloor}</div>
                <div>Available Rooms: {availableRooms.length}</div>
                <div>Rooms State: {rooms.length}</div>
              </div>
            )}
            
            {availableRooms.length === 0 && (
              <div className="text-center py-6 px-4 bg-muted/30 rounded-lg">
                {!selectedResidence && (
                  <div className="text-muted-foreground">
                    <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a residence first</p>
                  </div>
                )}
                {selectedResidence && !selectedBuilding && (
                  <div className="text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a building</p>
                  </div>
                )}
                {selectedBuilding && !selectedFloor && (
                  <div className="text-muted-foreground">
                    <Layers3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a floor</p>
                  </div>
                )}
                {selectedFloor && (
                  <div className="text-muted-foreground">
                    <DoorOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium mb-2">⚠️ No rooms in this floor</p>
                    <p className="text-xs mb-3">
                      Floor ID: <code className="bg-muted px-1 rounded text-[10px]">{selectedFloor}</code>
                    </p>
                    <p className="text-xs mb-3">Please add rooms from the Accommodation Management page or select another floor</p>
                    <a 
                      href="/accommodation" 
                      className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90"
                    >
                      <Building className="h-3 w-3" />
                      Accommodation Management
                    </a>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
            {availableRooms.map((rm:any) => {
              const capacity = rm.capacity || Math.floor((rm.spaceSqm || rm.area || 20) / 4);
              const currentOccupants = getOccupantCount(rm.id);
              const isFull = currentOccupants >= capacity;
              const isNearFull = currentOccupants >= capacity * 0.8;
              
              return (
                <button 
                  key={rm.id} 
                  onDragOver={(e)=>e.preventDefault()} 
                  onDrop={(e)=>onDropToRoom(e, rm.id)} 
                  onClick={() => handleRoomClick(rm)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isFull 
                      ? 'bg-destructive/10 border-destructive' 
                      : isNearFull 
                      ? 'bg-yellow-500/10 border-yellow-500' 
                      : 'bg-background hover:bg-accent border-border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <DoorOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{rm.name || 'Room ' + rm.id}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {rm.roomType || 'Worker'} • {rm.spaceSqm || rm.area || 20}m²
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-xs">
                          <Users className="h-3 w-3 inline mr-1" />
                          {currentOccupants} / {capacity}
                        </div>
                        {isFull && (
                          <span className="text-xs text-destructive font-medium">Full</span>
                        )}
                        {!isFull && isNearFull && (
                          <span className="text-xs text-yellow-600 font-medium">Near Full</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded-md border p-4 bg-card">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input 
                value={searchInput} 
                onChange={(e)=>setSearchInput(e.target.value)} 
                placeholder="Search for worker (name, ID, Iqama, employee ID, nationality)" 
                className="border rounded px-3 py-2 w-full bg-background"
              />
              {isSearching && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <select value={filterNationality} onChange={(e)=>{setFilterNationality(e.target.value); setCurrentPage(1);}} className="border rounded px-3 py-2 bg-background">
              <option value="">All Nationalities</option>
              {availableNationalities.map((nat) => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>
            <button 
              onClick={handleBulkAssign} 
              disabled={submitting || selectedWorkers.length===0} 
              className="rounded-md bg-amber-600 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
            >
              {submitting ? 'Assigning...' : `Assign (${selectedWorkers.length})`}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading...</p>
            </div>
          )}

          {!loading && searchQ && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No search results</p>
              <p className="text-sm">Try adding workers from <a href="/accommodation/quick-add-workers" className="text-primary underline">here</a></p>
            </div>
          )}

          {!loading && !searchQ && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2 text-lg">No workers</p>
              <p className="text-sm mb-4">Add sample workers to get started</p>
              <a href="/accommodation/quick-add-workers" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Add Sample Workers
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Search Results ({filteredResults.length})</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {itemsPerPage} per page</span>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-auto">
                {paginatedResults.map((w:any)=> {
                  const isAssigned = occupants.some(occ => occ.workerId === w.id);
                  const assignedRoom = isAssigned ? occupants.find(occ => occ.workerId === w.id) : null;
                  const roomInfo = assignedRoom ? rooms.find(r => r.id === assignedRoom.roomId) : null;
                  
                  return (
                    <div 
                      key={w.id} 
                      draggable={!isAssigned} 
                      onDragStart={(e)=>onDragStart(e,w.id)} 
                      className={`p-3 border rounded flex items-center justify-between transition-colors ${
                        isAssigned 
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 opacity-75 cursor-not-allowed' 
                          : 'bg-background hover:bg-accent cursor-move'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{w.name}</div>
                          {isAssigned && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                              Assigned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span>{w.nationaliy}</span>
                            {w.company && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                                {w.company}
                              </span>
                            )}
                            <span>• {w.role || 'Worker'}</span>
                          </div>
                          {(w.employeeId || w.idNumber) && (
                            <div className="flex gap-3 font-mono text-[10px]">
                              {w.employeeId && <span>ID: {w.employeeId}</span>}
                              {w.idNumber && <span>Iqama: {w.idNumber}</span>}
                            </div>
                          )}
                        </div>
                        {isAssigned && roomInfo && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            In: {roomInfo.name || 'Room ' + roomInfo.id}
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => window.location.href = `/accommodation/worker-timeline/${w.id}`}
                            className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            Timeline
                          </button>
                        </div>
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          checked={selectedWorkers.includes(w.id)} 
                          onChange={()=>toggleWorker(w.id)}
                          disabled={isAssigned}
                          className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination Controls */}
              {filteredResults.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-3">Selected ({selectedWorkers.length})</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {selectedWorkers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No workers selected
                  </div>
                )}
                {selectedWorkers.map(id => {
                  // Search in all workers, not just filtered results
                  const w = workers.find((s:any)=>s.id===id) || searchResults.find((s:any)=>s.id===id) || { id, name: 'Unknown worker', nationaliy: '' };
                  return (
                    <div key={id} className="p-3 border rounded flex items-center justify-between bg-background">
                      <div>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{(w as any).nationaliy}</div>
                      </div>
                      <button 
                        onClick={()=>toggleWorker(id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Details Dialog */}
      <Dialog open={roomDetailsDialogOpen} onOpenChange={setRoomDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedRoomForDetails?.name || 'Room Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoomForDetails && (
            <div className="space-y-1 text-right text-sm text-muted-foreground -mt-2 mb-4">
              <div>Type: {selectedRoomForDetails.roomType || 'Worker'}</div>
              <div>Area: {selectedRoomForDetails.spaceSqm || selectedRoomForDetails.area || 20} m²</div>
              <div>
                Occupancy: {getOccupantCount(selectedRoomForDetails.id)} / {selectedRoomForDetails.capacity || Math.floor((selectedRoomForDetails.spaceSqm || selectedRoomForDetails.area || 20) / 4)}
              </div>
            </div>
          )}

          {selectedRoomForDetails && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Workers in Room ({getRoomOccupants(selectedRoomForDetails.id).length})
                </h3>
                
                {getRoomOccupants(selectedRoomForDetails.id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Room is empty</p>
                    <p className="text-sm mt-1">Drag a worker to the room to assign</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getRoomOccupants(selectedRoomForDetails.id).map((occupant) => (
                      <div
                        key={occupant.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base">{occupant.workerName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span>{occupant.workerNationality}</span>
                            <span>•</span>
                            <span>{occupant.workerRole}</span>
                            {occupant.employeeId && (
                              <>
                                <span>•</span>
                                <span>Employee ID: {occupant.employeeId}</span>
                              </>
                            )}
                          </div>
                          {occupant.assignedAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Assigned Date: {new Date(occupant.assignedAt).toLocaleDateString('en-US')}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWorker(occupant.workerId, occupant.workerName)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 ml-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Room Info */}
              {selectedRoomForDetails && (
                <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground mb-2">Additional Information:</h4>
                  {selectedRoomForDetails.bedCount && (
                    <div className="flex justify-between">
                      <span>Bed Count:</span>
                      <span className="font-medium">{selectedRoomForDetails.bedCount}</span>
                    </div>
                  )}
                  {selectedRoomForDetails.floor && (
                    <div className="flex justify-between">
                      <span>Floor:</span>
                      <span className="font-medium">{selectedRoomForDetails.floor}</span>
                    </div>
                  )}
                  {selectedRoomForDetails.building && (
                    <div className="flex justify-between">
                      <span>Building:</span>
                      <span className="font-medium">{selectedRoomForDetails.building}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setRoomDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
