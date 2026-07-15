"use client";

import React, { useState, useMemo, useDeferredValue } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, DoorOpen, MapPin, Pencil, Users, ChevronDown, Search, Layers, Grid3x3, List, LayoutGrid, Trash2, Table as TableIcon, Siren } from "lucide-react";
import { useLanguage } from '@/context/language-context';
import { useResidences, type Room, type Complex, type Floor, type Building as BuildingType } from '@/context/residences-context';
import { useAccommodation } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Normalize arrays from possible object maps
const asArray = <T,>(val: any): T[] => Array.isArray(val) ? (val as T[]) : (val && typeof val === 'object' ? Object.values(val) as T[] : []);

export default function AccommodationResidencesView() {
  const { dict, locale: language } = useLanguage();
  const { residences, updateComplex, loading } = useResidences();
  const { occupants } = useAccommodation();
  const { currentUser } = useUsers();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'cards' | 'tree' | 'board' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [openComplexIds, setOpenComplexIds] = useState<Record<string, boolean>>({});
  const [openBuildingKeys, setOpenBuildingKeys] = useState<Record<string, boolean>>({});
  const [editingRoom, setEditingRoom] = useState<{ 
    complexId: string; 
    buildingId?: string; 
    floorId?: string; 
    roomId: string;
    room: Room;
  } | null>(null);
  
  // Editing states for buildings, floors, and rooms
  const [editingBuilding, setEditingBuilding] = useState<{
    complexId: string;
    buildingId: string;
    name: string;
  } | null>(null);
  
  const [editingFloor, setEditingFloor] = useState<{
    complexId: string;
    buildingId: string;
    floorId: string;
    name: string;
  } | null>(null);
  
  const [editingRoomName, setEditingRoomName] = useState<{
    complexId: string;
    buildingId?: string;
    floorId?: string;
    roomId: string;
    name: string;
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

  const toggleBuildingOpen = (complexId: string, buildingId: string) => {
    const key = `${complexId}-${buildingId}`;
    setOpenBuildingKeys(prev => ({
      ...prev,
      [key]: !(prev[key] ?? true)
    }));
  };

  // Get list of cities for filter
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    residences.forEach(c => {
      if (c.city) citySet.add(c.city);
    });
    return Array.from(citySet).sort();
  }, [residences]);

  // Filter residences based on user role and assigned residences
  const userResidences = useMemo(() => {
    if (!currentUser) return residences;
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences]);

  // Separate active and disabled residences
  const activeResidences = useMemo(() => userResidences.filter(r => !r.disabled), [userResidences]);
  const disabledResidences = useMemo(() => userResidences.filter(r => r.disabled), [userResidences]);

  // Filter residences based on search and city
  const filteredResidences = useMemo(() => {
    let filtered = activeResidences;
    
    // Apply city filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(c => c.city === cityFilter);
    }
    
    // Apply search filter
    if (!deferredSearch.trim()) return filtered;
    
    const searchLower = deferredSearch.toLowerCase();
    return filtered.filter(complex => {
      const complexName = complex.name?.toLowerCase() ?? '';
      const complexCity = complex.city?.toLowerCase() ?? '';

      // Search in complex name or city
      if (complexName.includes(searchLower)) return true;
      if (complexCity.includes(searchLower)) return true;

      // Search in flat rooms
      if (complex.rooms?.some(room => (room.name?.toLowerCase() ?? '').includes(searchLower))) return true;

      // Search in nested rooms
      if (complex.buildings?.some(building => {
        const buildingName = building.name?.toLowerCase() ?? '';
        return (
          buildingName.includes(searchLower) ||
          building.floors?.some(floor => {
            const floorName = floor.name?.toLowerCase() ?? '';
            return (
              floorName.includes(searchLower) ||
              floor.rooms?.some(room => (room.name?.toLowerCase() ?? '').includes(searchLower))
            );
          })
        );
      })) return true;

      return false;
    });
  }, [activeResidences, deferredSearch, cityFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOccupants = occupants.length;
    let complexes = 0;
    let buildings = 0;
    let floors = 0;
    let rooms = 0;
    let occupiedRooms = 0;
    let totalCapacity = 0;

    filteredResidences.forEach(complex => {
      complexes++;
      
      // Count flat rooms
      if (complex.rooms) {
        complex.rooms.forEach(room => {
          rooms++;
          if (room.capacity) totalCapacity += room.capacity;
          const roomOccupants = occupants.filter(o => o.roomId === room.id).length;
          if (roomOccupants > 0) occupiedRooms++;
        });
      }
      
      // Count nested structure
      if (complex.buildings) {
        buildings += complex.buildings.length;
        complex.buildings.forEach(building => {
          if (building.floors) {
            floors += building.floors.length;
            building.floors.forEach(floor => {
              if (floor.rooms) {
                rooms += floor.rooms.length;
                floor.rooms.forEach(room => {
                  if (room.capacity) totalCapacity += room.capacity;
                  const roomOccupants = occupants.filter(o => o.roomId === room.id).length;
                  if (roomOccupants > 0) occupiedRooms++;
                });
              }
            });
          }
        });
      }
    });

    return {
      complexes,
      buildings,
      floors,
      rooms,
      occupants: totalOccupants,
      occupiedRooms,
      totalCapacity,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0,
    };
  }, [filteredResidences, occupants]);

  const handleEditRoom = (complexId: string, room: Room, buildingId?: string, floorId?: string) => {
    setEditingRoom({ complexId, buildingId, floorId, roomId: room.id, room: { ...room } });
  };

  // Calculate capacity automatically based on area (4m² = 1 worker)
  const calculateCapacity = (area: number) => {
    return Math.floor(area / 4);
  };

  // Update all rooms without area to default values (24m² = 6 capacity)
  const handleUpdateAllRoomsDefaultArea = async () => {
    try {
      let totalUpdated = 0;
      const DEFAULT_AREA = 24;
      const DEFAULT_CAPACITY = 6;

      for (const complex of residences) {
        let hasChanges = false;
        const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));

        // Update rooms in nested structure
        for (const building of updatedComplex.buildings) {
          for (const floor of building.floors) {
            for (const room of floor.rooms) {
              if (!room.area || room.area === 0) {
                room.area = DEFAULT_AREA;
                room.capacity = DEFAULT_CAPACITY;
                hasChanges = true;
                totalUpdated++;
              }
            }
          }
        }

        // Update rooms in flat structure (if exists)
        if (updatedComplex.rooms) {
          for (const room of updatedComplex.rooms) {
            if (!room.area || room.area === 0) {
              room.area = DEFAULT_AREA;
              room.capacity = DEFAULT_CAPACITY;
              hasChanges = true;
              totalUpdated++;
            }
          }
        }

        // Save if there were changes
        if (hasChanges) {
          await updateFirestore(complex.id, updatedComplex);
        }
      }

      if (totalUpdated > 0) {
        toast({
          title: 'Success',
          description: `Updated ${totalUpdated} room(s) with default area (24m²) and capacity (6 workers)`,
        });
      } else {
        toast({
          title: 'Info',
          description: 'All rooms already have area values',
        });
      }
    } catch (error: any) {
      console.error('Error updating rooms:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update rooms',
      });
    }
  };

  // Delete building
  const handleDeleteBuilding = async (complexId: string, buildingId: string) => {
    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));
      updatedComplex.buildings = updatedComplex.buildings.filter(b => b.id !== buildingId);

      await updateFirestore(complexId, updatedComplex);

      toast({
        title: 'Success',
        description: 'Building deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting building:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete building',
      });
    }
  };

  // Delete floor
  const handleDeleteFloor = async (complexId: string, buildingId: string, floorId: string) => {
    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));
      const building = updatedComplex.buildings.find(b => b.id === buildingId);
      if (!building) throw new Error('Building not found');

      building.floors = building.floors.filter(f => f.id !== floorId);

      await updateFirestore(complexId, updatedComplex);

      toast({
        title: 'Success',
        description: 'Floor deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting floor:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete floor',
      });
    }
  };

  // Delete room
  const handleDeleteRoom = async (complexId: string, buildingId: string | undefined, floorId: string | undefined, roomId: string) => {
    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));

      if (buildingId && floorId) {
        const building = updatedComplex.buildings.find(b => b.id === buildingId);
        if (!building) throw new Error('Building not found');
        const floor = building.floors.find(f => f.id === floorId);
        if (!floor) throw new Error('Floor not found');
        floor.rooms = floor.rooms.filter(r => r.id !== roomId);
      } else if (updatedComplex.rooms) {
        updatedComplex.rooms = updatedComplex.rooms.filter(r => r.id !== roomId);
      }

      await updateFirestore(complexId, updatedComplex);

      toast({
        title: 'Success',
        description: 'Room deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete room',
      });
    }
  };

  // Update building name
  const handleUpdateBuildingName = async (complexId: string, buildingId: string, newName: string) => {
    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));
      const building = updatedComplex.buildings.find(b => b.id === buildingId);
      if (!building) throw new Error('Building not found');

      building.name = newName;

      await updateFirestore(complexId, updatedComplex);

      toast({
        title: 'Success',
        description: 'Building name updated successfully',
      });
      setEditingBuilding(null);
    } catch (error: any) {
      console.error('Error updating building name:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update building name',
      });
    }
  };

  // Update floor name
  const handleUpdateFloorName = async (complexId: string, buildingId: string, floorId: string, newName: string) => {
    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));
      const building = updatedComplex.buildings.find(b => b.id === buildingId);
      if (!building) throw new Error('Building not found');
      const floor = building.floors.find(f => f.id === floorId);
      if (!floor) throw new Error('Floor not found');

      floor.name = newName;

      await updateFirestore(complexId, updatedComplex);

      toast({
        title: 'Success',
        description: 'Floor name updated successfully',
      });
      setEditingFloor(null);
    } catch (error: any) {
      console.error('Error updating floor name:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update floor name',
      });
    }
  };

  // Update room name
  const handleUpdateRoomName = async (complexId: string, buildingId: string | undefined, floorId: string | undefined, roomId: string, newName: string) => {
    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      const updatedComplex: Complex = JSON.parse(JSON.stringify(complex));

      if (buildingId && floorId) {
        const building = updatedComplex.buildings.find(b => b.id === buildingId);
        if (!building) throw new Error('Building not found');
        const floor = building.floors.find(f => f.id === floorId);
        if (!floor) throw new Error('Floor not found');
        const room = floor.rooms.find(r => r.id === roomId);
        if (!room) throw new Error('Room not found');
        room.name = newName;
      } else if (updatedComplex.rooms) {
        const room = updatedComplex.rooms.find(r => r.id === roomId);
        if (!room) throw new Error('Room not found');
        room.name = newName;
      }

      await updateFirestore(complexId, updatedComplex);

      toast({
        title: 'Success',
        description: 'Room name updated successfully',
      });
      setEditingRoomName(null);
    } catch (error: any) {
      console.error('Error updating room name:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update room name',
      });
    }
  };

  // Helper function to update Firestore
  const updateFirestore = async (complexId: string, updatedComplex: Complex) => {
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
    // Force reload
    window.location.reload();
  };

  const handleSaveRoom = async () => {
    if (!editingRoom) return;

    const { complexId, buildingId, floorId, roomId, room } = editingRoom;

    try {
      const complex = residences.find(r => r.id === complexId);
      if (!complex) throw new Error('Residence not found');

      // Calculate capacity based on area (4m² = 1 worker)
      const updatedRoom = {
        ...room,
        capacity: room.area ? calculateCapacity(room.area) : room.capacity
      };

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
        floor.rooms[roomIndex] = { ...floor.rooms[roomIndex], ...updatedRoom };
      } else if (updatedComplex.rooms) {
        // Flat room structure
        const roomIndex = updatedComplex.rooms.findIndex((r) => r.id === roomId);
        if (roomIndex === -1) throw new Error('Room not found');
        updatedComplex.rooms[roomIndex] = { ...updatedComplex.rooms[roomIndex], ...updatedRoom };
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
        title: 'Success',
        description: 'Room updated successfully',
      });

      setEditingRoom(null);
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update room',
      });
    }
  };

  const handleToggleEmergencyMode = async (complex: Complex) => {
    try {
      await updateComplex(complex.id, { isEmergencyMode: !complex.isEmergencyMode });
      toast({
        title: !complex.isEmergencyMode ? "Emergency Mode Activated" : "Emergency Mode Deactivated",
        description: !complex.isEmergencyMode 
          ? "Validation rules will be bypassed for this residence." 
          : "Validation rules are now active.",
        variant: !complex.isEmergencyMode ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update emergency mode",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-4">{dict.loading || 'Loading...'}</div>;
  }

  const renderTableView = () => {
    const rows: {
      residence: Complex;
      building?: BuildingType;
      floor?: Floor;
      room: Room;
    }[] = [];

    filteredResidences.forEach(residence => {
      // Flat rooms
      if (residence.rooms) {
        residence.rooms.forEach(room => {
          rows.push({ residence, room });
        });
      }
      
      // Nested rooms
      if (residence.buildings) {
        residence.buildings.forEach(building => {
          if (building.floors) {
            building.floors.forEach(floor => {
              if (floor.rooms) {
                floor.rooms.forEach(room => {
                  rows.push({ residence, building, floor, room });
                });
              }
            });
          }
        });
      }
    });

    return (
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Residence</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Occupancy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No rooms found
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ residence, building, floor, room }) => {
                const occupancy = getOccupantCount(room.id);
                const isFull = room.capacity ? occupancy >= room.capacity : false;
                const isOvercrowded = room.capacity ? occupancy > room.capacity : false;
                
                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      {language === 'ar' ? residence.nameAr || residence.name : residence.nameEn || residence.name}
                    </TableCell>
                    <TableCell>
                      {building ? (language === 'ar' ? building.nameAr || building.name : building.nameEn || building.name) : '-'}
                    </TableCell>
                    <TableCell>
                      {floor ? (language === 'ar' ? floor.nameAr || floor.name : floor.nameEn || floor.name) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{language === 'ar' ? room.nameAr || room.name : room.nameEn || room.name}</span>
                        {room.gender && <span className="text-xs text-muted-foreground">({room.gender === 'male' ? 'M' : 'F'})</span>}
                      </div>
                    </TableCell>
                    <TableCell>{room.capacity || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{occupancy}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOvercrowded ? "destructive" : isFull ? "secondary" : "outline"}>
                        {isOvercrowded ? "Overcrowded" : isFull ? "Full" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRoom(residence.id, room, building?.id, floor?.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Delete room "${room.name}"?`)) {
                              handleDeleteRoom(residence.id, building?.id, floor?.id, room.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-muted-foreground">Complexes</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.complexes}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-muted-foreground">Buildings</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.buildings}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-muted-foreground">Floors</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.floors}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-muted-foreground">Rooms</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.rooms}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-primary/50">
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-muted-foreground">Occupants</CardTitle>
            <CardDescription className="text-2xl font-bold text-primary">{stats.occupants}</CardDescription>
          </CardHeader>
        </Card>
        <Card className={stats.occupancyRate > 80 ? "border-orange-500/50" : ""}>
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-muted-foreground">Occupancy Rate</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.occupancyRate}%</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search residences, buildings, floors, or rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 flex-wrap">
              <Button 
                variant={viewMode === 'cards' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('cards')}
                title="Cards view"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Cards
              </Button>
              <Button 
                variant={viewMode === 'tree' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('tree')}
                title="Tree view"
              >
                <List className="h-4 w-4 mr-2" />
                Tree
              </Button>
              <Button 
                variant={viewMode === 'board' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('board')}
                title={dict.boardView}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                {dict.board}
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </div>
          
          {/* Maintenance Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUpdateAllRoomsDefaultArea}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              title="Update all rooms without area to 24m² (6 capacity)"
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Update Default Room Areas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      {(deferredSearch || cityFilter !== 'all') && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredResidences.length} of {residences.length} residences
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && filteredResidences.map((complex) => {
        const canManageEmergency = currentUser?.role === 'Admin' || currentUser?.id === complex.managerId;
        
        return (
        <Card key={complex.id} className={complex.isEmergencyMode ? "border-red-500 border-2" : ""}>
          <CardHeader className="cursor-pointer" onClick={() => toggleComplexOpen(complex.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${(openComplexIds[complex.id] ?? true) ? '' : '-rotate-90'}`}
                />
                <Building className={`h-5 w-5 ${complex.isEmergencyMode ? "text-red-600" : "text-primary"}`} />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {complex.name}
                    {complex.isEmergencyMode && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        <Siren className="h-3 w-3 mr-1" /> Emergency Mode
                      </Badge>
                    )}
                  </CardTitle>
                  {complex.city && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {complex.city}
                    </div>
                  )}
                </div>
              </div>
              
              {canManageEmergency && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Label htmlFor={`emergency-${complex.id}`} className={`text-xs font-medium ${complex.isEmergencyMode ? "text-red-600" : "text-muted-foreground"}`}>
                    {complex.isEmergencyMode ? "Emergency ON" : "Emergency OFF"}
                  </Label>
                  <Switch
                    id={`emergency-${complex.id}`}
                    checked={complex.isEmergencyMode || false}
                    onCheckedChange={() => handleToggleEmergencyMode(complex)}
                  />
                </div>
              )}
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
                                  {room.area ? `${room.area} m²` : '-'} • 
                                  Capacity: {room.capacity || '-'}
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
                              Occupants: {occupantCount}
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
                  {complex.buildings.map((building) => {
                    const buildingKey = `${complex.id}-${building.id}`;
                    const isBuildingOpen = openBuildingKeys[buildingKey] ?? true;
                    
                    return (
                      <div key={building.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleBuildingOpen(complex.id, building.id)}>
                            <ChevronDown 
                              className={`h-4 w-4 transition-transform ${isBuildingOpen ? '' : '-rotate-90'}`}
                            />
                            <Building className="h-4 w-4" />
                            {editingBuilding?.complexId === complex.id && editingBuilding?.buildingId === building.id ? (
                              <Input
                                value={editingBuilding.name}
                                onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                                onBlur={() => {
                                  if (editingBuilding.name.trim()) {
                                    handleUpdateBuildingName(complex.id, building.id, editingBuilding.name.trim());
                                  } else {
                                    setEditingBuilding(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editingBuilding.name.trim()) {
                                    handleUpdateBuildingName(complex.id, building.id, editingBuilding.name.trim());
                                  } else if (e.key === 'Escape') {
                                    setEditingBuilding(null);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 text-sm font-semibold"
                                autoFocus
                              />
                            ) : (
                              <h3 className="font-semibold">{building.name}</h3>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {building.floors?.reduce((acc, floor) => acc + (floor.rooms?.length || 0), 0) || 0} rooms
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBuilding({ complexId: complex.id, buildingId: building.id, name: building.name });
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete building "${building.name}"? This will delete all floors and rooms inside.`)) {
                                  handleDeleteBuilding(complex.id, building.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {isBuildingOpen && building.floors && (
                          <div className="p-4 space-y-4">
                            {building.floors.map((floor) => (
                              <div key={floor.id}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-3 w-3 text-muted-foreground" />
                                    {editingFloor?.complexId === complex.id && editingFloor?.buildingId === building.id && editingFloor?.floorId === floor.id ? (
                                      <Input
                                        value={editingFloor.name}
                                        onChange={(e) => setEditingFloor({ ...editingFloor, name: e.target.value })}
                                        onBlur={() => {
                                          if (editingFloor.name.trim()) {
                                            handleUpdateFloorName(complex.id, building.id, floor.id, editingFloor.name.trim());
                                          } else {
                                            setEditingFloor(null);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && editingFloor.name.trim()) {
                                            handleUpdateFloorName(complex.id, building.id, floor.id, editingFloor.name.trim());
                                          } else if (e.key === 'Escape') {
                                            setEditingFloor(null);
                                          }
                                        }}
                                        className="h-6 text-sm font-medium"
                                        autoFocus
                                      />
                                    ) : (
                                      <h4 className="text-sm font-medium text-muted-foreground">{floor.name}</h4>
                                    )}
                                    <span className="text-xs text-muted-foreground">({floor.rooms?.length || 0} rooms)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => setEditingFloor({ complexId: complex.id, buildingId: building.id, floorId: floor.id, name: floor.name })}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => {
                                        if (confirm(`Delete floor "${floor.name}"? This will delete all rooms inside.`)) {
                                          handleDeleteFloor(complex.id, building.id, floor.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {floor.rooms && floor.rooms.map((room) => {
                                    const occupantCount = getOccupantCount(room.id);
                                    const isOccupied = occupantCount > 0;
                                    const isFull = room.capacity ? occupantCount >= room.capacity : false;
                                    
                                    return (
                                      <Card 
                                        key={room.id} 
                                        className={`relative transition-all ${
                                          isFull ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : 
                                          isOccupied ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20' : 
                                          ''
                                        }`}
                                      >
                                        <CardContent className="p-3">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-1">
                                              <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                {editingRoomName?.complexId === complex.id && editingRoomName?.buildingId === building.id && editingRoomName?.floorId === floor.id && editingRoomName?.roomId === room.id ? (
                                                  <Input
                                                    value={editingRoomName.name}
                                                    onChange={(e) => setEditingRoomName({ ...editingRoomName, name: e.target.value })}
                                                    onBlur={() => {
                                                      if (editingRoomName.name.trim()) {
                                                        handleUpdateRoomName(complex.id, building.id, floor.id, room.id, editingRoomName.name.trim());
                                                      } else {
                                                        setEditingRoomName(null);
                                                      }
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter' && editingRoomName.name.trim()) {
                                                        handleUpdateRoomName(complex.id, building.id, floor.id, room.id, editingRoomName.name.trim());
                                                      } else if (e.key === 'Escape') {
                                                        setEditingRoomName(null);
                                                      }
                                                    }}
                                                    className="h-6 text-sm font-medium"
                                                    autoFocus
                                                  />
                                                ) : (
                                                  <div 
                                                    className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                                                    onClick={() => setEditingRoomName({ complexId: complex.id, buildingId: building.id, floorId: floor.id, roomId: room.id, name: room.name })}
                                                    title="Click to edit name"
                                                  >
                                                    {room.name}
                                                  </div>
                                                )}
                                                <div className="text-xs text-muted-foreground">
                                                  {room.area ? `${room.area} m²` : '-'} • 
                                                  Capacity: {room.capacity || '-'}
                                                </div>
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 flex-shrink-0"
                                              onClick={() => handleEditRoom(complex.id, room, building.id, floor.id)}
                                              title="Edit area"
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          
                                          <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                            isFull ? 'bg-red-100 dark:bg-red-900/30' :
                                            isOccupied ? 'bg-orange-100 dark:bg-orange-900/30' :
                                            'bg-muted/50'
                                          }`}>
                                            <Users className={`h-3 w-3 ${
                                              isFull ? 'text-red-600 dark:text-red-400' :
                                              isOccupied ? 'text-orange-600 dark:text-orange-400' :
                                              'text-primary'
                                            }`} />
                                            <span className="font-medium">
                                              Occupants: {occupantCount}
                                              {room.capacity ? ` / ${room.capacity}` : ''}
                                            </span>
                                            {isFull && <span className="ml-auto text-red-600 dark:text-red-400 font-medium">Full</span>}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ); })}

      {/* Tree View */}
      {viewMode === 'tree' && (
        <Accordion type="multiple" className="space-y-4">
          {filteredResidences.map((complex) => (
            <AccordionItem key={complex.id} value={complex.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-primary" />
                    <div className="text-right">
                      <div className="font-semibold">{complex.name}</div>
                      {complex.city && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {complex.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {(complex.rooms?.length || 0) + 
                       (complex.buildings?.reduce((acc, b) => 
                         acc + (b.floors?.reduce((acc2, f) => acc2 + (f.rooms?.length || 0), 0) || 0), 0) || 0)
                      } rooms
                    </span>
                    <span>
                      {occupants.filter(occ => {
                        const roomIds = [
                          ...(complex.rooms?.map(r => r.id) || []),
                          ...(complex.buildings?.flatMap(b => 
                            b.floors?.flatMap(f => f.rooms?.map(r => r.id) || []) || []
                          ) || [])
                        ];
                        return roomIds.includes(occ.roomId);
                      }).length} occupants
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Flat rooms */}
                {complex.rooms && complex.rooms.length > 0 && (
                  <div className="space-y-2">
                    {complex.rooms.map((room) => {
                      const occupantCount = getOccupantCount(room.id);
                      const isFull = room.capacity ? occupantCount >= room.capacity : false;
                      
                      return (
                        <div 
                          key={room.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            isFull ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20' : 
                            occupantCount > 0 ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20' : 
                            'bg-card'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <DoorOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{room.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {room.area ? `${room.area} m²` : '-'} • Capacity: {room.capacity || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${
                              isFull ? 'bg-red-100 dark:bg-red-900/30' :
                              occupantCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30' :
                              'bg-muted'
                            }`}>
                              <Users className="h-3 w-3" />
                              <span className="font-medium">
                                {occupantCount} / {room.capacity || '-'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditRoom(complex.id, room)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Nested structure */}
                {complex.buildings && complex.buildings.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {complex.buildings.map((building) => (
                      <div key={building.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/30 px-3 py-2 font-medium text-sm flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {building.name}
                        </div>
                        {building.floors && building.floors.map((floor) => (
                          <div key={floor.id} className="p-3 space-y-2">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                              <Layers className="h-3 w-3" />
                              {floor.name}
                            </div>
                            {floor.rooms && floor.rooms.map((room) => {
                              const occupantCount = getOccupantCount(room.id);
                              const isFull = room.capacity ? occupantCount >= room.capacity : false;
                              
                              return (
                                <div 
                                  key={room.id}
                                  className={`flex items-center justify-between p-2 border rounded ${
                                    isFull ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20' : 
                                    occupantCount > 0 ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20' : 
                                    'bg-card'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <DoorOpen className="h-3 w-3 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">{room.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {room.area ? `${room.area} م²` : '-'} • {room.capacity || '-'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                                      isFull ? 'bg-red-100 dark:bg-red-900/30' :
                                      occupantCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30' :
                                      'bg-muted'
                                    }`}>
                                      <Users className="h-3 w-3" />
                                      <span>{occupantCount}/{room.capacity || '-'}</span>
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
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="space-y-6">
          {Object.entries(filteredResidences.reduce((acc, complex) => {
            const city = complex.city || 'غير محدد';
            if (!acc[city]) acc[city] = [];
            acc[city].push(complex);
            return acc;
          }, {} as Record<string, Complex[]>)).map(([city, complexes]) => (
            <div key={city}>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> {city}
              </h2>
              {complexes.map((complex) => {
                const canManageEmergency = currentUser?.role === 'Admin' || currentUser?.id === complex.managerId;
                
                return (
                <div key={complex.id} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleComplexOpen(complex.id)}
                      >
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            (openComplexIds[complex.id] ?? true) ? '' : '-rotate-90'
                          }`} 
                        />
                      </Button>
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {complex.name}
                        {complex.isEmergencyMode && (
                          <Badge variant="destructive" className="text-xs h-5">
                            <Siren className="h-3 w-3 mr-1" /> Emergency
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {canManageEmergency && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={complex.isEmergencyMode || false}
                          onCheckedChange={() => handleToggleEmergencyMode(complex)}
                          className="data-[state=checked]:bg-red-600"
                        />
                      </div>
                    )}
                  </div>
                  
                  {(openComplexIds[complex.id] ?? true) && (
                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-4 min-w-max">
                        {complex.buildings && complex.buildings.map((building: BuildingType) => {
                          const floorsCount = building.floors?.length || 0;
                          const roomsCount = building.floors?.reduce((acc: number, f: Floor) => 
                            acc + (f.rooms?.length || 0), 0) || 0;
                          
                          return (
                            <div key={building.id} className="w-80 shrink-0 rounded-lg border bg-background">
                              <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <div className="font-medium">{building.name}</div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {floorsCount}P • {roomsCount}G
                                </div>
                              </div>
                              
                              <div className="p-3 space-y-4 max-h-[600px] overflow-y-auto">
                                {building.floors && building.floors.map((floor: Floor) => (
                                  <div key={floor.id} className="rounded-md bg-muted/20 border">
                                    <div className="px-3 py-2 flex items-center justify-between border-b bg-muted/30">
                                      <div className="flex items-center gap-2 font-semibold text-sm">
                                        <Layers className="h-4 w-4" />
                                        <span>{floor.name}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {floor.rooms?.length || 0} rooms
                                      </div>
                                    </div>
                                    
                                    <div className="p-3 space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        {floor.rooms && floor.rooms.map((room: Room) => {
                                          const occupantCount = getOccupantCount(room.id);
                                          const isFull = room.capacity ? occupantCount >= room.capacity : false;
                                          
                                          return (
                                            <div
                                              key={room.id}
                                              className={`p-2 border rounded text-xs ${
                                                isFull ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20' : 
                                                occupantCount > 0 ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20' : 
                                                'bg-card'
                                              }`}
                                            >
                                              <div className="flex items-center gap-1 mb-1">
                                                <DoorOpen className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium truncate">{room.name}</span>
                                              </div>
                                              <div className="text-[10px] text-muted-foreground mb-1">
                                                {room.area ? `${room.area} م²` : '-'} • {room.capacity || '-'}
                                              </div>
                                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                                isFull ? 'bg-red-100 dark:bg-red-900/30' :
                                                occupantCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                'bg-muted'
                                              }`}>
                                                <Users className="h-3 w-3" />
                                                <span>{occupantCount}/{room.capacity || '-'}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ); })}
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && renderTableView()}

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Area</DialogTitle>
            <DialogDescription>
              Edit room area. Capacity will be calculated automatically (4m² = 1 worker).
            </DialogDescription>
          </DialogHeader>

          {editingRoom && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="room-name">Room Name</Label>
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
                <Label htmlFor="room-area">Area (m²)</Label>
                <Input
                  id="room-area"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editingRoom.room.area || ''}
                  onChange={(e) => {
                    const area = parseFloat(e.target.value) || 0;
                    setEditingRoom({
                      ...editingRoom,
                      room: { 
                        ...editingRoom.room, 
                        area: area,
                        capacity: calculateCapacity(area)
                      }
                    });
                  }}
                />
              </div>

              <div>
                <Label htmlFor="room-capacity">Capacity (Auto-calculated)</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  value={editingRoom.room.area ? calculateCapacity(editingRoom.room.area) : editingRoom.room.capacity || 0}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formula: Area ÷ 4 = {editingRoom.room.area ? `${editingRoom.room.area} ÷ 4 = ${calculateCapacity(editingRoom.room.area)} workers` : '0 workers'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoom}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disabled Residences Section */}
      {disabledResidences.length > 0 && (
        <Card className="mt-6 border-muted">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              Disabled Residences
            </CardTitle>
            <CardDescription>
              These residences are disabled and not available for assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {disabledResidences.map((residence) => (
                <div 
                  key={residence.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div>
                    <div className="font-medium text-muted-foreground">
                      {language === 'ar' ? residence.nameAr || residence.name : residence.nameEn || residence.name}
                    </div>
                    <div className="text-sm text-muted-foreground/70">{residence.city}</div>
                  </div>
                  <Badge variant="secondary" className="bg-muted">
                    Disabled
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
