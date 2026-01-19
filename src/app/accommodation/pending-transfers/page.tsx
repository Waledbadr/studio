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
import { Search, MapPin, ArrowRight, Truck, RefreshCw, Users, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getUserLanguage, getLocalizedMessage, ERROR_MESSAGES, UI_TEXT } from '@/lib/i18n-helpers';

export default function PendingTransfersPage() {
  const { workers, loading, residences, bulkCheckIn, occupants, getTransferringWorkers, getWorkersByIds } = useAccommodation();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // NEW: Store transferring workers fetched from Firestore
  const [transferringWorkers, setTransferringWorkers] = useState<any[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  // NEW: Store last occupancies for transferring workers (to find source city)
  const [workerLastOccupancies, setWorkerLastOccupancies] = useState<Record<string, any>>({});
  // NEW: Store room occupants details (workers data)
  const [roomWorkersCache, setRoomWorkersCache] = useState<Record<string, any>>({});
  
  // Auto-Assign State
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [autoAssignResults, setAutoAssignResults] = useState<{
    total: number;
    success: number;
    failures: number;
    details: Array<{ workerId: string; workerName: string; roomName: string; residenceName: string; status: 'success' | 'error'; message?: string }>;
  } | null>(null);
  const [selectedForAutoAssign, setSelectedForAutoAssign] = useState<Set<string>>(new Set());
  
  // Effect 1: Fetch transferring workers on mount
  useEffect(() => {
    async function loadTransferringWorkers() {
      setIsLoadingTransfers(true);
      try {
        console.log('[PendingTransfers] Fetching transferring workers from Firestore...');
        const workers = await getTransferringWorkers();
        console.log(`[PendingTransfers] Loaded ${workers.length} transferring workers from Firestore`);
        setTransferringWorkers(workers);
      } catch (error) {
        console.error('[PendingTransfers] Failed to load transferring workers:', error);
        toast({ title: "Error", description: "Failed to load transferring workers", variant: "destructive" });
      } finally {
        setIsLoadingTransfers(false);
      }
    }
    loadTransferringWorkers();
  }, [getTransferringWorkers, toast]);

  // Effect 2: Calculate last occupancies when occupants or transferringWorkers change
  useEffect(() => {
    if (transferringWorkers.length === 0 || occupants.length === 0) {
      console.log('[PendingTransfers] Skipping occupancy calculation:', {
        transferringWorkersCount: transferringWorkers.length,
        occupantsCount: occupants.length
      });
      return;
    }
    
    console.log(`[PendingTransfers] Calculating last occupancies for ${transferringWorkers.length} workers from ${occupants.length} occupants...`);
    
    const lastOccMap: Record<string, any> = {};
    transferringWorkers.forEach((w: any) => {
      const workerOccs = occupants.filter(o => o.workerId === w.id);
      if (workerOccs.length > 0) {
        // Sort by since (most recent first)
        const sorted = workerOccs.sort((a, b) => {
          const dateA = new Date(a.since || 0).getTime();
          const dateB = new Date(b.since || 0).getTime();
          return dateB - dateA;
        });
        lastOccMap[w.id] = sorted[0];
        console.log(`[PendingTransfers] Worker ${w.name} (${w.id}) last occupancy:`, {
          residenceId: sorted[0].residenceId,
          roomId: sorted[0].roomId,
          since: sorted[0].since,
          until: sorted[0].until
        });
      } else {
        console.warn(`[PendingTransfers] No occupancy found for worker ${w.name} (${w.id})`);
      }
    });
    
    console.log(`[PendingTransfers] Found last occupancies for ${Object.keys(lastOccMap).length} workers`);
    setWorkerLastOccupancies(lastOccMap);
  }, [transferringWorkers, occupants]);
  
  // Assignment Dialog State
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [selectedResidenceId, setSelectedResidenceId] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInType, setCheckInType] = useState('Transfer');
  
  // Auto-Assign Target Residence
  const [autoAssignResidenceId, setAutoAssignResidenceId] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Reload transferring workers from Firestore
      console.log('[PendingTransfers] Syncing transferring workers...');
      const workers = await getTransferringWorkers();
      console.log(`[PendingTransfers] Synced ${workers.length} transferring workers`);
      setTransferringWorkers(workers);
      toast({ title: "Refreshed", description: `Loaded ${workers.length} transferring workers` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to sync data", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle selection for auto-assign
  const toggleWorkerSelection = (workerId: string) => {
    setSelectedForAutoAssign(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workerId)) {
        newSet.delete(workerId);
      } else {
        newSet.add(workerId);
      }
      return newSet;
    });
  };

  // Select all visible workers
  const selectAllWorkers = () => {
    const allIds = new Set(filtered.map(w => w.id));
    setSelectedForAutoAssign(allIds);
  };

  // Deselect all
  const deselectAllWorkers = () => {
    setSelectedForAutoAssign(new Set());
  };

  // Auto-Assign all selected workers to best available rooms
  const handleAutoAssign = async () => {
    if (selectedForAutoAssign.size === 0) {
      toast({ title: "Select Workers", description: "Please select workers for auto-assignment", variant: "destructive" });
      return;
    }

    if (!autoAssignResidenceId) {
      toast({ title: "Select Residence", description: "Please select target residence for auto-assignment", variant: "destructive" });
      return;
    }

    setIsAutoAssigning(true);
    const resultsDetails: Array<{ workerId: string; workerName: string; roomName: string; residenceName: string; status: 'success' | 'error'; message?: string }> = [];
    let successCount = 0;
    let failCount = 0;

    try {
      // Get workers to assign
      const workersToAssign = filtered.filter(w => selectedForAutoAssign.has(w.id));
      const targetResidence = accessibleResidences.find(r => r.id === autoAssignResidenceId);
      
      if (!targetResidence) {
        toast({ title: "Error", description: "Selected residence not found", variant: "destructive" });
        setIsAutoAssigning(false);
        return;
      }
      
      console.log(`[AutoAssign] Starting auto-assign for ${workersToAssign.length} workers to ${targetResidence.name}`);

      // Sort workers: Engineers -> Supervisors -> Workers
      const sortedWorkers = [...workersToAssign].sort((a, b) => {
        const roleScore = (r: string) => r === 'Engineer' ? 3 : r === 'Supervisor' ? 2 : 1;
        return roleScore(b.role || 'Worker') - roleScore(a.role || 'Worker');
      });

      // Build a list of all candidate rooms with their current state
      const allRooms: Array<{
        residenceId: string;
        residenceName: string;
        buildingId: string;
        floorId: string;
        roomId: string;
        roomName: string;
        capacity: number;
        currentOccupants: any[];
        roomNationality?: string;
        roomRole?: string;
      }> = [];

      if (targetResidence.buildings) {
        for (const building of targetResidence.buildings) {
          if (!building.floors) continue;
          for (const floor of building.floors) {
            if (!floor.rooms) continue;
            for (const room of floor.rooms) {
              const roomOccs = occupants.filter(o => 
                o.residenceId === targetResidence.id && 
                o.roomId === room.id && 
                !o.until
              );
              const occWorkers = roomOccs.map(o => roomWorkersCache[o.workerId]).filter(Boolean);
              
              allRooms.push({
                residenceId: targetResidence.id,
                residenceName: targetResidence.name,
                buildingId: building.id,
                floorId: floor.id,
                roomId: room.id,
                roomName: room.name || room.id,
                capacity: room.capacity || 6,
                currentOccupants: occWorkers,
                roomNationality: occWorkers[0]?.nationaliy?.toLowerCase?.()?.trim?.(),
                roomRole: occWorkers[0]?.role || undefined
              });
            }
          }
        }
      }

      // Track virtual assignments to update room state as we assign
      const virtualAssignments: Record<string, any[]> = {};

      // For each worker, find best room
      for (const worker of sortedWorkers) {
        const workerNat = worker.nationaliy?.toLowerCase?.()?.trim?.();
        const workerRole = worker.role || 'Worker';
        
        // Find all suitable rooms (sorted by score)
        const suitableRooms = allRooms
          .map(room => {
            const virtualOccs = virtualAssignments[room.roomId] || [];
            const totalOccupied = room.currentOccupants.length + virtualOccs.length;
            const available = room.capacity - totalOccupied;
            
            if (available <= 0) return null;
            
            // Determine room's nationality and role (from current or virtual occupants)
            const allOccs = [...room.currentOccupants, ...virtualOccs];
            const roomNat = allOccs[0]?.nationaliy?.toLowerCase?.()?.trim?.() || room.roomNationality;
            const roomRole = allOccs[0]?.role || room.roomRole;
            
            // Check nationality match (empty room = any nationality)
            if (roomNat && workerNat && roomNat !== workerNat) return null;
            
            // Check role match (empty room = any role)
            if (roomRole && roomRole !== workerRole) return null;
            
            // Calculate score (prefer fuller rooms with same nationality)
            const occupancyPercent = room.capacity > 0 ? (totalOccupied / room.capacity) * 100 : 0;
            const score = allOccs.length > 0 ? 1000 + occupancyPercent : 100;
            
            return { ...room, score, available };
          })
          .filter(Boolean)
          .sort((a, b) => b!.score - a!.score) as any[];

        if (suitableRooms.length === 0) {
          resultsDetails.push({
            workerId: worker.id,
            workerName: worker.name,
            roomName: '-',
            residenceName: targetResidence.name,
            status: 'error',
            message: 'No suitable room found (nationality/role/capacity)'
          });
          failCount++;
          continue;
        }

        // Try each suitable room until one succeeds
        let assigned = false;
        for (const room of suitableRooms) {
          try {
            const result = await bulkCheckIn({
              workerIds: [worker.id],
              residenceId: room.residenceId,
              buildingId: room.buildingId,
              floorId: room.floorId,
              roomId: room.roomId,
              checkInDate: new Date().toISOString(),
              notes: 'Transfer (Auto)',
              performedBy: currentUser?.id || 'Admin',
              emergencyMode: false
            });

            const workerResult = result.results[worker.id];
            if (workerResult?.success) {
              // Track this assignment virtually
              if (!virtualAssignments[room.roomId]) {
                virtualAssignments[room.roomId] = [];
              }
              virtualAssignments[room.roomId].push(worker);
              
              resultsDetails.push({
                workerId: worker.id,
                workerName: worker.name,
                roomName: room.roomName,
                residenceName: room.residenceName,
                status: 'success'
              });
              successCount++;
              assigned = true;
              break; // Success, move to next worker
            }
            // If failed, try next room
            console.log(`[AutoAssign] Room ${room.roomName} failed for ${worker.name}: ${workerResult?.error}, trying next...`);
          } catch (e: any) {
            console.log(`[AutoAssign] Room ${room.roomName} error for ${worker.name}: ${e.message}, trying next...`);
          }
        }

        if (!assigned) {
          resultsDetails.push({
            workerId: worker.id,
            workerName: worker.name,
            roomName: '-',
            residenceName: targetResidence.name,
            status: 'error',
            message: 'Assignment failed in all available rooms'
          });
          failCount++;
        }
      }

      // Show results
      setAutoAssignResults({
        total: workersToAssign.length,
        success: successCount,
        failures: failCount,
        details: resultsDetails
      });

      // Refresh workers list
      const updatedWorkers = await getTransferringWorkers();
      setTransferringWorkers(updatedWorkers);
      setSelectedForAutoAssign(new Set());

    } catch (e) {
      console.error('[AutoAssign] Error:', e);
      toast({ title: "Error", description: "An error occurred during auto-assignment", variant: "destructive" });
    } finally {
      setIsAutoAssigning(false);
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

  // Effect: Fetch worker details for room occupants when residence is selected
  useEffect(() => {
    async function fetchRoomOccupantsDetails() {
      if (!selectedResidenceId || !getWorkersByIds) return;
      
      // Get all active occupants for this residence
      const residenceOccupants = occupants.filter(
        o => o.residenceId === selectedResidenceId && !o.until
      );
      
      // Get unique worker IDs
      const workerIds = [...new Set(residenceOccupants.map(o => o.workerId))];
      
      if (workerIds.length === 0) return;
      
      try {
        console.log(`[PendingTransfers] Fetching ${workerIds.length} workers for room details...`);
        const fetchedWorkers = await getWorkersByIds(workerIds);
        
        // Build cache from fetched workers
        const newCache: Record<string, any> = {};
        fetchedWorkers.forEach(w => {
          newCache[w.id] = w;
        });
        setRoomWorkersCache(newCache);
        console.log(`[PendingTransfers] Cached ${fetchedWorkers.length} workers for room details`);
      } catch (error) {
        console.error('[PendingTransfers] Failed to fetch room occupants:', error);
      }
    }
    
    fetchRoomOccupantsDetails();
  }, [selectedResidenceId, occupants, getWorkersByIds]); // Removed roomWorkersCache to prevent infinite loop

  // Calculate room occupancy with details (nationality, role)
  const roomOccupancyDetails = useMemo(() => {
    const detailsMap: Record<string, {
      count: number;
      capacity: number;
      nationality?: string;
      role?: string;
      roomType?: string;
    }> = {};
    
    if (!selectedResidenceId) return detailsMap;
    
    // Get all active occupants for this residence
    const residenceOccupants = occupants.filter(
      o => o.residenceId === selectedResidenceId && !o.until
    );
    
    // Get worker details for each occupant
    residenceOccupants.forEach(o => {
      if (!o.roomId) return;
      
      // Find worker from cache, transferringWorkers, or context workers
      const worker = roomWorkersCache[o.workerId] || 
        transferringWorkers.find(w => w.id === o.workerId) || 
        workers.find((w: any) => w.id === o.workerId);
      
      if (!detailsMap[o.roomId]) {
        detailsMap[o.roomId] = {
          count: 0,
          capacity: 0,
          nationality: undefined,
          role: undefined,
          roomType: undefined
        };
      }
      
      detailsMap[o.roomId].count++;
      
      // Set nationality and role from first occupant
      if (!detailsMap[o.roomId].nationality && worker?.nationaliy) {
        detailsMap[o.roomId].nationality = worker.nationaliy;
      }
      if (!detailsMap[o.roomId].role && worker?.role) {
        detailsMap[o.roomId].role = worker.role;
      }
    });
    
    // Add room type and capacity from room definition
    rooms.forEach(room => {
      if (!detailsMap[room.id]) {
        detailsMap[room.id] = {
          count: 0,
          capacity: room.capacity || 6,
          nationality: undefined,
          role: undefined,
          roomType: room.roomType
        };
      } else {
        detailsMap[room.id].capacity = room.capacity || 6;
        detailsMap[room.id].roomType = room.roomType;
      }
    });
    
    return detailsMap;
  }, [occupants, selectedResidenceId, rooms, transferringWorkers, workers, roomWorkersCache]);

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

    console.log('[PendingTransfers] Assigning worker:', {
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      workerNationality: selectedWorker.nationaliy,
      workerRole: selectedWorker.role,
      residenceId: selectedResidenceId,
      buildingId: selectedBuildingId,
      floorId: selectedFloorId,
      roomId: selectedRoomId,
      checkInDate,
      checkInType
    });

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

      console.log('[PendingTransfers] bulkCheckIn result:', result);
      console.log('[PendingTransfers] All results:', JSON.stringify(result.results));
      console.log('[PendingTransfers] Worker ID we are looking for:', selectedWorker.id);

      // Check if this specific worker was assigned successfully
      const workerResult = result.results[selectedWorker.id];
      const workerSuccess = workerResult?.success === true;
      
      console.log('[PendingTransfers] Worker result:', workerResult, 'Success:', workerSuccess);

      // Check if any worker was successful (in case ID format differs)
      const allResults = Object.entries(result.results);
      const anySuccess = allResults.some(([_, r]: [string, any]) => r.success === true);
      
      console.log('[PendingTransfers] All results entries:', allResults);
      console.log('[PendingTransfers] Any success:', anySuccess);

      if (workerSuccess || (anySuccess && allResults.length === 1)) {
        toast({ title: "Assigned Successfully", description: `${selectedWorker.name} has been assigned successfully` });
        setAssignDialog(false);
        setSelectedWorker(null);
        // Refresh the transferring workers list
        const updatedWorkers = await getTransferringWorkers();
        setTransferringWorkers(updatedWorkers);
      } else {
        // Find the actual error from results
        const firstError = allResults.find(([_, r]: [string, any]) => r.error)?.[1] as any;
        console.error('[PendingTransfers] Assignment failed:', workerResult, 'First error:', firstError);
        
        const lang = getUserLanguage();
        
        // Map error codes to user-friendly messages
        const errorMessagesMap: Record<string, { ar: string; en: string }> = {
          'CHECKIN_IN_FUTURE': {
            ar: 'تاريخ التسكين لا يمكن أن يكون في المستقبل. الرجاء اختيار تاريخ اليوم أو تاريخ سابق',
            en: 'Check-in date cannot be in the future. Please select today or a past date'
          },
          'CHECKOUT_IN_FUTURE': ERROR_MESSAGES.CHECKOUT_IN_FUTURE,
          'DATE_CONFLICT_WITH_HISTORY': ERROR_MESSAGES.DATE_CONFLICT_WITH_HISTORY,
          'CHECKIN_BEFORE_LAST_CHECKOUT': ERROR_MESSAGES.CHECKIN_BEFORE_LAST_CHECKOUT,
          'MONTH_ALREADY_INVOICED': ERROR_MESSAGES.MONTH_ALREADY_INVOICED,
          'nationality-mismatch': ERROR_MESSAGES['nationality-mismatch'],
          'role-mismatch': ERROR_MESSAGES['role-mismatch'],
          'room-full': ERROR_MESSAGES['room-full'],
          'room-not-found': ERROR_MESSAGES['room-not-found'],
          'worker-not-found': ERROR_MESSAGES['worker-not-found'],
          'worker-already-assigned': ERROR_MESSAGES['worker-already-assigned']
        };
        
        const errorCode = workerResult?.error || firstError?.error || 'unknown';
        const cleanErrorCode = errorCode.split(':')[0].trim();
        const errorMsg = errorMessagesMap[cleanErrorCode] 
          ? getLocalizedMessage(errorMessagesMap[cleanErrorCode])
          : cleanErrorCode || getLocalizedMessage({ ar: 'فشل التسكين - سبب غير معروف', en: 'Assignment failed - unknown reason' });
        
        const finalMessage = allResults.length === 0 
          ? getLocalizedMessage({ ar: 'لم تتم معالجة العامل - تحقق من البيانات', en: 'Worker was not processed - check data' })
          : errorMsg;
        
        const dateStr = new Date(checkInDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
        
        toast({ 
          title: getLocalizedMessage(UI_TEXT.titles.assignmentFailed), 
          description: getLocalizedMessage({
            ar: `${finalMessage}\n\nالعامل: ${selectedWorker.name}\nالتاريخ: ${dateStr}`,
            en: `${finalMessage}\n\nWorker: ${selectedWorker.name}\nDate: ${dateStr}`
          }), 
          variant: "destructive",
          duration: 10000 // Show for 10 seconds
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

  // Normalize city names for comparison (handle different spellings)
  const normalizeCityName = (city: string | undefined): string => {
    if (!city) return '';
    const normalized = city.toLowerCase().trim();
    
    // Map common variations to standard names
    const cityMappings: Record<string, string> = {
      'jeddah': 'jeddah',
      'جدة': 'jeddah',
      'جده': 'jeddah',
      'makkah': 'makkah',
      'mecca': 'makkah',
      'مكة': 'makkah',
      'مكه': 'makkah',
      'riyadh': 'riyadh',
      'الرياض': 'riyadh',
      'dammam': 'dammam',
      'الدمام': 'dammam',
      'medina': 'medina',
      'المدينة': 'medina',
      'المدينة المنورة': 'medina',
    };
    
    return cityMappings[normalized] || normalized;
  };

  // Filter workers with status 'Transferring' and show in both source and destination cities
  // Now using transferringWorkers from Firestore instead of context workers
  const pendingTransfers = useMemo(() => {
    console.log('[PendingTransfers] === FILTERING WORKERS ===');
    console.log('[PendingTransfers] Total transferring workers from Firestore:', transferringWorkers.length);
    console.log('[PendingTransfers] Accessible cities:', accessibleCities);
    console.log('[PendingTransfers] Is Admin:', currentUser?.role === 'Admin');
    
    // Admin sees all transferring workers
    if (currentUser?.role === 'Admin') {
      console.log('[PendingTransfers] Admin user - showing all transferring workers');
      return transferringWorkers;
    }
    
    const transferring = transferringWorkers.filter(w => {
      console.log('[PendingTransfers] Checking worker:', { 
        id: w.id, 
        name: w.name, 
        employeeId: w.employeeId,
        status: w.status, 
        transferDestination: w.transferDestination
      });
      
      // If no destination, show to admin only (already handled above)
      if (!w.transferDestination) {
        console.warn(`⚠️ [PendingTransfers] Worker ${w.name} (${w.id}) has NO transferDestination.`);
        return false;
      }
      
      // Get last occupancy from pre-fetched data or from context
      const lastOccupancy = workerLastOccupancies[w.id] || occupants
        .filter(o => o.workerId === w.id)
        .sort((a, b) => new Date(b.since || 0).getTime() - new Date(a.since || 0).getTime())[0];
      
      const sourceResidence = lastOccupancy ? residences.find(r => r.id === lastOccupancy.residenceId) : null;
      const sourceCity = sourceResidence?.city;
      
      // Normalize city names for comparison
      const normalizedSourceCity = normalizeCityName(sourceCity);
      const normalizedDestination = normalizeCityName(w.transferDestination);
      const normalizedAccessibleCities = accessibleCities.map(c => normalizeCityName(c));
      
      // Show worker if user has access to EITHER source city OR destination city
      const hasAccessToSource = normalizedSourceCity && normalizedAccessibleCities.includes(normalizedSourceCity);
      const hasAccessToDestination = normalizedAccessibleCities.includes(normalizedDestination);
      
      const isAccessible = hasAccessToSource || hasAccessToDestination;
      
      console.log('[PendingTransfers] Is accessible?', {
        workerId: w.id,
        workerName: w.name,
        sourceCity,
        destination: w.transferDestination,
        normalizedSourceCity,
        normalizedDestination,
        accessibleCities,
        normalizedAccessibleCities,
        hasAccessToSource,
        hasAccessToDestination,
        isAccessible
      });
      
      if (!isAccessible) {
        console.warn(`⚠️ [PendingTransfers] Worker ${w.name} (${w.id}) is Transferring from ${sourceCity || 'Unknown'} to ${w.transferDestination}, but user has no access to either city. User cities:`, accessibleCities);
      }
      
      return isAccessible;
    });
    
    console.log('[PendingTransfers] === FILTERING COMPLETE ===');
    console.log('[PendingTransfers] Total transferring workers found:', transferring.length);
    
    return transferring;
  }, [transferringWorkers, occupants, residences, accessibleCities, currentUser, workerLastOccupancies]);

  // Filter by search
  const filtered = pendingTransfers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.employeeId && w.employeeId.includes(searchQuery)) ||
    (w.transferDestination && w.transferDestination.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Split workers into outgoing (from my residences) and incoming (to my residences)
  const { outgoingWorkers, incomingWorkers } = useMemo(() => {
    const outgoing: any[] = [];
    const incoming: any[] = [];
    
    // Get user's residence IDs and cities
    const userResidenceIds = accessibleResidences.map(r => r.id);
    const userCities = accessibleResidences.map(r => normalizeCityName(r.city));
    
    console.log('[PendingTransfers] Splitting workers. User residences:', userResidenceIds.length, 'User cities:', userCities);
    console.log('[PendingTransfers] Total filtered workers:', filtered.length);
    console.log('[PendingTransfers] workerLastOccupancies keys:', Object.keys(workerLastOccupancies).length);
    
    filtered.forEach(w => {
      // Find source residence - first check cached occupancies, then live occupants
      const cachedOccupancy = workerLastOccupancies[w.id];
      const liveOccupancy = occupants
        .filter(o => o.workerId === w.id)
        .sort((a, b) => new Date(b.since || 0).getTime() - new Date(a.since || 0).getTime())[0];
      
      const lastOccupancy = cachedOccupancy || liveOccupancy;
      
      const sourceResidence = lastOccupancy ? residences.find(r => r.id === lastOccupancy.residenceId) : null;
      const sourceResidenceId = sourceResidence?.id;
      const normalizedSourceCity = normalizeCityName(sourceResidence?.city);
      const normalizedDestination = normalizeCityName(w.transferDestination);
      
      // Check if worker is coming FROM user's residence (outgoing)
      const isOutgoingByResidence = sourceResidenceId && userResidenceIds.includes(sourceResidenceId);
      // OR if source city matches user's cities
      const isOutgoingByCity = normalizedSourceCity && userCities.includes(normalizedSourceCity);
      
      // Check if worker is going TO user's city (incoming)
      const isIncoming = normalizedDestination && userCities.includes(normalizedDestination);
      
      // Also show as outgoing if no occupancy but destination is NOT user's city (they're leaving somewhere)
      const noOccupancyOutgoing = !lastOccupancy && normalizedDestination && !userCities.includes(normalizedDestination);
      
      // Add source info to worker
      const workerWithSource = {
        ...w,
        sourceResidenceId,
        sourceResidenceName: sourceResidence?.name,
        sourceCity: sourceResidence?.city || 'Unknown'
      };
      
      console.log(`[PendingTransfers] Worker ${w.name}: source=${sourceResidence?.name || 'none'}, dest=${w.transferDestination}, isOutgoing=${isOutgoingByResidence || isOutgoingByCity}, isIncoming=${isIncoming}`);
      
      if (isOutgoingByResidence || isOutgoingByCity) {
        outgoing.push(workerWithSource);
      }
      if (isIncoming) {
        incoming.push(workerWithSource);
      }
      
      // If worker doesn't fit either category but has a transfer destination,
      // show in incoming if destination matches, otherwise show in a general list
      if (!isOutgoingByResidence && !isOutgoingByCity && !isIncoming) {
        // Show all unmatched workers in incoming for action
        incoming.push(workerWithSource);
      }
    });
    
    console.log(`[PendingTransfers] Split result: ${outgoing.length} outgoing, ${incoming.length} incoming`);
    
    return { outgoingWorkers: outgoing, incomingWorkers: incoming };
  }, [filtered, accessibleResidences, workerLastOccupancies, occupants, residences]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pending Transfers</h2>
          <p className="text-muted-foreground">Workers being transferred between locations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {selectedForAutoAssign.size > 0 && (
            <>
              <Select value={autoAssignResidenceId} onValueChange={setAutoAssignResidenceId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Residence" />
                </SelectTrigger>
                <SelectContent>
                  {accessibleResidences.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} - {r.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAutoAssign}
                disabled={isAutoAssigning || !autoAssignResidenceId}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAutoAssigning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Auto Assign ({selectedForAutoAssign.size})
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoadingTransfers ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="h-12 w-12 mb-4 opacity-20 animate-spin" />
          <p>Loading transferring workers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Outgoing Workers */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-orange-700 dark:text-orange-300">
                      Outgoing Workers
                    </CardTitle>
                    <CardDescription>Workers leaving to another residence</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  {outgoingWorkers.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {outgoingWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Truck className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No outgoing transfers from your residences</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Destination</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outgoingWorkers.map((worker) => (
                        <TableRow key={`out-${worker.id}`}>
                          <TableCell>
                            <div className="font-medium">{worker.name}</div>
                            <div className="text-xs text-muted-foreground">{worker.employeeId}</div>
                          </TableCell>
                          <TableCell className="text-sm">{worker.role || 'Worker'}</TableCell>
                          <TableCell className="text-sm">{worker.nationaliy || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="flex w-fit items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {worker.sourceResidenceName || worker.sourceCity || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex w-fit items-center gap-1 text-orange-600">
                              <ArrowRight className="h-3 w-3" />
                              {worker.transferDestination}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incoming Workers */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="bg-green-50 dark:bg-green-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-green-700 dark:text-green-300">
                      Incoming Workers
                    </CardTitle>
                    <CardDescription>Workers arriving for accommodation</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {incomingWorkers.length}
                </Badge>
              </div>
              {incomingWorkers.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const ids = new Set(incomingWorkers.map(w => w.id));
                      setSelectedForAutoAssign(ids);
                    }}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  {selectedForAutoAssign.size > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={deselectAllWorkers}
                      className="text-xs"
                    >
                      Deselect All
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {incomingWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Truck className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No incoming transfers to your residences</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedForAutoAssign.size === incomingWorkers.length && incomingWorkers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedForAutoAssign(new Set(incomingWorkers.map(w => w.id)));
                              } else {
                                deselectAllWorkers();
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Worker</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingWorkers.map((worker) => {
                        const isSelected = selectedForAutoAssign.has(worker.id);
                        return (
                          <TableRow key={`in-${worker.id}`} className={isSelected ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleWorkerSelection(worker.id)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{worker.name}</div>
                              <div className="text-xs text-muted-foreground">{worker.employeeId}</div>
                            </TableCell>
                            <TableCell className="text-sm">{worker.role || 'Worker'}</TableCell>
                            <TableCell className="text-sm">{worker.nationaliy || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="flex w-fit items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {worker.sourceCity || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAssignClick(worker)}
                              >
                                Assign Room
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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
                      <div className="grid grid-cols-5 gap-2 max-h-[280px] overflow-y-auto p-1">
                        {rooms.map(room => {
                          const isSelected = selectedRoomId === room.id;
                          const details = roomOccupancyDetails[room.id] || { count: 0, capacity: room.capacity || 6 };
                          const capacity = details.capacity || room.capacity || 6;
                          const occupied = details.count;
                          const available = capacity - occupied;
                          const isFull = available <= 0;
                          const roomNationality = details.nationality;
                          const roomRole = details.role || details.roomType || room.roomType;
                          
                          // Build info text (e.g., "Indian - Worker")
                          const infoText = [roomNationality, roomRole].filter(Boolean).join(' • ');
                          
                          return (
                            <div
                              key={room.id}
                              onClick={() => !isFull && setSelectedRoomId(room.id)}
                              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                isFull 
                                  ? 'border-border bg-muted/50 cursor-not-allowed opacity-50' 
                                  : isSelected
                                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50 hover:shadow'
                              }`}
                            >
                              {/* Room Header with number and occupancy */}
                              <div className="flex items-center justify-between mb-2">
                                <div className={`text-lg font-bold ${isSelected ? 'text-primary' : ''}`}>
                                  {room.name || room.id}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{occupied}/{capacity}</span>
                                </div>
                              </div>
                              
                              {/* Nationality and Role info */}
                              {infoText && (
                                <div className="text-xs text-muted-foreground truncate mb-1" title={infoText}>
                                  {infoText}
                                </div>
                              )}
                              
                              {/* Availability status */}
                              <div className="text-xs">
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

      {/* Auto-Assign Results Dialog */}
      <Dialog open={!!autoAssignResults} onOpenChange={(open) => !open && setAutoAssignResults(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Auto-Assignment Results
            </DialogTitle>
            <DialogDescription>
              Processed {autoAssignResults?.total} workers. 
              Success: <span className="text-green-600 font-semibold">{autoAssignResults?.success}</span>, 
              Failed: <span className="text-red-600 font-semibold">{autoAssignResults?.failures}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Residence</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autoAssignResults?.details.map((result, i) => (
                  <TableRow key={i} className={result.status === 'success' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}>
                    <TableCell>
                      {result.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{result.workerName}</TableCell>
                    <TableCell>{result.residenceName}</TableCell>
                    <TableCell>{result.roomName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.message || (result.status === 'success' ? 'Assigned successfully' : '')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setAutoAssignResults(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
