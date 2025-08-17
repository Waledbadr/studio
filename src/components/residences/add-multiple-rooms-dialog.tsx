
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { parseSpec } from '@/lib/room-utils';
import { Loader2 } from 'lucide-react';

interface AddMultipleRoomsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  floorInfo: { complexId: string; buildingId: string; floorId: string } | null;
  onAddRooms: (complexId: string, buildingId: string, floorId: string, roomNames: string[]) => Promise<void>;
}

export function AddMultipleRoomsDialog({ 
  isOpen, 
  onOpenChange, 
  floorInfo, 
  onAddRooms 
}: AddMultipleRoomsDialogProps) {
  const [roomList, setRoomList] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const roomNamesPreviewCount = (input: string) => {
    if (!input) return 0;
    const toAsciiDigits = (s: string) => s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
      const code = d.charCodeAt(0);
      const base = code >= 0x06F0 ? 0x06F0 : 0x0660;
      return String(code - base);
    });
    const tokens = input
      .split(/[\n\r\t,،;\| ]+/)
      .map(t => toAsciiDigits(t.trim()))
      .filter(t => t.length > 0);
    const expanded: string[] = [];
    for (const tk of tokens) {
      const m = tk.match(/^(\d+)\s*[:]\s*(\d+)$/);
      if (m) {
        const a = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          const start = Math.min(a, b);
          const end = Math.max(a, b);
          for (let n = start; n <= end; n++) expanded.push(String(n));
          continue;
        }
      }
      expanded.push(tk);
    }
    const seen = new Set<string>();
    const roomNames = expanded.filter(name => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return roomNames.length;
  };

  useEffect(() => {
    if (isOpen) {
      setRoomList('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!floorInfo) return;
    
    // Helper: convert Arabic-Indic digits to ASCII
    const toAsciiDigits = (s: string) => s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
      const code = d.charCodeAt(0);
      // Arabic-Indic 0-9: \u0660-\u0669, Eastern Arabic 0-9: \u06F0-\u06F9
      const base = code >= 0x06F0 ? 0x06F0 : 0x0660;
      return String(code - base);
    });

    // Split by commas (including Arabic comma '،'), semicolons, pipes, newlines, tabs, or spaces
    const tokens = roomList
      .split(/[\n\r\t,،;\| ]+/)
      .map(t => toAsciiDigits(t.trim()))
      .filter(t => t.length > 0);

    // Expand range tokens like 1:10 (inclusive). Preserve zero padding if present.
    const expanded: string[] = [];
    for (const tk of tokens) {
      const m = tk.match(/^(\d+)\s*[:]\s*(\d+)$/); // only colon per requirement
      if (m) {
        const [_, aStr, bStr] = m;
        const a = parseInt(aStr, 10);
        const b = parseInt(bStr, 10);
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          const start = Math.min(a, b);
          const end = Math.max(a, b);
          const hasPad = /^0/.test(aStr) || /^0/.test(bStr);
          const width = hasPad ? Math.max(aStr.length, bStr.length) : 0;
          for (let n = start; n <= end; n++) {
            const s = hasPad ? String(n).padStart(width, '0') : String(n);
            expanded.push(s);
          }
          continue;
        }
      }
      // Non-range token stays as-is
      expanded.push(tk);
    }

    // De-duplicate (case-insensitive)
    const seen = new Set<string>();
    const roomNames = expanded.filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (roomNames.length === 0) {
      toast({ title: "Input Error", description: "Please enter at least one room name.", variant: "destructive" });
      return;
    }
    
    try {
      setIsLoading(true);
  await onAddRooms(floorInfo.complexId, floorInfo.buildingId, floorInfo.floorId, roomNames);
  toast({ title: 'Success', description: `Added ${roomNames.length} room(s).` });
      setRoomList('');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Multiple Rooms</DialogTitle>
          <DialogDescription>
            Paste or type a list of room names. Separate them with commas, spaces, or new lines.
            You can optionally include an area or dimensions after a pipe '|' per item:
            <br />
            <strong>Examples:</strong>
            <ul className="list-disc ml-6">
              <li>Room 101|20  — area = 20 m²</li>
              <li>Room 102|5x4 — length=5 m, width=4 m (area = 20 m²)</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="room-list" className="sr-only">Room List</Label>
          <Textarea
            id="room-list"
            placeholder="e.g., 101, 102, 103&#10;G-01 G-02&#10;Office 1"
            className="min-h-[200px]"
            value={roomList}
            onChange={(e) => setRoomList(e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            Preview: {roomNamesPreviewCount(roomList)} item(s) parsed. Use '|' to include area or dimensions.
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Rooms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
