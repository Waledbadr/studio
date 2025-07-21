
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, DoorOpen, PlusCircle, Trash2 } from "lucide-react";
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
import { useResidences } from '@/context/residences-context';
import { Skeleton } from '@/components/ui/skeleton';


export default function ResidencesPage() {
  const { residences, loading, loadResidences, addComplex, addBuilding, addFloor, addRoom, deleteComplex, deleteBuilding, deleteFloor, deleteRoom } = useResidences();
  
  useEffect(() => {
    loadResidences();
  }, [loadResidences]);

  const [isAddComplexDialogOpen, setIsAddComplexDialogOpen] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  
  const [isAddBuildingDialogOpen, setIsAddBuildingDialogOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);

  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [selectedBuildingInfo, setSelectedBuildingInfo] = useState<{complexId: string, buildingId: string} | null>(null);

  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedFloorInfo, setSelectedFloorInfo] = useState<{complexId: string, buildingId: string, floorId: string} | null>(null);


  const handleOpenAddDialog = (type: 'building' | 'floor' | 'room', id: string, parentId?: string, grandParentId?: string) => {
    if (type === 'building') {
      setSelectedComplexId(id);
      setIsAddBuildingDialogOpen(true);
    } else if (type === 'floor' && parentId) {
        setSelectedBuildingInfo({ complexId: parentId, buildingId: id });
        setIsAddFloorDialogOpen(true);
    } else if (type === 'room' && parentId && grandParentId) {
        setSelectedFloorInfo({ complexId: grandParentId, buildingId: parentId, floorId: id});
        setIsAddRoomDialogOpen(true);
    }
  };

  const handleAddComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if(newComplexName.trim() === '') return;
    addComplex(newComplexName);
    setNewComplexName('');
    setIsAddComplexDialogOpen(false);
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
  }

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
     if (!newRoomName.trim() || !selectedFloorInfo) return;
    const { complexId, buildingId, floorId } = selectedFloorInfo;
    addRoom(complexId, buildingId, floorId, newRoomName);
    setNewRoomName('');
    setIsAddRoomDialogOpen(false);
    setSelectedFloorInfo(null);
  }
  

  if (loading) {
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Residences</h1>
          <p className="text-muted-foreground">Manage your residential complexes, buildings, and rooms.</p>
        </div>
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
                <DialogDescription>
                  Enter the details for the new residential complex.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="complex-name" className="text-right">Name</Label>
                  <Input 
                    id="complex-name" 
                    placeholder="e.g., Sunshine Apartments" 
                    className="col-span-3"
                    value={newComplexName}
                    onChange={(e) => setNewComplexName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Complex</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {residences.map((complex) => (
              <AccordionItem value={complex.id} key={complex.id} className="border-b last-of-type:border-b-0">
                 <div className="flex items-center hover:bg-muted/50">
                    <AccordionTrigger className="flex-1 text-lg font-semibold hover:no-underline p-6">
                        <span>{complex.name}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pr-6">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenAddDialog('building', complex.id)}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the complex and all its buildings, floors, and rooms.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteComplex(complex.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <AccordionContent className="bg-muted/20">
                  <div className="p-4 space-y-2">
                    {complex.buildings.length > 0 ? (
                      complex.buildings.map((building) => (
                        <Accordion type="multiple" key={building.id} className="bg-card rounded-md border">
                          <AccordionItem value={building.id} className="border-b-0">
                            <div className="flex items-center rounded-md">
                              <AccordionTrigger className="hover:no-underline p-4 flex-1">
                                 <div className="flex items-center gap-3">
                                   <Building className="h-5 w-5 text-muted-foreground" />
                                   <span className="font-medium">{building.name}</span>
                                 </div>
                              </AccordionTrigger>
                              <div className="flex items-center gap-2 pr-4">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenAddDialog('floor', building.id, complex.id)}>
                                      <PlusCircle className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the building and all its floors and rooms.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteBuilding(complex.id, building.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                              </div>
                             </div>
                            <AccordionContent className="pt-2 pl-8 pr-4 pb-4">
                                {building.floors.length > 0 ? (
                                    building.floors.map((floor) => (
                                        <div key={floor.id} className="ml-4 mt-2 p-3 border-l-2">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium">{floor.name}</h4>
                                            <div className="flex items-center">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenAddDialog('room', floor.id, building.id, complex.id)}>
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                                          <Trash2 className="h-4 w-4 text-destructive" />
                                                      </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                          This action cannot be undone. This will permanently delete the floor and all its rooms.
                                                        </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteFloor(complex.id, building.id, floor.id)}>Delete</AlertDialogAction>
                                                      </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                  </AlertDialog>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {floor.rooms.map((room) => (
                                            <div key={room.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                                                <div className="flex items-center gap-2">
                                                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                                <span>{room.name}</span>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the room.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteRoom(complex.id, building.id, floor.id, room.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            ))}
                                            {floor.rooms.length === 0 && <div className="text-center text-muted-foreground p-2 text-sm">No rooms added yet.</div>}
                                        </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground p-4">No floors added yet.</div>
                                )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground p-4">No buildings added yet.</div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
             {residences.length === 0 && <div className="text-center text-muted-foreground p-6">No complexes added yet.</div>}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={isAddBuildingDialogOpen} onOpenChange={setIsAddBuildingDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddBuilding}>
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
              <DialogDescription>
                Enter the name for the new building.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="building-name" className="text-right">Name</Label>
                <Input 
                  id="building-name" 
                  placeholder="e.g., Building C" 
                  className="col-span-3"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Building</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <Input 
                  id="floor-name" 
                  placeholder="e.g., Floor 3" 
                  className="col-span-3"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Floor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <Input 
                  id="room-name" 
                  placeholder="e.g., Room 301" 
                  className="col-span-3"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
