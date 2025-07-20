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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  const { toast } = useToast();

  const handleAddItem = (type: string, parentId: string) => {
    // In a real app, this would open a dialog and then call an API
    console.log(`Adding ${type} to ${parentId}`);
    toast({ title: "Note", description: `Adding ${type} to ${parentId} is not yet implemented.`});
  };

  const handleDeleteItem = (type: string, id: string) => {
    // In a real app, this would show a confirmation and then call an API
    console.log(`Deleting ${type} with id ${id}`);
    toast({ title: "Note", description: `Deleting ${type} with ID ${id} is not yet implemented.`});
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
    setIsDialogOpen(false);
    toast({
        title: "Success",
        description: "New residential complex added.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Residences</h1>
          <p className="text-muted-foreground">Manage your residential complexes, buildings, and rooms.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input 
                    id="name" 
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
              <AccordionItem value={complex.id} key={complex.id} className="border-b-0">
                <div className="flex items-center px-6 py-4 hover:bg-muted/50 rounded-t-lg">
                    <AccordionTrigger className="flex-1 text-lg font-semibold hover:no-underline p-0">
                      <span>{complex.name}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pl-4">
                        <Button variant="ghost" size="icon" onClick={() => handleAddItem('building', complex.id)}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('complex', complex.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </div>
                <AccordionContent className="bg-muted/20">
                  <div className="p-4 space-y-2">
                    {complex.buildings.map((building) => (
                      <Accordion type="multiple" key={building.id} className="bg-card rounded-md border">
                        <AccordionItem value={building.id} className="border-b-0">
                          <div className="flex items-center px-4 py-3 rounded-md">
                            <AccordionTrigger className="hover:no-underline p-0 flex-1">
                               <div className="flex items-center gap-3">
                                 <Building className="h-5 w-5 text-muted-foreground" />
                                 <span className="font-medium">{building.name}</span>
                               </div>
                            </AccordionTrigger>
                            <div className="flex items-center gap-2 pl-4">
                                <Button variant="ghost" size="icon" onClick={() => handleAddItem('floor', building.id)}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('building', building.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                           </div>
                          <AccordionContent className="pt-2 pl-8 pr-4 pb-4">
                            {building.floors.map((floor) => (
                              <div key={floor.id} className="ml-4 mt-2 p-3 border-l-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">{floor.name}</h4>
                                   <div className="flex items-center">
                                        <Button variant="ghost" size="icon" onClick={() => handleAddItem('room', floor.id)}>
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {floor.rooms.map((room) => (
                                    <div key={room.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                                      <div className="flex items-center gap-2">
                                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                        <span>{room.name}</span>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem('room', room.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
