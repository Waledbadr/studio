"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, DoorOpen, MapPin, Pencil, Users, ChevronDown } from "lucide-react";
import { useLanguage } from '@/context/language-context';
import { useResidences, type Room, type Complex } from '@/context/residences-context';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';

// Normalize arrays from possible object maps
const asArray = <T,>(val: any): T[] => Array.isArray(val) ? (val as T[]) : (val && typeof val === 'object' ? Object.values(val) as T[] : []);

export default function AccommodationResidencesView() {
  const { dict } = useLanguage();
  const { residences, updateComplex, loading } = useResidences();
  const { occupants } = useAccommodation();
  const { toast } = useToast();

  const [openComplexIds, setOpenComplexIds] = useState<Record<string, boolean>>({});
  const [editingRoom, setEditingRoom] = useState<{ 
    complexId: string; 
    buildingId?: string; 
    floorId?: string; 
    roomId: string;
    room: Room;
  } | null>(null);

  // Count occupants per room
  const getOccupantCount = (roomId: string) => {
    return occupants.filter(occ => occ.roomId === roomId).length;
  };

  const toggleComplexOpen = (complexId: string) => {
    setOpenComplexIds(prev => ({
      ...prev,
      [complexId]: !(prev[complexId] ?? true)
    }));
  };

  const handleEditRoom = (complexId: string, room: Room, buildingId?: string, floorId?: string) => {
    setEditingRoom({ complexId, buildingId, floorId, roomId: room.id, room: { ...room } });
  };

  const handleSaveRoom = async () => {
    if (!editingRoom) return;

    const { complexId, buildingId, floorId, roomId, room } = editingRoom;

    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      // Clone the complex
      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));

      // Update the room based on structure
      if (buildingId && floorId) {
        // Nested building/floor/room structure
        const building = updatedComplex.buildings.find((b) => b.id === buildingId);
        if (!building) throw new Error('Building not found');
        const floor = building.floors.find((f) => f.id === floorId);
        if (!floor) throw new Error('Floor not found');
        const roomIndex = floor.rooms.findIndex((r) => r.id === roomId);
        if (roomIndex === -1) throw new Error('Room not found');
        floor.rooms[roomIndex] = { ...floor.rooms[roomIndex], ...room };
      } else if (updatedComplex.rooms) {
        // Flat room structure
        const roomIndex = updatedComplex.rooms.findIndex((r) => r.id === roomId);
        if (roomIndex === -1) throw new Error('Room not found');
        updatedComplex.rooms[roomIndex] = { ...updatedComplex.rooms[roomIndex], ...room };
      }

      // Update Firestore directly
      const { db } = await import('@/lib/firebase');
      if (db) {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'residences', complexId), updatedComplex);
      } else {
        // Update localStorage
        const storedResidences = localStorage.getItem('estatecare_residences');
        const allResidences = storedResidences ? JSON.parse(storedResidences) : [];
        const residenceIndex = allResidences.findIndex((r: Complex) => r.id === complexId);
        if (residenceIndex !== -1) {
          allResidences[residenceIndex] = updatedComplex;
          localStorage.setItem('estatecare_residences', JSON.stringify(allResidences));
        }
      }
      
      // Force reload of residences
      window.location.reload();

      toast({
        title: 'نجح',
        description: 'تم تحديث الغرفة بنجاح',
      });

      setEditingRoom(null);
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحديث الغرفة',
      });
    }
  };

  if (loading) {
    return <div className="p-4">{dict.loading || 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      {residences.map((complex) => (
        <Card key={complex.id}>
          <CardHeader className="cursor-pointer" onClick={() => toggleComplexOpen(complex.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${(openComplexIds[complex.id] ?? true) ? '' : '-rotate-90'}`}
                />
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>{complex.name}</CardTitle>
                  {complex.city && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {complex.city}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {(openComplexIds[complex.id] ?? true) && (
            <CardContent className="space-y-4">
              {/* Flat room structure */}
              {complex.rooms && complex.rooms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {complex.rooms.map((room) => {
                    const occupantCount = getOccupantCount(room.id);
                    return (
                      <Card key={room.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <DoorOpen className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{room.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {room.area ? `${room.area} م²` : '-'} • 
                                  الاستيعاب: {room.capacity || '-'}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditRoom(complex.id, room)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              الساكنين: {occupantCount}
                              {room.capacity ? ` / ${room.capacity}` : ''}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Nested building/floor/room structure */}
              {complex.buildings && complex.buildings.length > 0 && (
                <div className="space-y-4">
                  {complex.buildings.map((building) => (
                    <div key={building.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {building.name}
                      </h3>
                      
                      {building.floors && building.floors.map((floor) => (
                        <div key={floor.id} className="mb-4">
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {floor.name}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {floor.rooms && floor.rooms.map((room) => {
                              const occupantCount = getOccupantCount(room.id);
                              return (
                                <Card key={room.id} className="relative">
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <div className="font-medium text-sm">{room.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {room.area ? `${room.area} م²` : '-'} • 
                                            الاستيعاب: {room.capacity || '-'}
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleEditRoom(complex.id, room, building.id, floor.id)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                                      <Users className="h-3 w-3 text-primary" />
                                      <span className="font-medium">
                                        الساكنين: {occupantCount}
                                        {room.capacity ? ` / ${room.capacity}` : ''}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الغرفة</DialogTitle>
            <DialogDescription>
              تعديل مساحة الغرفة والاستيعاب
            </DialogDescription>
          </DialogHeader>

          {editingRoom && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="room-name">اسم الغرفة</Label>
                <Input
                  id="room-name"
                  value={editingRoom.room.name || ''}
                  onChange={(e) => setEditingRoom({
                    ...editingRoom,
                    room: { ...editingRoom.room, name: e.target.value }
                  })}
                />
              </div>

              <div>
                <Label htmlFor="room-area">المساحة (م²)</Label>
                <Input
                  id="room-area"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editingRoom.room.area || ''}
                  onChange={(e) => setEditingRoom({
                    ...editingRoom,
                    room: { 
                      ...editingRoom.room, 
                      area: parseFloat(e.target.value) || 0
                    }
                  })}
                />
              </div>

              <div>
                <Label htmlFor="room-capacity">الاستيعاب</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  min="0"
                  value={editingRoom.room.capacity || ''}
                  onChange={(e) => setEditingRoom({
                    ...editingRoom,
                    room: { ...editingRoom.room, capacity: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveRoom}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
