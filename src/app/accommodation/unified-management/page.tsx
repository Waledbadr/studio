"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useResidences } from "@/context/residences-context";
import { useAccommodation } from "@/context/accommodation-context";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Building2,
  Users,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Search,
  Filter,
  Home,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers3,
  DoorOpen,
  MapPin,
  User,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { WorkerCard } from "@/components/accommodation/worker-card";
import { ResidenceRoomSelector } from "@/components/accommodation/residence-room-selector";

type ActionType = 'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER' | 'SWAP' | null;

interface WorkerWithStatus {
  id: string;
  name: string;
  employeeId?: string;
  nationaliy?: string;
  company?: string;
  role?: string;
  isAssigned: boolean;
  currentResidence?: string;
  currentRoom?: string;
  residenceName?: string;
  roomName?: string;
  checkInDate?: string;
}

export default function UnifiedManagementPage() {
  const { residences } = useResidences();
  const { 
    workers, 
    occupants, 
    checkInWorker, 
    checkOutWorkerEnhanced,
    transferWorker,
    swapWorkers,
  } = useAccommodation();
  const { toast } = useToast();

  // Auth state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');

  // UI State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, assigned, unassigned
  const [selectedResidence, setSelectedResidence] = useState<string>('all');

  // Action Dialog State
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: ActionType;
    workerId?: string;
    workerName?: string;
  }>({ open: false, type: null });

  // Form State
  const [actionForm, setActionForm] = useState({
    residenceId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    targetResidenceId: '',
    targetBuildingId: '',
    targetFloorId: '',
    targetRoomId: '',
    swapTargetWorkerId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  // Selection state for batch operations
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  // Debug: Log data status
  useEffect(() => {
    console.log('🔍 [UnifiedManagement] Data Status:', {
      workers: workers.length,
      occupants: occupants.length,
      residences: residences.length,
      currentUserId,
      userRole,
    });
    
    // Log detailed residence structure for debugging room issues
    if (residences.length > 0) {
      console.log('🏘️ [UnifiedManagement] Residences Structure:', 
        residences.map(r => ({
          id: r.id,
          name: r.name,
          buildings: r.buildings?.length || 0,
          totalRooms: r.buildings?.reduce((sum, b) => 
            sum + (b.floors?.reduce((fsum, f) => fsum + (f.rooms?.length || 0), 0) || 0), 0
          ) || r.rooms?.length || 0
        }))
      );
    }
    
    // Log a sample worker and occupant for debugging
    if (workers.length > 0) {
      console.log('👷 [UnifiedManagement] Sample Worker:', workers[0]);
    }
    if (occupants.length > 0) {
      console.log('🛏️ [UnifiedManagement] Sample Occupant:', occupants[0]);
    }
  }, [workers, occupants, residences, currentUserId, userRole]);

  // Get current user
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          if (!db) return;
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || null);
            setUserName(userData.name || userData.displayName || 'User');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      } else {
        setCurrentUserId(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter accessible residences based on role
  const accessibleResidences = useMemo(() => {
    if (!currentUserId) return residences;
    if (userRole === 'Admin') return residences;
    return residences.filter(r => !r.managerId || r.managerId === currentUserId);
  }, [residences, currentUserId, userRole]);

  // Get all nationalities
  const nationalities = useMemo(() => {
    const nats = new Set<string>();
    workers.forEach(w => {
      if (w.nationaliy) nats.add(w.nationaliy);
    });
    return Array.from(nats).sort();
  }, [workers]);
  // Find room helper (function declaration - hoisted) - supports both hierarchical and flat structures
  function findRoom(residenceId: string, roomId: string) {
    const residence = residences.find(r => r.id === residenceId);
    if (!residence) {
      console.warn('⚠️ [findRoom] Residence not found:', residenceId);
      return null;
    }
    
    // Try hierarchical structure first (Complex -> Building -> Floor -> Room)
    if (residence.buildings && residence.buildings.length > 0) {
      for (const building of residence.buildings) {
        if (building.floors && building.floors.length > 0) {
          for (const floor of building.floors) {
            if (floor.rooms && floor.rooms.length > 0) {
              const room = floor.rooms.find(r => r.id === roomId);
              if (room) {
                console.log('✅ [findRoom] Found in hierarchy:', { 
                  residenceId, 
                  residenceName: residence.name,
                  buildingId: building.id, 
                  buildingName: building.name,
                  floorId: floor.id, 
                  floorName: floor.name,
                  roomId,
                  roomName: room.name 
                });
                return room;
              }
            }
          }
        }
      }
    }
    
    // Fallback to flat structure (Complex -> Rooms directly)
    if (residence.rooms && residence.rooms.length > 0) {
      const room = residence.rooms.find(r => r.id === roomId);
      if (room) {
        console.log('✅ [findRoom] Found in flat structure:', { 
          residenceId, 
          residenceName: residence.name,
          roomId,
          roomName: room.name 
        });
        return room;
      }
    }
    
    console.warn('⚠️ [findRoom] Room not found:', { 
      residenceId, 
      roomId, 
      residenceName: residence.name,
      hasBuildings: !!residence.buildings, 
      buildingsCount: residence.buildings?.length || 0,
      hasRooms: !!residence.rooms,
      roomsCount: residence.rooms?.length || 0
    });
    return null;
  }

  // Prepare workers with status
  const workersWithStatus = useMemo((): WorkerWithStatus[] => {
    console.log('[UnifiedManagement] Workers count:', workers.length);
    console.log('[UnifiedManagement] Occupants count:', occupants.length);
    console.log('[UnifiedManagement] Residences count:', residences.length);
    
    return workers.map(worker => {
      const occupant = occupants.find(o => o.workerId === worker.id && !o.until);
      if (occupant) {
        const residence = residences.find(r => r.id === occupant.residenceId);
        const room = findRoom(occupant.residenceId, occupant.roomId);
        return {
          ...worker,
          isAssigned: true,
          currentResidence: occupant.residenceId,
          currentRoom: occupant.roomId,
          residenceName: residence?.name,
          roomName: room?.name,
          checkInDate: occupant.since,
        };
      }
      return {
        ...worker,
        isAssigned: false,
      };
    });
  }, [workers, occupants, residences]);

  

  // Filter workers
  const filteredWorkers = useMemo(() => {
    let filtered = workersWithStatus;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.employeeId?.toLowerCase().includes(q) ||
        w.nationaliy?.toLowerCase().includes(q) ||
        w.company?.toLowerCase().includes(q)
      );
    }

    // Nationality filter
    if (nationalityFilter !== 'all') {
      filtered = filtered.filter(w => w.nationaliy === nationalityFilter);
    }

    // Status filter
    if (statusFilter === 'assigned') {
      filtered = filtered.filter(w => w.isAssigned);
    } else if (statusFilter === 'unassigned') {
      filtered = filtered.filter(w => !w.isAssigned);
    }

    // Residence filter
    if (selectedResidence !== 'all') {
      filtered = filtered.filter(w => w.currentResidence === selectedResidence);
    }

    return filtered;
  }, [workersWithStatus, searchQuery, nationalityFilter, statusFilter, selectedResidence]);

  // Statistics
  const stats = useMemo(() => {
    const totalWorkers = workers.length;
    const assignedWorkers = workersWithStatus.filter(w => w.isAssigned).length;
    const unassignedWorkers = totalWorkers - assignedWorkers;
    
    const totalRooms = residences.reduce((sum, r) => {
      let count = r.rooms?.length || 0;
      if (r.buildings) {
        r.buildings.forEach(b => {
          b.floors?.forEach(f => {
            count += f.rooms?.length || 0;
          });
        });
      }
      return sum + count;
    }, 0);

    const occupiedRooms = new Set(occupants.filter(o => !o.until).map(o => o.roomId)).size;
    const availableRooms = totalRooms - occupiedRooms;

    const totalCapacity = residences.reduce((sum, r) => {
      let cap = 0;
      const calcCap = (spaceSqm: number, roomType: string) => {
        const baseArea = roomType === "Worker" ? 4 : roomType === "Supervisor" ? 6 : 8;
        return Math.floor(spaceSqm / baseArea);
      };
      
      r.rooms?.forEach(room => {
        if ((room as any).spaceSqm && (room as any).roomType) {
          cap += room.capacity || calcCap((room as any).spaceSqm, (room as any).roomType);
        }
      });
      
      r.buildings?.forEach(b => {
        b.floors?.forEach(f => {
          f.rooms?.forEach(room => {
            if ((room as any).spaceSqm && (room as any).roomType) {
              cap += room.capacity || calcCap((room as any).spaceSqm, (room as any).roomType);
            }
          });
        });
      });
      
      return sum + cap;
    }, 0);

    const occupancyRate = totalCapacity > 0 ? ((assignedWorkers / totalCapacity) * 100).toFixed(1) : '0';

    return {
      totalWorkers,
      assignedWorkers,
      unassignedWorkers,
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalCapacity,
      occupancyRate,
    };
  }, [workers, workersWithStatus, residences, occupants]);

  // Get buildings for selected residence
  const getBuildings = (residenceId: string) => {
    const residence = residences.find(r => r.id === residenceId);
    return residence?.buildings || [];
  };

  // Get floors for selected building
  const getFloors = (residenceId: string, buildingId: string) => {
    const buildings = getBuildings(residenceId);
    const building = buildings.find(b => b.id === buildingId);
    return building?.floors || [];
  };

  // Get rooms for selected floor
  const getRooms = (residenceId: string, buildingId: string, floorId: string) => {
    const floors = getFloors(residenceId, buildingId);
    const floor = floors.find(f => f.id === floorId);
    return floor?.rooms || [];
  };

  // Get available rooms with capacity info
  const getAvailableRoomsWithInfo = (residenceId: string) => {
    const residence = residences.find(r => r.id === residenceId);
    if (!residence) return [];

    const rooms: Array<{
      id: string;
      name: string;
      capacity: number;
      occupied: number;
      available: number;
      buildingId?: string;
      floorId?: string;
    }> = [];

    const calcCap = (spaceSqm: number, roomType: string) => {
      const baseArea = roomType === "Worker" ? 4 : roomType === "Supervisor" ? 6 : 8;
      return Math.floor(spaceSqm / baseArea);
    };

    const addRoom = (room: any, buildingId?: string, floorId?: string) => {
      const capacity = room.capacity || calcCap(room.spaceSqm || 20, room.roomType || 'Worker');
      const occupied = occupants.filter(o => 
        o.roomId === room.id && 
        o.residenceId === residenceId && 
        !o.until
      ).length;
      
      rooms.push({
        id: room.id,
        name: room.name || `Room ${room.id}`,
        capacity,
        occupied,
        available: capacity - occupied,
        buildingId,
        floorId,
      });
    };

    // Add direct rooms
    residence.rooms?.forEach(room => addRoom(room));

    // Add rooms from buildings
    residence.buildings?.forEach(building => {
      building.floors?.forEach(floor => {
        floor.rooms?.forEach(room => addRoom(room, building.id, floor.id));
      });
    });

    return rooms.filter(r => r.available > 0);
  };

  // Handle action
  const handleOpenAction = (type: ActionType, workerId?: string, workerName?: string) => {
    setActionDialog({ open: true, type, workerId, workerName });
    setActionForm({
      residenceId: '',
      buildingId: '',
      floorId: '',
      roomId: '',
      targetResidenceId: '',
      targetBuildingId: '',
      targetFloorId: '',
      targetRoomId: '',
      swapTargetWorkerId: '',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    });
  };

  const handleCloseAction = () => {
    setActionDialog({ open: false, type: null });
    setActionForm({
      residenceId: '',
      buildingId: '',
      floorId: '',
      roomId: '',
      targetResidenceId: '',
      targetBuildingId: '',
      targetFloorId: '',
      targetRoomId: '',
      swapTargetWorkerId: '',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    });
  };

  const handleSubmitAction = async () => {
    if (!actionDialog.workerId || !actionDialog.type) return;

    try {
      let result: { ok: boolean; error?: string };

      switch (actionDialog.type) {
        case 'CHECK_IN':
          if (!actionForm.residenceId || !actionForm.roomId) {
            toast({
              title: "خطأ",
              description: "الرجاء اختيار المسكن والغرفة",
              variant: "destructive",
            });
            return;
          }
          result = await checkInWorker({
            workerId: actionDialog.workerId,
            residenceId: actionForm.residenceId,
            roomId: actionForm.roomId,
            buildingId: actionForm.buildingId || undefined,
            floorId: actionForm.floorId || undefined,
            checkInDate: actionForm.date,
            notes: actionForm.notes,
            performedBy: userName,
          });
          break;

        case 'CHECK_OUT':
          result = await checkOutWorkerEnhanced({
            workerId: actionDialog.workerId,
            checkOutDate: actionForm.date,
            reason: actionForm.reason,
            notes: actionForm.notes,
            performedBy: userName,
          });
          break;

        case 'TRANSFER':
          if (!actionForm.targetResidenceId || !actionForm.targetRoomId) {
            toast({
              title: "خطأ",
              description: "الرجاء اختيار المسكن والغرفة الجديدة",
              variant: "destructive",
            });
            return;
          }
          result = await transferWorker({
            workerId: actionDialog.workerId,
            toResidenceId: actionForm.targetResidenceId,
            toRoomId: actionForm.targetRoomId,
            toBuildingId: actionForm.targetBuildingId || undefined,
            toFloorId: actionForm.targetFloorId || undefined,
            transferDate: actionForm.date,
            reason: actionForm.reason,
            notes: actionForm.notes,
            performedBy: userName,
          });
          break;

        case 'SWAP':
          if (!actionForm.swapTargetWorkerId) {
            toast({
              title: "خطأ",
              description: "الرجاء اختيار العامل للمبادلة",
              variant: "destructive",
            });
            return;
          }
          result = await swapWorkers({
            worker1Id: actionDialog.workerId,
            worker2Id: actionForm.swapTargetWorkerId,
            swapDate: actionForm.date,
            reason: actionForm.reason,
            notes: actionForm.notes,
            performedBy: userName,
          });
          break;

        default:
          return;
      }

      if (result.ok) {
        toast({
          title: "نجحت العملية ✅",
          description: `تمت ${getActionLabel(actionDialog.type)} بنجاح`,
        });
        handleCloseAction();
      } else {
        toast({
          title: "فشلت العملية",
          description: result.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Action error:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تنفيذ العملية",
        variant: "destructive",
      });
    }
  };

  const getActionLabel = (type: ActionType) => {
    switch (type) {
      case 'CHECK_IN': return 'التسكين';
      case 'CHECK_OUT': return 'الإخراج';
      case 'TRANSFER': return 'النقل';
      case 'SWAP': return 'المبادلة';
      default: return '';
    }
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'CHECK_IN': return <LogIn className="h-5 w-5" />;
      case 'CHECK_OUT': return <LogOut className="h-5 w-5" />;
      case 'TRANSFER': return <ArrowRightLeft className="h-5 w-5" />;
      case 'SWAP': return <RefreshCw className="h-5 w-5" />;
      default: return null;
    }
  };

  // Toggle worker selection
  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              يتطلب تسجيل الدخول
            </CardTitle>
            <CardDescription>
              الرجاء تسجيل الدخول للوصول إلى نظام إدارة التسكين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Home className="h-8 w-8" />
            إدارة التسكين الموحدة
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام شامل لإدارة تسكين العمالة بسهولة وفعالية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <User className="h-3 w-3 mr-1" />
            {userName}
          </Badge>
          {userRole && (
            <Badge variant="secondary">{userRole}</Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي العمال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.totalWorkers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.assignedWorkers} مسكّن • {stats.unassignedWorkers} غير مسكّن
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الغرف المتاحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.availableRooms}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  من أصل {stats.totalRooms} غرفة
                </p>
              </div>
              <DoorOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              السعة الكلية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.totalCapacity}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.assignedWorkers} / {stats.totalCapacity} مشغول
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              نسبة الإشغال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.occupancyRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  من السعة الكلية
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <Users className="h-4 w-4 mr-2" />
            لوحة العمال
          </TabsTrigger>
          <TabsTrigger value="residences">
            <Building2 className="h-4 w-4 mr-2" />
            المساكن والغرف
          </TabsTrigger>
          <TabsTrigger value="batch">
            <RefreshCw className="h-4 w-4 mr-2" />
            العمليات الجماعية
          </TabsTrigger>
        </TabsList>

        {/* Workers Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إدارة العمال</CardTitle>
              <CardDescription>
                ابحث عن العمال وقم بعمليات التسكين والإخراج والنقل بسهولة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم، الرقم الوظيفي..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الجنسيات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الجنسيات</SelectItem>
                    {nationalities.map(nat => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="assigned">مسكّن</SelectItem>
                    <SelectItem value="unassigned">غير مسكّن</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedResidence} onValueChange={setSelectedResidence}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل المساكن" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المساكن</SelectItem>
                    {accessibleResidences.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Workers List */}
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {/* Debug Info */}
        {workers.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-2">⚠️ لا توجد بيانات عمال</p>
                <p className="text-sm mb-2">يرجى التحقق من:</p>
                <ul className="text-sm space-y-1 list-disc list-inside mr-2">
                  <li>تسجيل الدخول بحساب صحيح</li>
                  <li>وجود اتصال بالإنترنت</li>
                  <li>صلاحيات Firestore (افتح Console واضغط F12)</li>
                  <li>وجود بيانات عمال في قاعدة البيانات</li>
                </ul>
                <div className="mt-3 flex gap-3">
                  <a
                    href="/accommodation/quick-add-workers"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    إضافة عمال جدد
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    تحديث الصفحة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}                  {filteredWorkers.length === 0 && workers.length > 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>لا توجد نتائج تطابق البحث</p>
                      <p className="text-sm mt-2">جرب تغيير الفلاتر أو مسح البحث</p>
                    </div>
                  ) : filteredWorkers.length > 0 ? (
                    filteredWorkers.map((worker) => (
                      <WorkerCard
                        key={worker.id}
                        worker={worker}
                        onCheckIn={() => handleOpenAction('CHECK_IN', worker.id, worker.name)}
                        onCheckOut={() => handleOpenAction('CHECK_OUT', worker.id, worker.name)}
                        onTransfer={() => handleOpenAction('TRANSFER', worker.id, worker.name)}
                        onSwap={() => handleOpenAction('SWAP', worker.id, worker.name)}
                        onViewTimeline={() => window.location.href = `/accommodation/worker-timeline/${worker.id}`}
                        selected={selectedWorkers.includes(worker.id)}
                        onSelect={() => toggleWorkerSelection(worker.id)}
                      />
                    ))
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Residences View */}
        <TabsContent value="residences">
          <Card>
            <CardHeader>
              <CardTitle>المساكن والغرف</CardTitle>
              <CardDescription>
                عرض تفصيلي للمساكن والغرف مع حالة الإشغال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-2">قريباً</p>
                <p className="text-sm">عرض تفصيلي للمساكن والغرف</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Operations */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>العمليات الجماعية</CardTitle>
              <CardDescription>
                تنفيذ عمليات التسكين والإخراج والنقل لمجموعة من العمال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-2">قريباً</p>
                <p className="text-sm">عمليات جماعية متقدمة</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={handleCloseAction}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {getActionIcon(actionDialog.type)}
              {getActionLabel(actionDialog.type)} - {actionDialog.workerName}
            </DialogTitle>
            <DialogDescription>
              املأ البيانات المطلوبة لإتمام العملية
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={actionForm.date}
                onChange={(e) => setActionForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Check-In Form */}
            {actionDialog.type === 'CHECK_IN' && (
              <ResidenceRoomSelector
                residences={accessibleResidences}
                occupants={occupants}
                value={{
                  residenceId: actionForm.residenceId,
                  buildingId: actionForm.buildingId,
                  floorId: actionForm.floorId,
                  roomId: actionForm.roomId,
                }}
                onChange={(value) => setActionForm(prev => ({ ...prev, ...value }))}
                showOnlyAvailable={true}
                label="اختر المسكن والغرفة للتسكين"
              />
            )}

            {/* Transfer Form */}
            {actionDialog.type === 'TRANSFER' && (
              <>
                <ResidenceRoomSelector
                  residences={accessibleResidences}
                  occupants={occupants}
                  value={{
                    residenceId: actionForm.targetResidenceId,
                    buildingId: actionForm.targetBuildingId,
                    floorId: actionForm.targetFloorId,
                    roomId: actionForm.targetRoomId,
                  }}
                onChange={(value) => setActionForm(prev => ({
                  ...prev,
                  targetResidenceId: value.residenceId,
                  targetBuildingId: value.buildingId || '',
                  targetFloorId: value.floorId || '',
                  targetRoomId: value.roomId,
                }))}
                  showOnlyAvailable={true}
                  label="اختر المسكن والغرفة الجديدة"
                />

                <div className="space-y-2">
                  <Label htmlFor="reason">سبب النقل</Label>
                  <Input
                    id="reason"
                    placeholder="مثال: طلب العامل، صيانة المسكن..."
                    value={actionForm.reason}
                    onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Swap Form */}
            {actionDialog.type === 'SWAP' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="swapTarget">العامل المراد المبادلة معه *</Label>
                  <Select
                    value={actionForm.swapTargetWorkerId}
                    onValueChange={(value: string) => setActionForm(prev => ({ ...prev, swapTargetWorkerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العامل" />
                    </SelectTrigger>
                    <SelectContent>
                      {workersWithStatus
                        .filter(w => w.isAssigned && w.id !== actionDialog.workerId)
                        .map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} - {w.residenceName} / {w.roomName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">سبب المبادلة</Label>
                  <Input
                    id="reason"
                    placeholder="مثال: اتفاق بين العمال..."
                    value={actionForm.reason}
                    onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Check-Out Form */}
            {actionDialog.type === 'CHECK_OUT' && (
              <div className="space-y-2">
                <Label htmlFor="reason">سبب الإخراج</Label>
                <Input
                  id="reason"
                  placeholder="مثال: انتهاء العقد، نقل إلى مشروع آخر..."
                  value={actionForm.reason}
                  onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                placeholder="أي ملاحظات أو تفاصيل إضافية..."
                value={actionForm.notes}
                onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAction}>
              إلغاء
            </Button>
            <Button onClick={handleSubmitAction}>
              {getActionIcon(actionDialog.type)}
              <span className="mr-2">تأكيد {getActionLabel(actionDialog.type)}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
