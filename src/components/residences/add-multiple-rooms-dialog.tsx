
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

  useEffect(() => {
    if (isOpen) {
      setRoomList('');
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorInfo) return;
    
    // Split by commas, newlines, or spaces, then filter out empty strings
    const roomNames = roomList.split(/[\n, ]+/).filter(name => name.trim() !== '');

    if (roomNames.length === 0) {
      toast({ title: "Input Error", description: "Please enter at least one room name.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    await onAddRooms(floorInfo.complexId, floorInfo.buildingId, floorInfo.floorId, roomNames);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Add Multiple Rooms</DialogTitle>
            <DialogDescription>
              Paste or type a list of room names. Separate them with commas, spaces, or new lines.
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
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Rooms
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
