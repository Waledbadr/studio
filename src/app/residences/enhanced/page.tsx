'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Building, 
  DoorOpen, 
  PlusCircle, 
  Trash2, 
  MapPin, 
  Layers, 
  Pencil, 
  Plus, 
  ConciergeBell,
  Settings,
  Wrench,
  Droplets,
  Zap,
  Shield,
  Car
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  useResidences, 
  type Complex, 
  type Building as BuildingType, 
  type Floor, 
  type Room, 
  type Facility,
  type Service,
  type ServiceLocation
} from '@/context/residences-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/context/users-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AddMultipleRoomsDialog } from '@/components/residences';
import { ServiceManagementDialog } from '@/components/residences/service-management-dialog';

export default function EnhancedResidencesPage() {
  const { 
    residences, 
    loading, 
    loadResidences, 
    addComplex, 
    addBuilding, 
    addFloor, 
    addRoom, 
    deleteComplex, 
    deleteBuilding, 
    deleteFloor, 
    deleteRoom, 
    updateComplex, 
    addMultipleRooms, 
    addFacility, 
    deleteFacility 
  } = useResidences();
  const { users, loadUsers: loadUsersContext, loading: usersLoading, currentUser } = useUsers();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    loadResidences();
    loadUsersContext();
  }, [loadResidences, loadUsersContext]);

  // State for Dialogs
  const [dialogStates, setDialogStates] = useState({
    isAddComplexDialogOpen: false,
    isEditComplexDialogOpen: false,
    isAddBuildingDialogOpen: false,
    isAddFloorDialogOpen: false,
    isAddRoomDialogOpen: false,
    isAddMultipleRoomsDialogOpen: false,
    isAddFacilityDialogOpen: false,
    isServiceManagementDialogOpen: false,
  });

  const [formData, setFormData] = useState({
    newComplexName: '',
    newComplexCity: '',
    newComplexManagerId: '',
    newBuildingName: '',
    newFloorName: '',
    newRoomName: '',
    newFacilityName: '',
    newFacilityType: '',
  });

  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [selectedBuildingInfo, setSelectedBuildingInfo] = useState<{ complexId: string, buildingId: string } | null>(null);
  const [selectedFloorInfo, setSelectedFloorInfo] = useState<{ complexId: string, buildingId: string, floorId: string } | null>(null);
  const [multipleRoomsFloorInfo, setMultipleRoomsFloorInfo] = useState<{ complexId: string, buildingId: string, floorId: string } | null>(null);
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);
  
  // Service management state
  const [serviceManagementState, setServiceManagementState] = useState<{
    location: ServiceLocation;
    locationName: string;
    levelType: 'building' | 'floor' | 'room' | 'facility';
  } | null>(null);

  const userVisibleResidences = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences, isAdmin]);

  const groupedByCity = useMemo(() => {
    return userVisibleResidences.reduce((acc, complex) => {
      const city = complex.city || 'Uncategorized';
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(complex);
      return acc;
    }, {} as Record<string, Complex[]>);
  }, [userVisibleResidences]);

  const handleOpenAddDialog = (type: 'building' | 'floor' | 'room' | 'multipleRooms' | 'facility', id: string, parentId?: string, grandParentId?: string) => {
    setSelectedComplexId(id);
    if (type === 'building') {
      setFormData(prev => ({ ...prev, newBuildingName: '' }));
      setDialogStates(prev => ({ ...prev, isAddBuildingDialogOpen: true }));
    } else if (type === 'facility') {
      setFormData(prev => ({ ...prev, newFacilityName: '', newFacilityType: '' }));
      setDialogStates(prev => ({ ...prev, isAddFacilityDialogOpen: true }));
    } else if (type === 'floor' && parentId) {
      setSelectedBuildingInfo({ complexId: parentId, buildingId: id });
      setFormData(prev => ({ ...prev, newFloorName: '' }));
      setDialogStates(prev => ({ ...prev, isAddFloorDialogOpen: true }));
    } else if (type === 'room' && parentId && grandParentId) {
      setSelectedFloorInfo({ complexId: grandParentId, buildingId: parentId, floorId: id });
      setFormData(prev => ({ ...prev, newRoomName: '' }));
      setDialogStates(prev => ({ ...prev, isAddRoomDialogOpen: true }));
    } else if (type === 'multipleRooms' && parentId && grandParentId) {
      setMultipleRoomsFloorInfo({ complexId: grandParentId, buildingId: parentId, floorId: id });
      setDialogStates(prev => ({ ...prev, isAddMultipleRoomsDialogOpen: true }));
    }
  };

  const handleOpenServiceManagement = (
    location: ServiceLocation, 
    locationName: string, 
    levelType: 'building' | 'floor' | 'room' | 'facility'
  ) => {
    setServiceManagementState({ location, locationName, levelType });
    setDialogStates(prev => ({ ...prev, isServiceManagementDialogOpen: true }));
  };

  const handleAddComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newComplexName.trim() || !formData.newComplexCity.trim() || !formData.newComplexManagerId) {
      toast({ title: 'Error', description: 'Please fill all fields, including manager.', variant: 'destructive' });
      return;
    }
    addComplex(formData.newComplexName, formData.newComplexCity, formData.newComplexManagerId);
    setFormData(prev => ({ ...prev, newComplexName: '', newComplexCity: '', newComplexManagerId: '' }));
    setDialogStates(prev => ({ ...prev, isAddComplexDialogOpen: false }));
  };

  const handleOpenEditDialog = (complex: Complex) => {
    setEditingComplex(complex);
    setDialogStates(prev => ({ ...prev, isEditComplexDialogOpen: true }));
  };

  const handleUpdateComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplex) return;
    if (!editingComplex.name.trim() || !editingComplex.city.trim() || !editingComplex.managerId) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    updateComplex(editingComplex.id, {
      name: editingComplex.name,
      city: editingComplex.city,
      managerId: editingComplex.managerId,
    });
    setDialogStates(prev => ({ ...prev, isEditComplexDialogOpen: false }));
    setEditingComplex(null);
  };

  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newBuildingName.trim() || !selectedComplexId) return;
    addBuilding(selectedComplexId, formData.newBuildingName);
    setFormData(prev => ({ ...prev, newBuildingName: '' }));
    setDialogStates(prev => ({ ...prev, isAddBuildingDialogOpen: false }));
    setSelectedComplexId(null);
  };

  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newFacilityName.trim() || !formData.newFacilityType.trim() || !selectedComplexId) return;
    addFacility(selectedComplexId, formData.newFacilityName, formData.newFacilityType);
    setFormData(prev => ({ ...prev, newFacilityName: '', newFacilityType: '' }));
    setDialogStates(prev => ({ ...prev, isAddFacilityDialogOpen: false }));
    setSelectedComplexId(null);
  };

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newFloorName.trim() || !selectedBuildingInfo) return;
    const { complexId, buildingId } = selectedBuildingInfo;
    addFloor(complexId, buildingId, formData.newFloorName);
    setFormData(prev => ({ ...prev, newFloorName: '' }));
    setDialogStates(prev => ({ ...prev, isAddFloorDialogOpen: false }));
    setSelectedBuildingInfo(null);
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.newRoomName.trim() || !selectedFloorInfo) return;
    const { complexId, buildingId, floorId } = selectedFloorInfo;
    addRoom(complexId, buildingId, floorId, formData.newRoomName);
    setFormData(prev => ({ ...prev, newRoomName: '' }));
    setDialogStates(prev => ({ ...prev, isAddRoomDialogOpen: false }));
    setSelectedFloorInfo(null);
  };

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : "N/A";
  };

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bathroom': return <Droplets className="h-4 w-4" />;
      case 'kitchen': return <ConciergeBell className="h-4 w-4" />;
      case 'electrical room': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'parking': return <Car className="h-4 w-4" />;
      case 'laundry': return <Wrench className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const categoryColors = {
    Essential: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Amenity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Utility: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  };

  const renderServices = (services: Service[] | undefined) => {
    if (!services || services.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Services:</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {services.map((service) => (
            <div key={service.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getServiceIcon(service.type)}
                  <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{service.type}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={`text-xs ${categoryColors[service.category]}`}>
                    {service.category}
                  </Badge>
                  <Badge className={`text-xs ${statusColors[service.status]}`}>
                    {service.status}
                  </Badge>
                </div>
              </div>
              
              {service.subFacilities && service.subFacilities.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Sub-facilities ({service.subFacilities.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {service.subFacilities.slice(0, 3).map((sf) => (
                      <Badge key={sf.id} variant="outline" className="text-xs">
                        {sf.name}{sf.number ? ` #${sf.number}` : ''}
                      </Badge>
                    ))}
                    {service.subFacilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.subFacilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalComplexes = userVisibleResidences.length;
  const totalBuildings = userVisibleResidences.reduce((acc, complex) => acc + complex.buildings.length, 0);
  const totalFloors = userVisibleResidences.reduce((acc, complex) => 
    acc + complex.buildings.reduce((buildingAcc, building) => buildingAcc + building.floors.length, 0), 0);
  const totalRooms = userVisibleResidences.reduce((acc, complex) => 
    acc + complex.buildings.reduce((buildingAcc, building) => 
      buildingAcc + building.floors.reduce((floorAcc, floor) => floorAcc + floor.rooms.length, 0), 0), 0);
  const totalSubFacilities = userVisibleResidences.reduce((acc, complex) => {
    // Count sub-facilities from buildings
    const buildingSubFacilities = complex.buildings.reduce((buildingAcc, building) => 
      buildingAcc + (building.services?.reduce((serviceAcc, service) => serviceAcc + service.subFacilities.length, 0) || 0), 0);
    
    // Count sub-facilities from floors
    const floorSubFacilities = complex.buildings.reduce((buildingAcc, building) =>
      buildingAcc + building.floors.reduce((floorAcc, floor) =>
        floorAcc + (floor.services?.reduce((serviceAcc, service) => serviceAcc + service.subFacilities.length, 0) || 0), 0), 0);
    
    // Count sub-facilities from rooms
    const roomSubFacilities = complex.buildings.reduce((buildingAcc, building) =>
      buildingAcc + building.floors.reduce((floorAcc, floor) =>
        floorAcc + floor.rooms.reduce((roomAcc, room) =>
          roomAcc + (room.services?.reduce((serviceAcc, service) => serviceAcc + service.subFacilities.length, 0) || 0), 0), 0), 0);
    
    // Count sub-facilities from general facilities
    const facilitySubFacilities = (complex.facilities || []).reduce((facilityAcc, facility) =>
      facilityAcc + (facility.services?.reduce((serviceAcc, service) => serviceAcc + service.subFacilities.length, 0) || 0), 0);
    
    return acc + buildingSubFacilities + floorSubFacilities + roomSubFacilities + facilitySubFacilities;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100">Complexes</p>
                <p className="text-3xl font-bold text-white">{totalComplexes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-100">Buildings</p>
                <p className="text-3xl font-bold text-white">{totalBuildings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-100">Floors</p>
                <p className="text-3xl font-bold text-white">{totalFloors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <DoorOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-100">Rooms</p>
                <p className="text-3xl font-bold text-white">{totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-100">Sub-Facilities</p>
                <p className="text-3xl font-bold text-white">{totalSubFacilities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Residences Management</h1>
          <p className="text-muted-foreground">
            Manage residential complexes, buildings, floors, rooms, and their services
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogStates.isAddComplexDialogOpen} onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isAddComplexDialogOpen: open }))}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Complex
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddComplex}>
                <DialogHeader>
                  <DialogTitle>Add New Complex</DialogTitle>
                  <DialogDescription>Enter the details for the new residential complex.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="complex-name" className="text-right">Name</Label>
                    <Input id="complex-name" placeholder="e.g., Seaside Residences" className="col-span-3" value={formData.newComplexName} onChange={(e) => setFormData(prev => ({ ...prev, newComplexName: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="complex-city" className="text-right">City</Label>
                    <Input id="complex-city" placeholder="e.g., Dubai" className="col-span-3" value={formData.newComplexCity} onChange={(e) => setFormData(prev => ({ ...prev, newComplexCity: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="complex-manager" className="text-right">Manager</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, newComplexManagerId: value }))} value={formData.newComplexManagerId}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Complex</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {Object.entries(groupedByCity).map(([city, complexes]) => (
        <div key={city}>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> {city}
          </h2>
          <div className="space-y-4">
            {complexes.map((complex) => (
              <Card key={complex.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{complex.name}</CardTitle>
                      <CardDescription>Manager: {getManagerName(complex.managerId)}</CardDescription>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog('facility', complex.id)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Facility
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog('building', complex.id)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Building
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(complex)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will permanently delete the complex "{complex.name}" and all its associated buildings, floors, and rooms. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteComplex(complex.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {complex.buildings.map((building: BuildingType) => (
                      <AccordionItem key={building.id} value={building.id}>
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="flex-1">
                            <div className="flex items-center gap-2">
                              <Building className="h-5 w-5" />
                              <span className="font-medium">{building.name}</span>
                              {building.services && building.services.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {building.services.length} service{building.services.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenServiceManagement(
                                  { complexId: complex.id, buildingId: building.id },
                                  `${complex.name} - ${building.name}`,
                                  'building'
                                );
                              }}
                              className="ml-2"
                            >
                              <Settings className="mr-2 h-4 w-4" /> Services
                            </Button>
                          )}
                        </div>
                        <AccordionContent>
                          <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                            {isAdmin && (
                              <div className="flex justify-end gap-2 mb-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog('floor', building.id, complex.id)}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Floor
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>This will delete "{building.name}" and all its contents.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteBuilding(complex.id, building.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            {/* Building Services */}
                            {renderServices(building.services)}

                            {building.floors.map((floor: Floor) => (
                              <div key={floor.id} className="p-3 rounded-md bg-muted/50">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                      <Layers className="h-4 w-4" />
                                      {floor.name}
                                    </div>
                                    {floor.services && floor.services.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {floor.services.length} service{floor.services.length !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenServiceManagement(
                                          { complexId: complex.id, buildingId: building.id, floorId: floor.id },
                                          `${complex.name} - ${building.name} - ${floor.name}`,
                                          'floor'
                                        )}
                                      >
                                        <Settings className="mr-2 h-4 w-4" /> Services
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog('room', floor.id, building.id, complex.id)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Room
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog('multipleRooms', floor.id, building.id, complex.id)}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Multiple Rooms
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will delete "{floor.name}" and all its contents.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteFloor(complex.id, building.id, floor.id)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                </div>

                                {/* Floor Services */}
                                {renderServices(floor.services)}

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pl-6 mt-3">
                                  {floor.rooms.map((room: Room) => (
                                    <div key={room.id} className="p-2 bg-background rounded-md text-sm border">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">{room.name}</span>
                                        </div>
                                        {isAdmin && (
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => handleOpenServiceManagement(
                                                { complexId: complex.id, buildingId: building.id, floorId: floor.id, roomId: room.id },
                                                `${room.name}`,
                                                'room'
                                              )}
                                            >
                                              <Settings className="h-3 w-3" />
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100">
                                                  <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                  <AlertDialogDescription>This will delete room "{room.name}".</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => deleteRoom(complex.id, building.id, floor.id, room.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {room.services && room.services.length > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          {room.services.length} service{room.services.length !== 1 ? 's' : ''}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {complex.facilities && complex.facilities.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                        <ConciergeBell className="h-5 w-5 text-primary" /> General Facilities
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 px-4">
                        {complex.facilities.map((facility: Facility) => (
                          <div key={facility.id} className="p-3 bg-muted/50 rounded-md text-sm border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex flex-col">
                                <span className="font-medium">{facility.name}</span>
                                <span className="text-xs text-muted-foreground">{facility.type}</span>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleOpenServiceManagement(
                                      { complexId: complex.id, facilityId: facility.id },
                                      `${facility.name}`,
                                      'facility'
                                    )}
                                  >
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100">
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will delete facility "{facility.name}".</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteFacility(complex.id, facility.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
                            
                            {facility.services && facility.services.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {facility.services.length} service{facility.services.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Service Management Dialog */}
      {serviceManagementState && (
        <ServiceManagementDialog
          isOpen={dialogStates.isServiceManagementDialogOpen}
          onOpenChange={(open) => {
            setDialogStates(prev => ({ ...prev, isServiceManagementDialogOpen: open }));
            if (!open) setServiceManagementState(null);
          }}
          location={serviceManagementState.location}
          locationName={serviceManagementState.locationName}
          levelType={serviceManagementState.levelType}
        />
      )}

      {/* Existing dialogs... */}
      {/* Add Building Dialog */}
      <Dialog open={dialogStates.isAddBuildingDialogOpen} onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isAddBuildingDialogOpen: open }))}>
        <DialogContent>
          <form onSubmit={handleAddBuilding}>
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
              <DialogDescription>
                Enter the name for the new building. It will be added to the selected complex.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="building-name" className="text-right">Name</Label>
                <Input id="building-name" placeholder="e.g., Building C" className="col-span-3" value={formData.newBuildingName} onChange={(e) => setFormData(prev => ({ ...prev, newBuildingName: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Building</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Facility Dialog */}
      <Dialog open={dialogStates.isAddFacilityDialogOpen} onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isAddFacilityDialogOpen: open }))}>
        <DialogContent>
          <form onSubmit={handleAddFacility}>
            <DialogHeader>
              <DialogTitle>Add New Facility</DialogTitle>
              <DialogDescription>
                Add a general facility like a main store, office, or mosque to the complex.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="facility-name" className="text-right">Name</Label>
                <Input id="facility-name" placeholder="e.g., Main Warehouse" className="col-span-3" value={formData.newFacilityName} onChange={(e) => setFormData(prev => ({ ...prev, newFacilityName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="facility-type" className="text-right">Type</Label>
                <Input id="facility-type" placeholder="e.g., Warehouse, Office" className="col-span-3" value={formData.newFacilityType} onChange={(e) => setFormData(prev => ({ ...prev, newFacilityType: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Facility</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Floor Dialog */}
      <Dialog open={dialogStates.isAddFloorDialogOpen} onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isAddFloorDialogOpen: open }))}>
        <DialogContent>
          <form onSubmit={handleAddFloor}>
            <DialogHeader>
              <DialogTitle>Add New Floor</DialogTitle>
              <DialogDescription>
                Enter the name for the new floor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floor-name" className="text-right">Name</Label>
                <Input id="floor-name" placeholder="e.g., Floor 3" className="col-span-3" value={formData.newFloorName} onChange={(e) => setFormData(prev => ({ ...prev, newFloorName: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Floor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={dialogStates.isAddRoomDialogOpen} onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isAddRoomDialogOpen: open }))}>
        <DialogContent>
          <form onSubmit={handleAddRoom}>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Enter the name for the new room.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-name" className="text-right">Name</Label>
                <Input id="room-name" placeholder="e.g., Room 301" className="col-span-3" value={formData.newRoomName} onChange={(e) => setFormData(prev => ({ ...prev, newRoomName: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Multiple Rooms Dialog */}
      <AddMultipleRoomsDialog
        isOpen={dialogStates.isAddMultipleRoomsDialogOpen}
        onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isAddMultipleRoomsDialogOpen: open }))}
        floorInfo={multipleRoomsFloorInfo}
        onAddRooms={addMultipleRooms}
      />

      {/* Edit Complex Dialog */}
      <Dialog open={dialogStates.isEditComplexDialogOpen} onOpenChange={(open) => setDialogStates(prev => ({ ...prev, isEditComplexDialogOpen: open }))}>
        <DialogContent>
          <form onSubmit={handleUpdateComplex}>
            <DialogHeader>
              <DialogTitle>Edit Complex</DialogTitle>
              <DialogDescription>Update the details for the residential complex.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-complex-name" className="text-right">Name</Label>
                <Input 
                  id="edit-complex-name" 
                  className="col-span-3" 
                  value={editingComplex?.name || ''} 
                  onChange={(e) => editingComplex && setEditingComplex({...editingComplex, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-complex-city" className="text-right">City</Label>
                <Input 
                  id="edit-complex-city" 
                  className="col-span-3" 
                  value={editingComplex?.city || ''} 
                  onChange={(e) => editingComplex && setEditingComplex({...editingComplex, city: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-complex-manager" className="text-right">Manager</Label>
                <Select 
                  onValueChange={(managerId) => editingComplex && setEditingComplex({...editingComplex, managerId})} 
                  value={editingComplex?.managerId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogStates(prev => ({ ...prev, isEditComplexDialogOpen: false }))}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
