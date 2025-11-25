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
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ArrowRight, ArrowLeft, Home, Building, LogIn, LogOut, ArrowRightLeft } from "lucide-react";
import { useAccommodation, AccommodationHistory } from "@/context/accommodation-context";
import { useUsers } from "@/context/users-context";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface WorkerHistoryDialogProps {
  workerId: string;
  workerName: string;
  trigger?: React.ReactNode;
}

export function WorkerHistoryDialog({ workerId, workerName, trigger }: WorkerHistoryDialogProps) {
  const { fetchWorkerHistory } = useAccommodation();
  const { getUserById } = useUsers();
  const [history, setHistory] = useState<AccommodationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && workerId) {
      setLoading(true);
      fetchWorkerHistory(workerId)
        .then(setHistory)
        .finally(() => setLoading(false));
    }
  }, [open, workerId, fetchWorkerHistory]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return <LogIn className="h-4 w-4 text-green-500" />;
      case 'CHECK_OUT': return <LogOut className="h-4 w-4 text-red-500" />;
      case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'SWAP': return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return 'Check In';
      case 'CHECK_OUT': return 'Check Out';
      case 'TRANSFER': return 'Transfer';
      case 'SWAP': return 'Swap';
      default: return type;
    }
  };

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
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History: {workerName}
          </DialogTitle>
          <DialogDescription>
            Movement history for this worker
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex justify-center p-8">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No history found for this worker.</div>
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
                        {getActionLabel(item.actionType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        By: {item.actionByName || getUserById(item.actionBy)?.name || item.actionBy || 'System'}
                      </span>
                    </div>
                    
                    <div className="text-sm mt-1 p-3 bg-muted/30 rounded-md border">
                      {item.actionType === 'CHECK_IN' && (
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4 text-green-500" />
                          <span>Checked in to </span>
                          <span className="font-medium">{item.residenceName}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-medium">{item.roomName}</span>
                        </div>
                      )}
                      
                      {item.actionType === 'CHECK_OUT' && (
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-500" />
                          <span>Checked out from </span>
                          <span className="font-medium">{item.residenceName}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-medium">{item.roomName}</span>
                          {item.reason && <span className="text-muted-foreground text-xs">({item.reason})</span>}
                        </div>
                      )}
                      
                      {item.actionType === 'TRANSFER' && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-muted-foreground line-through text-xs">
                            <Home className="h-3 w-3" />
                            <span>{item.fromResidenceName} / {item.fromRoomName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-500" />
                            <span>Transferred to </span>
                            <span className="font-medium">{item.toResidenceName || item.residenceName}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-medium">{item.toRoomName || item.roomName}</span>
                          </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
