import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, ArrowRight, LogIn, LogOut, ArrowRightLeft, User } from "lucide-react";
import { useAccommodation, AccommodationHistory } from "@/context/accommodation-context";
import { useUsers } from "@/context/users-context";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface RoomHistoryDialogProps {
  roomId: string;
  roomName: string;
  trigger?: React.ReactNode;
}

export function RoomHistoryDialog({ roomId, roomName, trigger }: RoomHistoryDialogProps) {
  const { fetchRoomHistory } = useAccommodation();
  const { getUserById } = useUsers();
  const [history, setHistory] = useState<AccommodationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && roomId) {
      setLoading(true);
      fetchRoomHistory(roomId)
        .then(setHistory)
        .finally(() => setLoading(false));
    }
  }, [open, roomId, fetchRoomHistory]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return <LogIn className="h-4 w-4 text-green-500" />;
      case 'CHECK_OUT': return <LogOut className="h-4 w-4 text-red-500" />;
      case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'SWAP': return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  // Extract workerId from history if available
  const workerId = history.length > 0 ? history[0].workerId : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <History className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <span className="font-semibold">History: {roomName}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Occupancy history for this room
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-4 min-h-0">
          {loading ? (
            <div className="flex justify-center p-8">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No history found for this room.</div>
          ) : (
            <div className="space-y-4 relative pl-4 border-l border-muted ml-2 my-2">
              {history.map((item) => (
                <div key={item.id} className="relative mb-6 last:mb-0">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border bg-background" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {format(new Date(item.actionDate), "yyyy-MM-dd HH:mm")}
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1 py-0 h-5">
                        {getActionIcon(item.actionType)}
                        {item.actionType}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        By: {item.actionByName || getUserById(item.actionBy)?.name || item.actionBy || 'System'}
                      </span>
                    </div>
                    
                    <div className="text-sm mt-1 p-3 bg-muted/30 rounded-md border">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.workerName || 'Unknown Worker'}</span>
                        {item.workerNationality && <span className="text-xs text-muted-foreground">({item.workerNationality})</span>}
                      </div>

                      {item.actionType === 'CHECK_IN' && (
                        <div className="text-green-600 text-xs">
                          Checked In
                        </div>
                      )}
                      
                      {item.actionType === 'CHECK_OUT' && (
                        <div className="text-red-600 text-xs">
                          Checked Out {item.reason ? `(${item.reason})` : ''}
                        </div>
                      )}
                      
                      {item.actionType === 'TRANSFER' && (
                        <div className="text-blue-600 text-xs">
                          {item.toRoomId === roomId ? (
                             <>
                               Transferred IN
                               {item.fromRoomName && <span className="text-muted-foreground"> from {item.fromRoomName}</span>}
                             </>
                          ) : (
                             <>
                               Transferred OUT
                               {item.toRoomName && <span className="text-muted-foreground"> to {item.toRoomName}</span>}
                             </>
                          )}
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2 text-xs text-muted-foreground border-t pt-2 italic">
                          "{item.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
