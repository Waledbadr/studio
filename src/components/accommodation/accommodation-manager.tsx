"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccommodation } from "@/context/accommodation-context";
import { useResidences } from "@/context/residences-context";
import { useUsers } from "@/context/users-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Users, Building, Home, ArrowRight, CheckCircle2, 
  XCircle, Trash2, ArrowRightLeft, LogOut, Filter, RefreshCw, CloudCog, UserPlus, Sparkles, X,
  AlertTriangle, Info
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddWorkerDialog } from "./add-worker-dialog";
import { WorkerHistoryDialog } from "./worker-history-dialog";
import { RoomHistoryDialog } from "./room-history-dialog";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getUserLanguage, getLocalizedMessage, ERROR_MESSAGES, UI_TEXT } from '@/lib/i18n-helpers';

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
      const lang = getUserLanguage();
      toast({ 
        title: getLocalizedMessage(UI_TEXT.titles.success),
        description: getLocalizedMessage({ ar: 'تم مزامنة البيانات مع قاعدة البيانات', en: 'Data synchronized with database' })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter Residences
  const accessibleResidences = React.useMemo(() => {
    if (!currentUser) return [];
    // Filter out disabled residences
    const activeResidences = residences.filter(r => !r.disabled);
    if (currentUser.role === 'Admin') return activeResidences;
    // Filter by assignedResidences array
    return activeResidences.filter(r => currentUser.assignedResidences?.includes(r.id));
  }, [residences, currentUser]);

  // Global State
  const [activeTab, setActiveTab] = useState("assign");
  
  // Sticky Fields for Check-in
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkInType, setCheckInType] = useState<string>("New Recruitment");
  const [bulkTransferCity, setBulkTransferCity] = useState<string>(""); // NEW: For bulk checkout transfer

  // Checkout Dialog State
  const [checkoutWorker, setCheckoutWorker] = useState<any>(null);
  const [checkoutReason, setCheckoutReason] = useState<string>("End of Contract");
  const [checkoutCity, setCheckoutCity] = useState<string>("");
  const [checkoutDateValue, setCheckoutDateValue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkoutDateWarning, setCheckoutDateWarning] = useState<string>('');
  
  // Extract Unique Cities from ALL residences (for transfer destinations)
  const uniqueCities = React.useMemo(() => {
    const cities = new Set<string>();
    residences.forEach(r => {
      if (r.city) cities.add(r.city);
    });
    return Array.from(cities).filter(Boolean).sort();
  }, [residences]);
  
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
  
  // Auto Assign State
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [autoAssignResults, setAutoAssignResults] = useState<{
    total: number;
    success: number;
    failures: number;
    details: { workerId?: string; workerName: string; roomName: string; status: 'success' | 'error'; message?: string }[];
  } | null>(null);

  // Derived State
  const selectedResidence = accessibleResidences.find(r => r.id === selectedResidenceId);
  
  const buildings = React.useMemo(() => 
    [...(selectedResidence?.buildings || [])].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, undefined, { numeric: true, sensitivity: 'base' })),
  [selectedResidence]);

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  
  const floors = React.useMemo(() => 
    [...(selectedBuilding?.floors || [])].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, undefined, { numeric: true, sensitivity: 'base' })),
  [selectedBuilding]);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  
  // Handle direct rooms (no buildings/floors)
  const rooms = React.useMemo(() => {
    const raw = selectedFloor?.rooms || (buildings.length === 0 ? selectedResidence?.rooms || [] : []);
    return [...raw].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, undefined, { numeric: true, sensitivity: 'base' }));
  }, [selectedFloor, buildings.length, selectedResidence]);

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

  // Fetch details for occupants of selected room
  useEffect(() => {
    const loadOccupantDetails = async () => {
      if (!selectedRoomId) return;
      
      const roomOccs = occupants.filter(o => o.roomId === selectedRoomId);
      const missingWorkerIds = roomOccs
        .map(o => o.workerId)
        .filter(id => !workers.find(w => w.id === id) && !roomOccupantDetails.find(w => w.id === id));
      
      if (missingWorkerIds.length > 0) {
        const newDetails = await getWorkersByIds(missingWorkerIds);
        setRoomOccupantDetails(prev => [...prev, ...newDetails]);
      }
    };
    
    loadOccupantDetails();
  }, [selectedRoomId, occupants, workers, roomOccupantDetails, getWorkersByIds]);

  // NEW: Fetch missing workers for the entire current floor view
  // This ensures room tags (Nationality - Role) appear without clicking each room
  useEffect(() => {
    const loadMissingWorkersForView = async () => {
      if (!selectedResidenceId) return;
      
      // Filter occupants relevant to current view
      const currentOccupants = occupants.filter(o => 
        o.residenceId === selectedResidenceId && 
        (!selectedFloorId || o.floorId === selectedFloorId)
      );
      
      if (currentOccupants.length === 0) return;

      const missingWorkerIds = currentOccupants
        .map(o => o.workerId)
        .filter(id => !workers.find(w => w.id === id));
      
      // Deduplicate
      const uniqueMissingIds = Array.from(new Set(missingWorkerIds));

      if (uniqueMissingIds.length > 0) {
        // console.log(`Fetching ${uniqueMissingIds.length} missing workers for current view...`);
        await getWorkersByIds(uniqueMissingIds);
      }
    };
    
    // Debounce to avoid rapid calls during navigation
    const timer = setTimeout(loadMissingWorkersForView, 500);
    return () => clearTimeout(timer);
  }, [selectedResidenceId, selectedFloorId, occupants, workers, getWorkersByIds]);

  // Search Logic
  const handleSearch = useCallback(async (query: string) => {
    // setSearchQuery(query); // Managed by input
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchOccupancies({});
    try {
      // Detect multiple terms (space, comma, newline)
      const spaceTerms = query.split(/[\s,]+/).map(t => t.trim()).filter(t => t.length > 0);
      
      let results: any[] = [];

      // Heuristic: If multiple terms and they look like IDs (numbers), treat as bulk search
      const isNumberList = spaceTerms.length > 1 && spaceTerms.every(t => /^\d+$/.test(t));

      if (isNumberList) {
        // Bulk Search for IDs
        // Use Promise.allSettled to avoid one failure breaking all
        const promises = spaceTerms.map(term => findWorkerAsync(term));
        const resultsArrays = await Promise.all(promises);
        // Flatten and deduplicate
        const allResults = resultsArrays.flat();
        const uniqueMap = new Map();
        allResults.forEach(w => uniqueMap.set(w.id, w));
        results = Array.from(uniqueMap.values());
      } else {
        // Standard Search (try full query first)
        results = await findWorkerAsync(query);
        
        // Fallback: If no results and multiple terms, try searching each term
        // This helps if user pastes "ID1 ID2" but they are alphanumeric or mixed
        if (results.length === 0 && spaceTerms.length > 1) {
             const promises = spaceTerms.map(term => findWorkerAsync(term));
             const resultsArrays = await Promise.all(promises);
             const allResults = resultsArrays.flat();
             const uniqueMap = new Map();
             allResults.forEach(w => uniqueMap.set(w.id, w));
             results = Array.from(uniqueMap.values());
        }
      }

      setSearchResults(results);

      // Check occupancy for results
      console.log('[Search] Checking occupancy for', results.length, 'workers');
      const occs: Record<string, any> = {};
      // Use sequential loop to avoid potential race conditions or overload
      for (const w of results) {
        if (!w.id) continue;
        try {
          const occ = await checkWorkerOccupancy(w.id);
          console.log('[Search] Worker', w.id, w.name, 'occupancy:', occ);
          if (occ) occs[w.id] = occ;
        } catch (e) { 
          console.error(`Failed to check occupancy for ${w.id}`, e); 
        }
      }
      console.log('[Search] Final occupancies:', occs);
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
          return [worker, ...curr];
        });
        return [workerId, ...prev];
      }
    });
  };

  // Actions
  const handleAssign = async () => {
    if (!selectedResidenceId || !selectedRoomId || selectedWorkerIds.length === 0) {
      const lang = getUserLanguage();
      toast({ 
        title: getLocalizedMessage(UI_TEXT.titles.error),
        description: getLocalizedMessage({ ar: 'يرجى اختيار العمال والغرفة', en: 'Please select workers and a room' }),
        variant: "destructive" 
      });
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
        const lang = getUserLanguage();
        
        // Map error codes to bilingual user-friendly messages
        const errorMessages: Record<string, {ar: string, en: string}> = {
          'CHECKIN_IN_FUTURE': { ar: 'تاريخ التسكين لا يمكن أن يكون في المستقبل', en: 'Check-in date cannot be in the future' },
          'CHECKOUT_IN_FUTURE': { ar: 'تاريخ الخروج لا يمكن أن يكون في المستقبل', en: 'Check-out date cannot be in the future' },
          'DATE_CONFLICT_WITH_HISTORY': { ar: 'تعارض في التواريخ مع السجلات السابقة', en: 'Date conflict with history records' },
          'CHECKIN_BEFORE_LAST_CHECKOUT': { ar: 'تاريخ التسكين يجب أن يكون بعد آخر خروج', en: 'Check-in must be after last checkout' },
          'MONTH_ALREADY_INVOICED': { ar: 'تم إصدار فاتورة لهذا الشهر', en: 'Month already invoiced' },
          'nationality-mismatch': { ar: 'الجنسية لا تطابق الغرفة', en: 'Nationality mismatch' },
          'role-mismatch': { ar: 'الدور الوظيفي لا يطابق الغرفة', en: 'Role mismatch' },
          'room-full': { ar: 'الغرفة ممتلئة', en: 'Room is full' },
          'room-not-found': { ar: 'الغرفة غير موجودة', en: 'Room not found' },
          'worker-not-found': { ar: 'العامل غير موجود', en: 'Worker not found' },
          'worker-already-assigned': { ar: 'العامل مسكّن بالفعل', en: 'Worker already assigned' }
        };
        
        // Get unique error messages with translation
        const translatedErrors = failures
          .map(f => {
            const errorCode = (f.error || '').split(':')[0].trim();
            const msg = errorMessages[errorCode];
            return msg ? getLocalizedMessage(msg) : errorCode;
          })
          .filter(Boolean);
        const uniqueErrors = Array.from(new Set(translatedErrors));
        
        toast({ 
          title: getLocalizedMessage({ ar: 'مشاكل في التسكين', en: 'Check-in Issues' }),
          description: getLocalizedMessage({
            ar: `فشل تسكين ${failures.length} عامل. الأسباب: ${uniqueErrors.join("، ")}`,
            en: `Failed to check-in ${failures.length} worker(s). Reasons: ${uniqueErrors.join(", ")}`
          }),
          variant: "destructive" 
        });
      }
    } catch (error) {
      const lang = getUserLanguage();
      toast({ 
        title: getLocalizedMessage(UI_TEXT.titles.error),
        description: getLocalizedMessage({ ar: 'فشل التسكين', en: 'Assignment failed' }),
        variant: "destructive" 
      });
    }
  };

  // Data Health Check
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const checkDuplicates = () => {
    if (!workers || workers.length === 0) {
      const lang = getUserLanguage();
      toast({ 
        title: getLocalizedMessage({ ar: 'لا توجد بيانات', en: 'No Data' }),
        description: getLocalizedMessage({ 
          ar: 'قائمة العمال فارغة (وضع التحسين). لا يمكن التحقق من التكرارات محلياً',
          en: 'Workers list is empty (Optimization Mode). Cannot check for duplicates locally'
        }),
        variant: "destructive" 
      });
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
    const lang = getUserLanguage();
    toast({ 
      title: getLocalizedMessage({ ar: 'تم الحذف', en: 'Deleted' }),
      description: getLocalizedMessage({ ar: 'تم حذف العامل بنجاح', en: 'Worker deleted successfully' })
    });
    
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

  // Auto Assign Logic
  const handleAutoAssign = async () => {
    if (selectedWorkerIds.length === 0) return;
    if (!selectedFloorId) {
      const lang = getUserLanguage();
      toast({ 
        title: getLocalizedMessage({ ar: 'اختيار مطلوب', en: 'Selection Required' }),
        description: getLocalizedMessage({ ar: 'يرجى اختيار طابق للتسكين التلقائي', en: 'Please select a floor to auto-assign workers to' }),
        variant: "destructive" 
      });
      return;
    }

    setIsAutoAssigning(true);
    try {
      // 1. Prepare Data
      // Fetch FRESH occupants for this floor directly from DB to avoid stale state
      // This is critical to prevent "Room Full" or "Nationality Mismatch" errors due to UI lag
      let freshOccupants: any[] = [];
      if (db && selectedResidenceId && selectedFloorId) {
         const q = query(
            collection(db, 'occupants'),
            where('residenceId', '==', selectedResidenceId),
            where('floorId', '==', selectedFloorId),
            where('until', '==', null)
         );
         const snap = await getDocs(q);
         freshOccupants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
         freshOccupants = occupants.filter(o => o.residenceId === selectedResidenceId && o.floorId === selectedFloorId);
      }

      // Fetch details for all existing occupants on this floor to ensure we know nationalities/roles
      const floorOccupantIds = freshOccupants.map(o => o.workerId);
      
      // ALSO fetch fresh details for the selected workers to ensure we have their Nationality/Role
      // This prevents "nationality-mismatch" errors if the UI state is stale/incomplete
      const selectedIds = selectedWorkers.map(w => w.id);
      const allIdsToFetch = Array.from(new Set([...floorOccupantIds, ...selectedIds]));
      
      // Fetch FRESH data directly from Firestore to bypass local cache
      const allWorkersMap = new Map();
      const chunkSize = 10;
      if (db) {
        for (let i = 0; i < allIdsToFetch.length; i += chunkSize) {
            const chunk = allIdsToFetch.slice(i, i + chunkSize);
            const promises = chunk.map(id => getDoc(doc(db!, 'workers', id)));
            const snaps = await Promise.all(promises);
            snaps.forEach(snap => {
                if (snap.exists()) {
                    allWorkersMap.set(snap.id, { id: snap.id, ...snap.data() });
                }
            });
        }
      }

      // Update selectedWorkers with fresh data for the algorithm
      const freshSelectedWorkers = selectedWorkers.map(w => allWorkersMap.get(w.id) || w);

      // 2. Build Room State
      // Map: RoomID -> { capacity, occupants: Worker[], virtualOccupants: Worker[] }
      const roomState = new Map();
      rooms.forEach(room => {
        const roomOccs = freshOccupants.filter(o => o.roomId === room.id);
        
        // Fix: Don't filter out occupants if worker details are missing. 
        // Count them as default Workers to ensure capacity is reserved.
        const occWorkers = roomOccs.map(o => {
            const w = allWorkersMap.get(o.workerId);
            if (w) return w;
            // Placeholder for missing worker data to ensure space is counted
            return { id: o.workerId, role: 'Worker', nationaliy: 'Unknown', name: 'Unknown' };
        });

        roomState.set(room.id, {
          ...room,
          currentOccupants: occWorkers,
          virtualOccupants: []
        });
      });

      // 3. Sort Selected Workers (Engineers -> Supervisors -> Workers) to prioritize larger spaces
      const sortedSelected = [...freshSelectedWorkers].sort((a, b) => {
        const roleScore = (r: string) => r === 'Engineer' ? 3 : r === 'Supervisor' ? 2 : 1;
        return roleScore(b.role || 'Worker') - roleScore(a.role || 'Worker');
      });

      // 4. Match
      const assignments: Record<string, string[]> = {}; // RoomID -> WorkerIDs[]
      const resultsDetails: any[] = [];
      const unassigned: string[] = [];

      for (const worker of sortedSelected) {
        let assigned = false;
        
        // Find best room
        // Strategy:
        // 1. Filter valid rooms (Capacity & Nationality strict match)
        // 2. Score rooms:
        //    - Score 3: Occupied + Same Nationality + Same Role (Best)
        //    - Score 2: Occupied + Same Nationality (Good)
        //    - Score 1: Empty (Fallback)
        // 3. Sort by Score DESC, then by Fill Level DESC (Fill vacancies first)
        
        const candidates: { roomId: string; state: any; score: number; usedSqm: number }[] = [];

        for (const [roomId, state] of roomState.entries()) {
          const allOccs = [...state.currentOccupants, ...state.virtualOccupants];
          
          // Capacity Check
          // Use spaceSqm if available, otherwise fallback to capacity * 4, or default 16
          const totalSqm = state.spaceSqm || ((state.capacity || 4) * 4);
          
          const usedSqm = allOccs.reduce((sum: number, w: any) => {
            return sum + (w.role === 'Engineer' ? 16 : w.role === 'Supervisor' ? 8 : 4);
          }, 0);
          const requiredSqm = worker.role === 'Engineer' ? 16 : worker.role === 'Supervisor' ? 8 : 4;
          
          // Skip checks if Emergency Mode is ON
          if (!selectedResidence?.isEmergencyMode) {
            if (usedSqm + requiredSqm > totalSqm) continue;

            // Nationality Check
            let isNatMatch = true;
            if (allOccs.length > 0) {
              // Find the first occupant with a nationality to compare against
              const firstWithNat = allOccs.find((o: any) => o.nationaliy);
              if (firstWithNat && firstWithNat.nationaliy && worker.nationaliy) {
                const roomNat = firstWithNat.nationaliy.trim().toLowerCase();
                const workerNat = worker.nationaliy.trim().toLowerCase();
                if (roomNat !== workerNat) {
                  isNatMatch = false;
                }
              }
            }
            if (!isNatMatch) continue;

            // Role Check (Strict for Supervisors/Engineers if room is mixed?)
            // Actually, bulkCheckIn enforces: if room has role X, new worker must be X?
            // Let's check bulkCheckIn logic:
            // "Rule 2: Role ... If room was empty and this is first valid worker, set state ... if currentRole && currentRole !== workerRole ... error"
            // So if room is occupied, role must match exactly?
            // Let's replicate that strictness.
            let isRoleMatch = true;
            if (allOccs.length > 0) {
              const firstWithRole = allOccs.find((o: any) => o.role);
              if (firstWithRole) {
                  const roomRole = firstWithRole.role || 'Worker';
                  const workerRole = worker.role || 'Worker';
                  if (roomRole !== workerRole) {
                    isRoleMatch = false;
                  }
              }
            }
            if (!isRoleMatch) continue;
          }


          // Scoring
          // Strategy:
          // 1. Prioritize occupied rooms (same nationality) over empty ones.
          // 2. Among occupied rooms, prioritize the fullest ones (highest occupancy %).
          // 3. Empty rooms get lowest priority.
          
          let score = 0;
          
          if (allOccs.length > 0) {
            // Occupied Room: Base 1000
            score = 1000;
            
            // Add occupancy percentage (0-100)
            // Example: 50% full -> 1050, 75% full -> 1075
            const occupancyPercentage = totalSqm > 0 ? (usedSqm / totalSqm) * 100 : 0;
            score += occupancyPercentage;
          } else {
            // Empty Room: Base 100
            score = 100;
          }

          candidates.push({ roomId, state, score, usedSqm });
        }

        // Sort Candidates
        candidates.sort((a, b) => b.score - a.score);

        if (candidates.length > 0) {
          const best = candidates[0];
          if (!assignments[best.roomId]) assignments[best.roomId] = [];
          assignments[best.roomId].push(worker.id);
          best.state.virtualOccupants.push(worker);
          assigned = true;
        }

        if (!assigned) {
          resultsDetails.push({ 
            workerName: worker.name, 
            roomName: 'None', 
            status: 'error', 
            message: 'No suitable room found (Capacity/Nationality)' 
          });
          unassigned.push(worker.id);
        }
      }

      // 5. Execute Batch Assignments
      let successCount = 0;
      let failCount = 0;

      await Promise.all(Object.entries(assignments).map(async ([roomId, workerIds]) => {
        const roomName = rooms.find(r => r.id === roomId)?.name || roomId;
        try {
          const res = await bulkCheckIn({
            workerIds,
            residenceId: selectedResidenceId,
            buildingId: selectedBuildingId,
            floorId: selectedFloorId,
            roomId,
            performedBy: currentUser?.email || 'Admin',
            checkInDate: new Date(checkInDate).toISOString(),
            notes: checkInType + ' (Auto)'
          });

          // Check individual results regardless of overall status
          if (res.results) {
            workerIds.forEach(id => {
              const result = res.results[id];
              const w = selectedWorkers.find(w => w.id === id);
              
              if (result && result.success) {
                resultsDetails.push({
                  workerId: id,
                  workerName: w?.name || id,
                  roomName,
                  status: 'success'
                });
                successCount++;
              } else {
                // Map error codes to user-friendly messages (Arabic)
                const errorMessages: Record<string, string> = {
                  'CHECKIN_IN_FUTURE': 'تاريخ مستقبلي',
                  'DATE_CONFLICT_WITH_HISTORY': 'تعارض تواريخ',
                  'CHECKIN_BEFORE_LAST_CHECKOUT': 'قبل آخر خروج',
                  'nationality-mismatch': 'جنسية مختلفة',
                  'role-mismatch': 'دور وظيفي مختلف',
                  'room-full': 'غرفة ممتلئة',
                  'worker-already-assigned': 'مسكّن بالفعل'
                };
                
                const errorCode = (result?.error || '').split(':')[0].trim();
                const translatedError = errorMessages[errorCode] || result?.error || 'فشل';
                
                resultsDetails.push({
                  workerId: id,
                  workerName: w?.name || id,
                  roomName,
                  status: 'error',
                  message: translatedError
                });
                failCount++;
              }
            });
          } else {
             // Fallback if results is missing (should not happen)
             workerIds.forEach(id => {
              const w = selectedWorkers.find(w => w.id === id);
              resultsDetails.push({
                workerId: id,
                workerName: w?.name || id,
                roomName,
                status: 'error',
                message: 'No result returned'
              });
              failCount++;
            });
          }
        } catch (e) {
           workerIds.forEach(id => {
              const w = selectedWorkers.find(w => w.id === id);
              resultsDetails.push({
                workerId: id,
                workerName: w?.name || id,
                roomName,
                status: 'error',
                message: 'Exception'
              });
              failCount++;
            });
        }
      }));

      // 6. Update Selection
      // Remove successfully assigned workers
      const successfulIds = resultsDetails.filter(r => r.status === 'success').map(r => r.workerId);
      const newSelectedIds = selectedWorkerIds.filter(id => !successfulIds.includes(id));
      
      setSelectedWorkerIds(newSelectedIds);
      setSelectedWorkers(prev => prev.filter(w => newSelectedIds.includes(w.id)));

      setAutoAssignResults({
        total: selectedWorkerIds.length,
        success: successCount,
        failures: failCount + unassigned.length,
        details: resultsDetails
      });

    } catch (e) {
      console.error("Auto Assign Failed", e);
      const lang = getUserLanguage();
      toast({ 
        title: getLocalizedMessage({ ar: 'خطأ في التسكين التلقائي', en: 'Auto Assign Error' }),
        description: getLocalizedMessage({ ar: 'حدث خطأ غير متوقع', en: 'An unexpected error occurred' }),
        variant: "destructive" 
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accommodation</h2>
          <p className="text-muted-foreground">Manage room assignments and capacity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <AddWorkerDialog />
        </div>
      </div>



      <div>{/* Dialog removed */}</div>

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
                  placeholder="Search (ID, Name, or paste list)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text');
                    // Replace newlines, tabs, commas with space and trim
                    const processed = text.replace(/[\n\r\t,]+/g, ' ').replace(/\s+/g, ' ').trim();
                    setSearchQuery(processed);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      // If exact match exists for the query, prefer it
                      const exactMatch = searchResults.find(w => 
                        w.id === searchQuery.trim() || 
                        w.employeeId === searchQuery.trim() || 
                        w.idNumber === searchQuery.trim()
                      );

                      let toSelect = [];
                      if (exactMatch) {
                        // If exact match found, ONLY select that one (unless already selected)
                        if (!selectedWorkerIds.includes(exactMatch.id)) {
                          toSelect = [exactMatch];
                        }
                      } else {
                        // Otherwise select all results (bulk behavior)
                        toSelect = searchResults.filter(w => !selectedWorkerIds.includes(w.id));
                      }

                      if (toSelect.length > 0) {
                          setSelectedWorkerIds(prev => [...toSelect.map(w => w.id), ...prev]);
                          setSelectedWorkers(prev => {
                              const newWorkers = toSelect.filter(nw => !prev.some(pw => pw.id === nw.id));
                              return [...newWorkers, ...prev];
                          });
                          setSearchQuery('');
                          setSearchResults([]);
                      }
                    }
                  }}
                  className="pl-8 pr-8 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
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
                      {selectedWorkers.map(worker => {
                        const occupancy = searchOccupancies[worker.id] || occupants.find(o => o.workerId === worker.id);
                        const isOccupied = !!occupancy;

                        // Resolve Names
                        let residenceName = occupancy?.residenceName || 'Unknown';
                        let buildingName = occupancy?.buildingName || occupancy?.buildingId || '?';
                        let floorName = occupancy?.floorName || occupancy?.floorId || '?';
                        let roomName = occupancy?.roomName || occupancy?.roomId || '?';

                        if (isOccupied && residences.length > 0) {
                          const res = residences.find(r => r.id === occupancy.residenceId);
                          if (res) {
                            residenceName = res.name;
                            
                            if (occupancy.buildingId) {
                              const b = res.buildings?.find(b => b.id === occupancy.buildingId);
                              if (b) {
                                buildingName = b.name || b.id;
                                if (occupancy.floorId) {
                                  const f = b.floors?.find(f => f.id === occupancy.floorId);
                                  if (f) {
                                    floorName = f.name || f.id;
                                    if (occupancy.roomId) {
                                       const r = f.rooms?.find(r => r.id === occupancy.roomId);
                                       if (r) roomName = r.name || r.id;
                                    }
                                  }
                                }
                              }
                            } else if (occupancy.roomId) {
                               const r = res.rooms?.find(r => r.id === occupancy.roomId);
                               if (r) roomName = r.name || r.id;
                            }
                          }
                        }

                        return (
                        <div 
                          key={worker.id} 
                          className={`flex flex-col p-2 rounded border cursor-pointer transition-colors text-sm hover:bg-muted ${isOccupied ? 'bg-amber-50/50 border-amber-200' : 'bg-primary/10 border-primary'}`}
                        >
                          {isOccupied ? (
                            // Occupied Worker Card Layout
                            <div className="flex justify-between items-start w-full">
                              <div className="flex items-start gap-2 flex-1">
                                <Checkbox 
                                  checked={true}
                                  onCheckedChange={() => toggleWorkerSelection(worker)}
                                  className="mt-1 h-3 w-3"
                                />
                                <div className="flex-1">
                                  {/* Line 1: Name */}
                                  <div className="font-bold text-sm text-amber-950 mb-1">
                                    {worker.name} <span className="font-normal text-amber-900/70 text-xs">{worker.employeeId ? `(${worker.employeeId})` : ''}</span>
                                  </div>
                                  
                                  {/* Line 2: Role . Nationality . Company */}
                                  <div className="text-amber-800 mb-1 flex flex-wrap gap-1 items-center text-xs">
                                    <span className="font-medium">{worker.role || 'Worker'}</span>
                                    <span className="text-amber-400">•</span>
                                    <span>{worker.nationaliy || 'Unknown'}</span>
                                    <span className="text-amber-400">•</span>
                                    <span>{worker.company || 'No Company'}</span>
                                  </div>

                                  {/* Line 3: Residence . Building-Floor-Room . Date . Type */}
                                  <div className="text-amber-700/80 flex flex-wrap gap-1 items-center text-[10px]">
                                    <span className="font-medium">{residenceName}</span>
                                    <span className="text-amber-300">•</span>
                                    <span>
                                      {buildingName}-{floorName}-{roomName}
                                    </span>
                                    {occupancy.checkInDate && (
                                        <>
                                            <span className="text-amber-300">•</span>
                                            <span>{new Date(occupancy.checkInDate).toLocaleDateString()}</span>
                                        </>
                                    )}
                                    {occupancy.notes && (
                                        <>
                                            <span className="text-amber-300">•</span>
                                            <span className="font-medium">{occupancy.notes}</span>
                                        </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                                <WorkerHistoryDialog workerId={worker.id} workerName={worker.name} />
                              </div>
                            </div>
                          ) : (
                            // Unoccupied Worker Card Layout
                            <div className="flex justify-between items-start w-full">
                              <div className="flex items-start gap-2 flex-1">
                                <Checkbox 
                                  checked={true}
                                  onCheckedChange={() => toggleWorkerSelection(worker)}
                                  className="mt-1 h-3 w-3"
                                />
                                <div className="flex-1">
                                  <div className="font-bold text-sm mb-1">
                                    {worker.name} <span className="font-normal text-muted-foreground text-xs">{worker.employeeId ? `(${worker.employeeId})` : ''}</span>
                                  </div>
                                  <div className="text-muted-foreground flex flex-wrap gap-1 items-center text-xs">
                                    <span className="font-medium text-primary">{worker.role || 'Worker'}</span>
                                    <span>•</span>
                                    <span>{worker.nationaliy || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{worker.company || 'No Company'}</span>
                                  </div>
                                </div>
                              </div>
                              <div onClick={e => e.stopPropagation()}>
                                <WorkerHistoryDialog workerId={worker.id} workerName={worker.name} />
                              </div>
                            </div>
                          )}
                        </div>
                      )})}
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
                    {searchResults.filter(w => !selectedWorkerIds.includes(w.id)).length > 1 && (
                        <div className="flex justify-between items-center px-2 pb-2 border-b mb-2">
                            <span className="text-[10px] text-muted-foreground">Found {searchResults.length} workers</span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                    const toSelect = searchResults.filter(w => !selectedWorkerIds.includes(w.id));
                                    if (toSelect.length > 0) {
                                        setSelectedWorkerIds(prev => [...toSelect.map(w => w.id), ...prev]);
                                        setSelectedWorkers(prev => {
                                            const newWorkers = toSelect.filter(nw => !prev.some(pw => pw.id === nw.id));
                                            return [...newWorkers, ...prev];
                                        });
                                    }
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                            >
                                Select All
                            </Button>
                        </div>
                    )}
                    {searchResults.filter(w => !selectedWorkerIds.includes(w.id)).map(worker => {
                      const occupancy = searchOccupancies[worker.id];
                      const isOccupied = !!occupancy;

                      // Resolve Names
                      let residenceName = occupancy?.residenceName || 'Unknown';
                      let buildingName = occupancy?.buildingName || occupancy?.buildingId || '?';
                      let floorName = occupancy?.floorName || occupancy?.floorId || '?';
                      let roomName = occupancy?.roomName || occupancy?.roomId || '?';

                      if (isOccupied && residences.length > 0) {
                        const res = residences.find(r => r.id === occupancy.residenceId);
                        if (res) {
                          residenceName = res.name;
                          
                          if (occupancy.buildingId) {
                            const b = res.buildings?.find(b => b.id === occupancy.buildingId);
                            if (b) {
                              buildingName = b.name || b.id;
                              if (occupancy.floorId) {
                                const f = b.floors?.find(f => f.id === occupancy.floorId);
                                if (f) {
                                  floorName = f.name || f.id;
                                  if (occupancy.roomId) {
                                     const r = f.rooms?.find(r => r.id === occupancy.roomId);
                                     if (r) roomName = r.name || r.id;
                                  }
                                }
                              }
                            } else if (occupancy.roomId) {
                               const r = res.rooms?.find(r => r.id === occupancy.roomId);
                               if (r) roomName = r.name || r.id;
                            }
                          }
                        }
                      }

                      const canManageOccupancy = isOccupied && (
                        currentUser?.role === 'Admin' || 
                        (occupancy.residenceId && currentUser?.assignedResidences?.includes(occupancy.residenceId))
                      );
                      
                      return (
                      <div 
                        key={worker.id} 
                        className={`flex flex-col p-2 rounded border cursor-pointer transition-colors text-sm hover:bg-muted ${isOccupied ? 'bg-amber-50/50 border-amber-200' : ''}`}
                        onClick={() => toggleWorkerSelection(worker)}
                      >
                        {isOccupied ? (
                          // Occupied Worker Card Layout
                          <div className="flex justify-between items-start w-full">
                            <div className="flex items-start gap-2 flex-1">
                              <Checkbox 
                                checked={false}
                                onCheckedChange={() => toggleWorkerSelection(worker)}
                                className="mt-1 h-3 w-3"
                              />
                              <div className="flex-1">
                                {/* Line 1: Name */}
                                <div className="font-bold text-sm text-amber-950 mb-1">
                                  {worker.name} <span className="font-normal text-amber-900/70 text-xs">{worker.employeeId ? `(${worker.employeeId})` : ''}</span>
                                </div>
                                
                                {/* Line 2: Role . Nationality . Company */}
                                <div className="text-amber-800 mb-1 flex flex-wrap gap-1 items-center text-xs">
                                  <span className="font-medium">{worker.role || 'Worker'}</span>
                                  <span className="text-amber-400">•</span>
                                  <span>{worker.nationaliy || 'Unknown'}</span>
                                  <span className="text-amber-400">•</span>
                                  <span>{worker.company || 'No Company'}</span>
                                </div>

                                {/* Line 3: Residence . Building-Floor-Room . Date . Type */}
                                <div className="text-amber-700/80 flex flex-wrap gap-1 items-center text-[10px]">
                                  <span className="font-medium">{residenceName}</span>
                                  <span className="text-amber-300">•</span>
                                  <span>
                                    {buildingName}-{floorName}-{roomName}
                                  </span>
                                  <span className="text-amber-300">•</span>
                                  <span>{occupancy.since ? new Date(occupancy.since).toLocaleDateString() : '-'}</span>
                                  <span className="text-amber-300">•</span>
                                  <span className="font-medium text-amber-900">{occupancy.notes || (occupancy.isEmergency ? 'Emergency' : 'Standard')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Actions */}
                            <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                              <WorkerHistoryDialog workerId={worker.id} workerName={worker.name} />
                              
                              {canManageOccupancy && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 text-amber-700 hover:text-red-600 hover:bg-red-50"
                                  title="Check Out"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCheckoutWorker(worker);
                                    setCheckoutReason("End of Contract");
                                    setCheckoutCity("");
                                  }}
                                >
                                  <LogOut className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Standard Unassigned Worker Card Layout
                          <div className="flex items-start gap-2 justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <Checkbox 
                                checked={false}
                                onCheckedChange={() => toggleWorkerSelection(worker)}
                                className="mt-0.5 h-3 w-3"
                              />
                              <div className="overflow-hidden flex-1">
                                <div className="font-medium truncate">
                                  {worker.name} <span className="text-muted-foreground text-xs font-normal">{worker.employeeId ? `(${worker.employeeId})` : ''}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                                  <span className="truncate">{worker.company || 'No Company'}</span>
                                  <span>•</span>
                                  <span className="truncate">{worker.nationaliy || 'Unknown'}</span>
                                  <span>•</span>
                                  <span className="truncate">{worker.role || 'Worker'}</span>
                                </div>
                              </div>
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                              <WorkerHistoryDialog workerId={worker.id} workerName={worker.name} />
                            </div>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t mt-auto">
               <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleAutoAssign}
                  disabled={selectedWorkerIds.length === 0 || isAutoAssigning}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isAutoAssigning ? 'Assigning...' : `Auto Assign (${selectedWorkerIds.length})`}
                </Button>
            </div>
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

                      // Calculate Room Info (Nationality - Role)
                      let roomInfo = null;
                      if (roomOccupants.length > 0) {
                        const nationalities = new Set<string>();
                        const roles = new Set<string>();
                        
                        roomOccupants.forEach(occ => {
                          const w = workers.find(worker => worker.id === occ.workerId) || 
                                    roomOccupantDetails.find(worker => worker.id === occ.workerId);
                          if (w) {
                            if (w.nationaliy) nationalities.add(w.nationaliy);
                            if (w.role) roles.add(w.role);
                          }
                        });

                        const natStr = nationalities.size === 1 ? Array.from(nationalities)[0] : (nationalities.size > 1 ? 'Mixed' : '');
                        const roleStr = roles.size === 1 ? Array.from(roles)[0] : (roles.size > 1 ? 'Mixed' : '');
                        
                        if (natStr || roleStr) {
                          roomInfo = `${natStr}${natStr && roleStr ? ' - ' : ''}${roleStr}`;
                        }
                      }
                      
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
                            const dataStr = e.dataTransfer.getData("application/json");
                            if (!dataStr) return;
                            try {
                              const data = JSON.parse(dataStr);
                              
                              // CASE 1: Move Existing Worker
                              if (data.type === 'MOVE_WORKER') {
                                const { workerId, currentRoomId } = data;
                                if (currentRoomId === room.id) return; // Dropped in same room

                                if (confirm(`Move worker to ${room.name}?`)) {
                                  await bulkTransfer({
                                    workerIds: [workerId],
                                    toResidenceId: selectedResidenceId,
                                    toBuildingId: selectedBuildingId,
                                    toFloorId: selectedFloorId,
                                    toRoomId: room.id,
                                    performedBy: currentUser?.id || 'Admin',
                                    transferDate: new Date().toISOString(),
                                    reason: 'Drag and Drop Transfer'
                                  });
                                }
                                return;
                              }

                              // CASE 2: New Assignment
                              const { workerIds } = data;
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
                                  const lang = getUserLanguage();
                                  toast({ 
                                    title: getLocalizedMessage({ ar: 'تم التسكين', en: 'Assigned' }),
                                    description: getLocalizedMessage({ 
                                      ar: `تم نقل ${successfulIds.length} عامل إلى ${room.name}`,
                                      en: `Moved ${successfulIds.length} workers to ${room.name}`
                                    })
                                  });
                                }

                                if (failures.length > 0) {
                                  const lang = getUserLanguage();
                                  
                                  // Map error codes to bilingual user-friendly messages
                                  const errorMessages: Record<string, {ar: string, en: string}> = {
                                    'CHECKIN_IN_FUTURE': { ar: 'تاريخ مستقبلي', en: 'Future date' },
                                    'DATE_CONFLICT_WITH_HISTORY': { ar: 'تعارض تواريخ', en: 'Date conflict' },
                                    'nationality-mismatch': { ar: 'جنسية مختلفة', en: 'Nationality mismatch' },
                                    'role-mismatch': { ar: 'دور مختلف', en: 'Role mismatch' },
                                    'room-full': { ar: 'غرفة ممتلئة', en: 'Room full' },
                                    'worker-already-assigned': { ar: 'مسكّن بالفعل', en: 'Already assigned' }
                                  };
                                  
                                  const translatedErrors = failures
                                    .map((f: any) => {
                                      const errorCode = (f.error || '').split(':')[0].trim();
                                      const msg = errorMessages[errorCode];
                                      return msg ? getLocalizedMessage(msg) : f.error;
                                    })
                                    .filter(Boolean);
                                  const uniqueErrors = Array.from(new Set(translatedErrors));
                                  
                                  toast({ 
                                    title: getLocalizedMessage({ ar: 'مشاكل في التسكين', en: 'Check-in Issues' }),
                                    description: getLocalizedMessage({
                                      ar: `فشل تسكين ${failures.length} عامل. الأسباب: ${uniqueErrors.join("، ")}`,
                                      en: `Failed ${failures.length} worker(s). Reasons: ${uniqueErrors.join(", ")}`
                                    }),
                                    variant: "destructive" 
                                  });
                                }
                              } else {
                                // Handle complete failure
                                const failures = result.results ? Object.values(result.results).filter((r: any) => !r.success) : [];
                                if (failures.length > 0) {
                                  const lang = getUserLanguage();
                                  
                                  // Map error codes to bilingual user-friendly messages
                                  const errorMessages: Record<string, {ar: string, en: string}> = {
                                    'CHECKIN_IN_FUTURE': { ar: 'تاريخ مستقبلي', en: 'Future date' },
                                    'DATE_CONFLICT_WITH_HISTORY': { ar: 'تعارض تواريخ', en: 'Date conflict' },
                                    'nationality-mismatch': { ar: 'جنسية مختلفة', en: 'Nationality mismatch' },
                                    'role-mismatch': { ar: 'دور مختلف', en: 'Role mismatch' },
                                    'room-full': { ar: 'غرفة ممتلئة', en: 'Room full' }
                                  };
                                  
                                  const translatedErrors = failures
                                    .map((f: any) => {
                                      const errorCode = (f.error || '').split(':')[0].trim();
                                      const msg = errorMessages[errorCode];
                                      return msg ? getLocalizedMessage(msg) : f.error;
                                    })
                                    .filter(Boolean);
                                  const uniqueErrors = Array.from(new Set(translatedErrors));
                                  
                                  toast({ 
                                    title: getLocalizedMessage({ ar: 'فشل التسكين', en: 'Check-in Failed' }),
                                    description: getLocalizedMessage({
                                      ar: `الأسباب: ${uniqueErrors.join("، ")}`,
                                      en: `Reasons: ${uniqueErrors.join(", ")}`
                                    }),
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
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                              <div className="font-semibold text-sm shrink-0" title={room.name}>{room.name}</div>
                              {roomInfo && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 font-normal bg-muted text-muted-foreground hover:bg-muted truncate">
                                  {roomInfo}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <div onClick={e => e.stopPropagation()}>
                                <RoomHistoryDialog roomId={room.id} roomName={room.name || room.id} />
                              </div>
                              <Badge variant={isFull ? "destructive" : "secondary"} className="text-[10px] h-4 px-1">
                                {roomOccupants.length}/{capacity}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Occupants Visualization */}
                          <div className="flex flex-wrap gap-1">
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
                              <div 
                                key={occ.id || occ.workerId} 
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("application/json", JSON.stringify({
                                    type: 'MOVE_WORKER',
                                    workerId: occ.workerId,
                                    currentRoomId: selectedRoomId
                                  }));
                                }}
                                className={`flex items-start gap-2 p-2 rounded border text-sm group cursor-grab active:cursor-grabbing transition-colors ${selectedWorkerIds.includes(occ.workerId) ? 'bg-primary/10 border-primary' : 'bg-card hover:border-primary/50'}`}
                              >
                                <Checkbox 
                                  checked={selectedWorkerIds.includes(occ.workerId)}
                                  onCheckedChange={() => worker && toggleWorkerSelection(worker)}
                                  className="mt-1 h-3 w-3"
                                />
                                <div className="flex-1 overflow-hidden flex justify-between items-center">
                                  <div className="overflow-hidden">
                                    <div className="font-medium truncate">
                                      {worker?.name || 'Loading...'} <span className="text-muted-foreground text-xs font-normal">{worker?.employeeId ? `(${worker.employeeId})` : ''}</span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                                      <span className="truncate">{worker?.role || 'Worker'}</span>
                                      <span>•</span>
                                      <span className="truncate">{worker?.nationaliy || 'Unknown'}</span>
                                      {worker?.company && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">{worker.company}</span>
                                        </>
                                      )}
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
                                  <div className="flex items-center gap-1">
                                    <div onClick={e => e.stopPropagation()}>
                                      <WorkerHistoryDialog workerId={occ.workerId} workerName={worker?.name || 'Unknown'} />
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
                                          const lang = getUserLanguage();
                                          toast({ 
                                            title: getLocalizedMessage({ ar: 'تم الخروج', en: 'Checked Out' }),
                                            description: getLocalizedMessage({ ar: 'تم حذف العامل', en: 'Worker removed' })
                                          });
                                        }
                                      }}
                                    >
                                      <LogOut className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
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
                {(() => {
                  // Fix: Check both global occupants list AND local search results for occupancy status
                  // This handles cases where the global list is partial/paginated but we know the worker is occupied from the search check
                  const selectedAreAssigned = selectedWorkerIds.length > 0 && selectedWorkerIds.every(id => {
                    const inGlobal = occupants.some(o => o.workerId === id);
                    const inLocal = !!searchOccupancies[id];
                    return inGlobal || inLocal;
                  });
                  
                  const selectedAreUnassigned = selectedWorkerIds.length > 0 && selectedWorkerIds.every(id => {
                    const inGlobal = occupants.some(o => o.workerId === id);
                    const inLocal = !!searchOccupancies[id];
                    return !inGlobal && !inLocal;
                  });

                  const isMixed = selectedWorkerIds.length > 0 && !selectedAreAssigned && !selectedAreUnassigned;

                  return (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground">
                                {selectedAreAssigned ? 'Check-out Date' : 'Check-in Date'}
                            </label>
                            <Input 
                              type="date" 
                              className="h-7 text-xs" 
                              value={checkInDate}
                              onChange={(e) => setCheckInDate(e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground">
                                {selectedAreAssigned ? 'Reason' : 'Type'}
                            </label>
                            <Select value={checkInType} onValueChange={setCheckInType}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedAreAssigned ? (
                                    <>
                                        <SelectItem value="End of Contract">End of Contract</SelectItem>
                                        <SelectItem value="Transfer">Transfer</SelectItem>
                                        <SelectItem value="Vacation">Vacation</SelectItem>
                                        <SelectItem value="Termination">Termination</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="New Recruitment">New Recruitment</SelectItem>
                                        <SelectItem value="Return from Leave">Return from Leave</SelectItem>
                                        <SelectItem value="Another Accommodation">Another Accommodation</SelectItem>
                                        <SelectItem value="Outside Accommodation">Outside Accommodation</SelectItem>
                                    </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {selectedAreAssigned && checkInType === 'Transfer' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground">
                                Transfer to City
                            </label>
                            <Select value={bulkTransferCity} onValueChange={setBulkTransferCity}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Select City" />
                              </SelectTrigger>
                              <SelectContent>
                                {uniqueCities.map(city => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <Button 
                          className={`w-full ${selectedAreAssigned ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                          onClick={async () => {
                            if (selectedAreAssigned) {
                               if (checkInType === 'Transfer' && !bulkTransferCity) {
                                 const lang = getUserLanguage();
                                 toast({ 
                                   title: getLocalizedMessage({ ar: 'مدينة مطلوبة', en: 'City Required' }),
                                   description: getLocalizedMessage({ ar: 'يرجى اختيار المدينة للنقل', en: 'Please select a city for transfer' }),
                                   variant: "destructive" 
                                 });
                                 return;
                               }
                               if (!confirm(`Check out ${selectedWorkerIds.length} workers?`)) return;
                               const result = await bulkCheckOut({
                                    workerIds: selectedWorkerIds,
                                    performedBy: currentUser?.id || 'Admin',
                                    checkOutDate: new Date(checkInDate).toISOString(),
                                    reason: checkInType,
                                    transferCity: checkInType === 'Transfer' ? bulkTransferCity : undefined
                               });
                               if (result.ok) {
                                    const lang = getUserLanguage();
                                    toast({ 
                                      title: getLocalizedMessage({ ar: 'تم الخروج', en: 'Checked Out' }),
                                      description: getLocalizedMessage({
                                        ar: `تم خروج ${selectedWorkerIds.length} عامل بنجاح`,
                                        en: `Successfully checked out ${selectedWorkerIds.length} workers`
                                      })
                                    });
                                    setSelectedWorkerIds([]);
                                    setSelectedWorkers([]);
                                    setBulkTransferCity("");
                               } else {
                                    const lang = getUserLanguage();
                                    toast({ 
                                      title: getLocalizedMessage(UI_TEXT.titles.error),
                                      description: getLocalizedMessage({ ar: 'فشل خروج العمال', en: 'Failed to check out workers' }),
                                      variant: "destructive" 
                                    });
                               }
                            } else {
                               handleAssign();
                            }
                          }} 
                          disabled={(!selectedRoom && !selectedAreAssigned) || selectedWorkerIds.length === 0 || isMixed}
                        >
                          {selectedAreAssigned ? (
                              <>
                                Check Out {selectedWorkerIds.length > 0 ? `(${selectedWorkerIds.length})` : ''}
                                <LogOut className="ml-2 h-4 w-4" />
                              </>
                          ) : (
                              <>
                                Assign {selectedWorkerIds.length > 0 ? `(${selectedWorkerIds.length})` : ''}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                          )}
                        </Button>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "manage" && (
        <div>Manage Placeholder</div>
      )}

      <Dialog open={!!autoAssignResults} onOpenChange={(open) => !open && setAutoAssignResults(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Auto Assign Results</DialogTitle>
            <DialogDescription>
              Processed {autoAssignResults?.total} workers. Success: {autoAssignResults?.success}, Failed: {autoAssignResults?.failures}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {autoAssignResults?.details.map((result, i) => (
                <div key={i} className={`flex items-start space-x-4 p-3 rounded-lg border ${result.status === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className={`mt-1 ${result.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {result.status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{result.workerName}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                    {result.roomName && (
                      <div className="text-xs font-medium mt-1 text-muted-foreground">
                        Assigned to: <span className="text-foreground">{result.roomName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setAutoAssignResults(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkoutWorker} onOpenChange={(open) => !open && setCheckoutWorker(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check Out Worker</DialogTitle>
            <DialogDescription>
              Confirm check-out for {checkoutWorker?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="reason" className="text-right text-sm font-medium">
                Reason
              </label>
              <Select value={checkoutReason} onValueChange={setCheckoutReason}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="End of Contract">End of Contract</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Termination">Termination</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {checkoutReason === 'Transfer' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="city" className="text-right text-sm font-medium">
                  City
                </label>
                <Select value={checkoutCity} onValueChange={setCheckoutCity}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="checkout-date" className="text-sm font-medium">
                  تاريخ الخروج
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" dir="rtl">
                      <p className="text-sm">
                        • لا يمكن اختيار تاريخ في المستقبل<br/>
                        • لا يمكن تعديل السجلات في الشهور المفوترة<br/>
                        • يجب أن يكون تاريخ الخروج بعد تاريخ الدخول
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="checkout-date"
                type="date"
                value={checkoutDateValue}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (selectedDate > today) {
                    setCheckoutDateWarning('⚠️ لا يمكن اختيار تاريخ في المستقبل');
                  } else {
                    setCheckoutDateWarning('');
                  }
                  setCheckoutDateValue(e.target.value);
                }}
                className="w-full"
              />
              {checkoutDateWarning && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{checkoutDateWarning}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCheckoutWorker(null);
              setCheckoutDateWarning('');
              setCheckoutDateValue(new Date().toISOString().split('T')[0]);
            }}>إلغاء</Button>
            <Button 
              variant="destructive" 
              disabled={!!checkoutDateWarning}
              onClick={async () => {
              if (checkoutReason === 'Transfer' && !checkoutCity) {
                const lang = getUserLanguage();
                toast({ 
                  title: getLocalizedMessage({ ar: 'مدينة مطلوبة', en: 'City Required' }),
                  description: getLocalizedMessage({ ar: 'يرجى اختيار المدينة للنقل', en: 'Please select city for transfer' }),
                  variant: "destructive" 
                });
                return;
              }
              
              if (checkoutDateWarning) {
                return;
              }

              const date = checkoutDateValue;
              
              await checkOutWorkerEnhanced({
                workerId: checkoutWorker.id,
                performedBy: currentUser?.id || 'Admin',
                reason: checkoutReason,
                checkOutDate: date ? new Date(date).toISOString() : undefined,
                transferCity: checkoutReason === 'Transfer' ? checkoutCity : undefined
              });
              const lang = getUserLanguage();
              toast({ 
                title: getLocalizedMessage({ ar: 'تم الخروج', en: 'Checked Out' }),
                description: getLocalizedMessage({ ar: 'تم حذف العامل من الغرفة', en: 'Worker removed from room' })
              });
              handleSearch(searchQuery);
              setCheckoutWorker(null);
              setCheckoutCity("");
            }}>Confirm Check Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
