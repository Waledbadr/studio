"use client";

import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Layers3, DoorOpen, Users } from "lucide-react";

interface Room {
  id: string;
  name?: string;
  capacity?: number;
  spaceSqm?: number;
  roomType?: string;
}

interface Floor {
  id: string;
  name?: string;
  rooms?: Room[];
}

interface Building {
  id: string;
  name?: string;
  floors?: Floor[];
}

interface Residence {
  id: string;
  name: string;
  buildings?: Building[];
  rooms?: Room[];
}

interface ResidenceRoomSelectorProps {
  residences: Residence[];
  occupants?: Array<{ roomId: string; residenceId: string; until?: string | null }>;
  value: {
    residenceId: string;
    buildingId?: string;
    floorId?: string;
    roomId: string;
  };
  onChange: (value: {
    residenceId: string;
    buildingId?: string;
    floorId?: string;
    roomId: string;
  }) => void;
  showOnlyAvailable?: boolean;
  workerNationality?: string; // For nationality matching
  label?: string;
}

export function ResidenceRoomSelector({
  residences,
  occupants = [],
  value,
  onChange,
  showOnlyAvailable = false,
  workerNationality,
  label = "اختر المسكن والغرفة",
}: ResidenceRoomSelectorProps) {
  const calcCapacity = (spaceSqm: number = 20, roomType: string = 'Worker') => {
    const baseArea = roomType === "Worker" ? 4 : roomType === "Supervisor" ? 6 : 8;
    return Math.floor(spaceSqm / baseArea);
  };

  const getRoomOccupancy = (residenceId: string, roomId: string) => {
    return occupants.filter(
      o => o.roomId === roomId && o.residenceId === residenceId && !o.until
    ).length;
  };

  const selectedResidence = residences.find(r => r.id === value.residenceId);
  
  const buildings = useMemo(() => {
    return selectedResidence?.buildings || [];
  }, [selectedResidence]);

  const floors = useMemo(() => {
    if (!value.buildingId) return [];
    const building = buildings.find(b => b.id === value.buildingId);
    return building?.floors || [];
  }, [buildings, value.buildingId]);

  const availableRooms = useMemo(() => {
    if (!value.residenceId) return [];

    const rooms: Array<{
      id: string;
      name: string;
      capacity: number;
      occupied: number;
      available: number;
      buildingId?: string;
      floorId?: string;
    }> = [];

    const addRoom = (room: Room, buildingId?: string, floorId?: string) => {
      const capacity = room.capacity || calcCapacity(room.spaceSqm, room.roomType);
      const occupied = getRoomOccupancy(value.residenceId, room.id);
      const available = capacity - occupied;

      if (showOnlyAvailable && available <= 0) return;

      rooms.push({
        id: room.id,
        name: room.name || `غرفة ${room.id}`,
        capacity,
        occupied,
        available,
        buildingId,
        floorId,
      });
    };

    // Add direct rooms
    selectedResidence?.rooms?.forEach(room => addRoom(room));

    // Add rooms from buildings
    selectedResidence?.buildings?.forEach(building => {
      building.floors?.forEach(floor => {
        floor.rooms?.forEach(room => addRoom(room, building.id, floor.id));
      });
    });

    return rooms;
  }, [value.residenceId, selectedResidence, showOnlyAvailable, occupants]);

  return (
    <div className="space-y-4">
      {/* Residence Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {label}
        </Label>
        <Select
          value={value.residenceId}
          onValueChange={(residenceId: string) =>
            onChange({ residenceId, buildingId: '', floorId: '', roomId: '' })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر المسكن" />
          </SelectTrigger>
          <SelectContent>
            {residences.map(r => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Building Selection (if buildings exist) */}
      {buildings.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            المبنى
          </Label>
          <Select
            value={value.buildingId}
            onValueChange={(buildingId: string) =>
              onChange({ ...value, buildingId, floorId: '', roomId: '' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المبنى" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Floor Selection (if floors exist) */}
      {value.buildingId && floors.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            الطابق
          </Label>
          <Select
            value={value.floorId}
            onValueChange={(floorId: string) =>
              onChange({ ...value, floorId, roomId: '' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الطابق" />
            </SelectTrigger>
            <SelectContent>
              {floors.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Room Selection */}
      {value.residenceId && availableRooms.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            الغرفة {showOnlyAvailable && <Badge variant="outline" className="text-xs">المتاحة فقط</Badge>}
          </Label>
          <Select
            value={value.roomId}
            onValueChange={(roomId: string) => onChange({ ...value, roomId })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الغرفة" />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{r.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{r.occupied}/{r.capacity}</span>
                      {r.available > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          متاح: {r.available}
                        </Badge>
                      )}
                      {r.available === 0 && (
                        <Badge variant="destructive" className="text-xs">
                          ممتلئة
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.residenceId && availableRooms.length === 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
          <p className="text-yellow-700 dark:text-yellow-300">
            {showOnlyAvailable
              ? 'لا توجد غرف متاحة في هذا المسكن'
              : 'لا توجد غرف في هذا المسكن'}
          </p>
        </div>
      )}
    </div>
  );
}
