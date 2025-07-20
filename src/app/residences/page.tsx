
'use client';

import { useState } from 'react';
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
import { useToast } from "@/hooks/use-toast";

const residencesData = [
  {
    id: 'complex-1',
    name: 'Seaside Residences',
    buildings: [
      {
        id: 'building-a',
        name: 'Building A',
        floors: [
          {
            id: 'floor-1',
            name: 'Floor 1',
            rooms: [
              { id: 'room-101', name: 'Room 101' },
              { id: 'room-102', name: 'Room 102' },
              { id: 'facility-bath', name: 'Main Bathroom' },
            ],
          },
          {
            id: 'floor-2',
            name: 'Floor 2',
            rooms: [{ id: 'room-201', name: 'Room 201' }],
          },
        ],
      },
      {
        id: 'building-b',
        name: 'Building B',
        floors: [
          {
            id: 'floor-1b',
            name: 'Floor 1',
            rooms: [{ id: 'room-101b', name: 'Room 101' }],
          },
        ],
      },
    ],
  },
];

export default function ResidencesPage() {
  const [residences, setResidences] = useState(residencesData);
  
  const [isAddComplexDialogOpen, setIsAddComplexDialogOpen] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  
  const [isAddBuildingDialogOpen, setIsAddBuildingDialogOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);

  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [selectedBuildingInfo, setSelectedBuildingInfo] = useState<{complexId: string, buildingId: string} | null>(null);

  const { toast } = useToast();

  const handleAddItem = (type: string, parentId: string, grandParentId?: string) => {
    if (type === 'building') {
      setSelectedComplexId(parentId);
      setIsAddBuildingDialogOpen(true);
    } else if (type === 'floor' && grandParentId) {
        setSelectedBuildingInfo({ complexId: grandParentId, buildingId: parentId });
        setIsAddFloorDialogOpen(true);
    } else {
      console.log(`Adding ${type} to ${parentId}`);
      toast({ title: "Note", description: `Adding ${type} is not yet implemented.`});
    }
  };

  const handleDeleteItem = (type: string, id: string, parentId?: string, grandParentId?: string) => {
    let newResidences = [...residences];
    let successMessage = '';

    if (type === 'complex') {
        newResidences = residences.filter(c => c.id !== id);
        successMessage = "Complex deleted successfully.";
    } else if (type === 'building' && parentId) {
        newResidences = residences.map(c => 
            c.id === parentId 
            ? {...c, buildings: c.buildings.filter(b => b.id !== id)}
            : c
        );
        successMessage = "Building deleted successfully.";
    } else if (type === 'floor' && parentId && grandParentId) {
         newResidences = residences.map(c => {
            if (c.id === grandParentId) {
                return {
                    ...c,
                    buildings: c.buildings.map(b => {
                        if (b.id === parentId) {
                            return {...b, floors: b.floors.filter(f => f.id !== id)}
                        }
                        return b;
                    })
                }
            }
            return c;
         });
         successMessage = "Floor deleted successfully.";
    } else if (type === 'room' && parentId && grandParentId) {
        // Here parentId is floorId, grandParentId is buildingId. We need complexId as well.
        // This is getting complex. Let's find the room and delete it.
        const complex = newResidences.find(c => c.buildings.some(b => b.id === grandParentId));
        if (complex) {
            const building = complex.buildings.find(b => b.id === grandParentId);
            if(building) {
                const floor = building.floors.find(f => f.id === parentId);
                if (floor) {
                    floor.rooms = floor.rooms.filter(r => r.id !== id);
                    successMessage = "Room deleted successfully.";
                }
            }
        }
    } else {
        toast({ title: "Error", description: `Could not delete ${type}.`, variant: "destructive" });
        return;
    }
    
    setResidences(newResidences);
    toast({
        title: "Success",
        description: successMessage,
    });
  };

  const handleAddComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComplexName.trim() === '') {
      toast({
        title: "Error",
        description: "Complex name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newComplex = {
      id: `complex-${Date.now()}`,
      name: newComplexName,
      buildings: [],
    };

    setResidences([...residences, newComplex]);
    setNewComplexName('');
    setIsAddComplexDialogOpen(false);
    toast({
        title: "Success",
        description: "New residential complex added.",
    });
  };

  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) {
      toast({
        title: "Error",
        description: "Building name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedComplexId) return;

    const newBuilding = {
      id: `building-${Date.now()}`,
      name: newBuildingName,
      floors: [],
    };

    setResidences(
      residences.map((complex) =>
        complex.id === selectedComplexId
          ? { ...complex, buildings: [...complex.buildings, newBuilding] }
          : complex
      )
    );

    setNewBuildingName('');
    setIsAddBuildingDialogOpen(false);
    setSelectedComplexId(null);
    toast({
      title: "Success",
      description: "New building added to the complex.",
    });
  };

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) {
      toast({
        title: "Error",
        description: "Floor name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedBuildingInfo) return;

    const { complexId, buildingId } = selectedBuildingInfo;

    const newFloor = {
        id: `floor-${Date.now()}`,
        name: newFloorName,
        rooms: []
    }

    setResidences(residences.map(complex => {
        if (complex.id === complexId) {
            return {
                ...complex,
                buildings: complex.buildings.map(building => {
                    if (building.id === buildingId) {
                        return {
                            ...building,
                            floors: [...building.floors, newFloor]
                        }
                    }
                    return building;
                })
            }
        }
        return complex;
    }));

    setNewFloorName('');
    setIsAddFloorDialogOpen(false);
    setSelectedBuildingInfo(null);
    toast({
      title: "Success",
      description: "New floor added to the building.",
    });
  }
  
  const findComplexIdForBuilding = (buildingId: string) => {
      const complex = residences.find(c => c.buildings.some(b => b.id === buildingId));
      return complex?.id;
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
                        <Button variant="ghost" size="icon" onClick={() => handleAddItem('building', complex.id)}>
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
                              <AlertDialogAction onClick={() => handleDeleteItem('complex', complex.id)}>Delete</AlertDialogAction>
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
                                  <Button variant="ghost" size="icon" onClick={() => handleAddItem('floor', building.id, complex.id)}>
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
                                        <AlertDialogAction onClick={() => handleDeleteItem('building', building.id, complex.id)}>Delete</AlertDialogAction>
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
                                                <Button variant="ghost" size="icon" onClick={() => handleAddItem('room', floor.id)}>
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
                                                        <AlertDialogAction onClick={() => handleDeleteItem('floor', floor.id, building.id, complex.id)}>Delete</AlertDialogAction>
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
                                                        <AlertDialogAction onClick={() => handleDeleteItem('room', room.id, floor.id, building.id)}>Delete</AlertDialogAction>
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
    </div>
  );

    