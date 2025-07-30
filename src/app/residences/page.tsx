
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, DoorOpen, PlusCircle, Trash2, MapPin, Layers, Pencil, Plus } from "lucide-react";
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
import { useResidences, type Complex, type Building as BuildingType, type Floor, type Room } from '@/context/residences-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/context/users-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { AddMultipleRoomsDialog } from '@/components/residences';

export default function ResidencesPage() {
  const { residences, loading, loadResidences, addComplex, addBuilding, addFloor, addRoom, deleteComplex, deleteBuilding, deleteFloor, deleteRoom, updateComplex, addMultipleRooms } = useResidences();
  const { users, loadUsers: loadUsersContext, loading: usersLoading, currentUser } = useUsers();
  const { toast } = useToast();
  const { dict } = useLanguage();
  const isAdmin = currentUser?.role === 'Admin';


  useEffect(() => {
    loadResidences();
    loadUsersContext();
  }, [loadResidences, loadUsersContext]);

  // State for Add Dialogs
  const [isAddComplexDialogOpen, setIsAddComplexDialogOpen] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  const [newComplexCity, setNewComplexCity] = useState('');
  const [newComplexManagerId, setNewComplexManagerId] = useState('');

  // State for Edit Dialog
  const [isEditComplexDialogOpen, setIsEditComplexDialogOpen] = useState(false);
  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);

  const [isAddBuildingDialogOpen, setIsAddBuildingDialogOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);

  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [selectedBuildingInfo, setSelectedBuildingInfo] = useState<{ complexId: string, buildingId: string } | null>(null);

  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedFloorInfo, setSelectedFloorInfo] = useState<{ complexId: string, buildingId: string, floorId: string } | null>(null);

  // State for Add Multiple Rooms Dialog
  const [isAddMultipleRoomsDialogOpen, setIsAddMultipleRoomsDialogOpen] = useState(false);
  const [multipleRoomsFloorInfo, setMultipleRoomsFloorInfo] = useState<{ complexId: string, buildingId: string, floorId: string } | null>(null);


  const groupedByCity = useMemo(() => {
    return residences.reduce((acc, complex) => {
      const city = complex.city || 'Uncategorized';
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(complex);
      return acc;
    }, {} as Record<string, Complex[]>);
  }, [residences]);

  const handleOpenAddDialog = (type: 'building' | 'floor' | 'room' | 'multipleRooms', id: string, parentId?: string, grandParentId?: string) => {
    if (type === 'building') {
      setSelectedComplexId(id);
      setNewBuildingName('');
      setIsAddBuildingDialogOpen(true);
    } else if (type === 'floor' && parentId) {
      setSelectedBuildingInfo({ complexId: parentId, buildingId: id });
      setNewFloorName('');
      setIsAddFloorDialogOpen(true);
    } else if (type === 'room' && parentId && grandParentId) {
      setSelectedFloorInfo({ complexId: grandParentId, buildingId: parentId, floorId: id });
      setNewRoomName('');
      setIsAddRoomDialogOpen(true);
    } else if (type === 'multipleRooms' && parentId && grandParentId) {
        setMultipleRoomsFloorInfo({ complexId: grandParentId, buildingId: parentId, floorId: id });
        setIsAddMultipleRoomsDialogOpen(true);
    }
  };

  const handleAddComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplexName.trim() || !newComplexCity.trim() || !newComplexManagerId) {
        toast({ title: 'Error', description: 'Please fill all fields, including manager.', variant: 'destructive' });
        return;
    }
    addComplex(newComplexName, newComplexCity, newComplexManagerId);
    setNewComplexName('');
    setNewComplexCity('');
    setNewComplexManagerId('');
    setIsAddComplexDialogOpen(false);
  };
  
  const handleOpenEditDialog = (complex: Complex) => {
    setEditingComplex(complex);
    setIsEditComplexDialogOpen(true);
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
    setIsEditComplexDialogOpen(false);
    setEditingComplex(null);
  };

  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim() || !selectedComplexId) return;
    addBuilding(selectedComplexId, newBuildingName);
    setNewBuildingName('');
    setIsAddBuildingDialogOpen(false);
    setSelectedComplexId(null);
  };

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim() || !selectedBuildingInfo) return;
    const { complexId, buildingId } = selectedBuildingInfo;
    addFloor(complexId, buildingId, newFloorName);
    setNewFloorName('');
    setIsAddFloorDialogOpen(false);
    setSelectedBuildingInfo(null);
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !selectedFloorInfo) return;
    const { complexId, buildingId, floorId } = selectedFloorInfo;
    addRoom(complexId, buildingId, floorId, newRoomName);
    setNewRoomName('');
    setIsAddRoomDialogOpen(false);
    setSelectedFloorInfo(null);
  };
  
  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : "N/A";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Residences</h1>
          <p className="text-muted-foreground">Manage your residential complexes, buildings, and units.</p>
        </div>
        {isAdmin && (
            <Dialog open={isAddComplexDialogOpen} onOpenChange={setIsAddComplexDialogOpen}>
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
                    <Input id="complex-name" placeholder="e.g., Seaside Residences" className="col-span-3" value={newComplexName} onChange={(e) => setNewComplexName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="complex-city" className="text-right">City</Label>
                    <Input id="complex-city" placeholder="e.g., Dubai" className="col-span-3" value={newComplexCity} onChange={(e) => setNewComplexCity(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="complex-manager" className="text-right">Manager</Label>
                        <Select onValueChange={setNewComplexManagerId} value={newComplexManagerId}>
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
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {city}</h2>
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
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                <span className="font-medium">{building.name}</span>
                            </div>
                        </AccordionTrigger>
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
                                {building.floors.map((floor: Floor) => (
                                    <div key={floor.id} className="p-3 rounded-md bg-muted/50">
                                         <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Layers className="h-4 w-4" />
                                                {floor.name}
                                            </div>
                                            {isAdmin && (
                                                <div className="flex gap-2">
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
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pl-6">
                                            {floor.rooms.map((room: Room) => (
                                                 <div key={room.id} className="flex items-center justify-between p-2 bg-background rounded-md text-sm">
                                                    <div className="flex items-center gap-2">
                                                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                                      {room.name}
                                                    </div>
                                                     {isAdmin && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100"><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Add Building Dialog */}
      <Dialog open={isAddBuildingDialogOpen} onOpenChange={setIsAddBuildingDialogOpen}>
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
                <Input id="building-name" placeholder="e.g., Building C" className="col-span-3" value={newBuildingName} onChange={(e) => setNewBuildingName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Building</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Floor Dialog */}
      <Dialog open={isAddFloorDialogOpen} onOpenChange={setIsAddFloorDialogOpen}>
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
                <Input id="floor-name" placeholder="e.g., Floor 3" className="col-span-3" value={newFloorName} onChange={(e) => setNewFloorName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Floor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
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
                <Input id="room-name" placeholder="e.g., Room 301" className="col-span-3" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
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
        isOpen={isAddMultipleRoomsDialogOpen}
        onOpenChange={setIsAddMultipleRoomsDialogOpen}
        floorInfo={multipleRoomsFloorInfo}
        onAddRooms={addMultipleRooms}
      />
      
      {/* Edit Complex Dialog */}
      <Dialog open={isEditComplexDialogOpen} onOpenChange={setIsEditComplexDialogOpen}>
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
                      <Button type="button" variant="ghost" onClick={() => setIsEditComplexDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
