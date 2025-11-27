"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight } from 'lucide-react';

interface CreateTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedWorkers?: string[]; // Optional: pre-select workers
}

export function CreateTransferDialog({ isOpen, onOpenChange, preSelectedWorkers = [] }: CreateTransferDialogProps) {
  const { locale: language, dict } = useLanguage();
  const { workers, occupants, createTransferRequest } = useAccommodation();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { toast } = useToast();

  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(preSelectedWorkers);
  const [fromResidenceId, setFromResidenceId] = useState<string>('');
  const [fromRoomId, setFromRoomId] = useState<string>('');
  const [toResidenceId, setToResidenceId] = useState<string>('');
  const [toRoomId, setToRoomId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available workers (not pre-selected)
  const availableWorkers = workers?.filter(w => !selectedWorkers.includes(w.id)) || [];

  // Get from rooms based on selected residence
  const fromRooms = React.useMemo(() => {
    if (!fromResidenceId) return [];
    const residence = residences?.find(r => r.id === fromResidenceId);
    if (!residence) return [];
    
    const rooms: any[] = [];
    if (residence.rooms) rooms.push(...residence.rooms);
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          if (floor.rooms) rooms.push(...floor.rooms);
        }
      }
    }
    return rooms;
  }, [fromResidenceId, residences]);

  // Get to rooms based on selected residence
  const toRooms = React.useMemo(() => {
    if (!toResidenceId) return [];
    const residence = residences?.find(r => r.id === toResidenceId);
    if (!residence) return [];
    
    const rooms: any[] = [];
    if (residence.rooms) rooms.push(...residence.rooms);
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          if (floor.rooms) rooms.push(...floor.rooms);
        }
      }
    }
    return rooms;
  }, [toResidenceId, residences]);

  const handleAddWorker = (workerId: string) => {
    setSelectedWorkers(prev => [...prev, workerId]);
  };

  const handleRemoveWorker = (workerId: string) => {
    setSelectedWorkers(prev => prev.filter(id => id !== workerId));
  };

  const getWorkerName = (id: string) => {
    return workers?.find(w => w.id === id)?.name || id;
  };

  const getResidenceName = (id: string) => {
    return residences?.find(r => r.id === id)?.name || id;
  };

  const getRoomName = (roomId: string, residenceId: string) => {
    const residence = residences?.find(r => r.id === residenceId);
    if (!residence) return roomId;
    
    if (residence.rooms) {
      const room = residence.rooms.find(r => r.id === roomId);
      if (room) return room.name || roomId;
    }
    
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          const room = floor.rooms?.find(r => r.id === roomId);
          if (room) return room.name || roomId;
        }
      }
    }
    
    return roomId;
  };

  const handleSubmit = async () => {
    if (selectedWorkers.length === 0) {
      toast({
        title: dict.ui.error,
        description: dict.transfers.selectWorkerError,
        variant: 'destructive',
      });
      return;
    }

    if (!toResidenceId) {
      toast({
        title: dict.ui.error,
        description: dict.transfers.selectTargetResidenceError,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const transferRequest = createTransferRequest({
        from: fromResidenceId && fromRoomId ? { residenceId: fromResidenceId, roomId: fromRoomId } : undefined,
        to: { residenceId: toResidenceId, roomId: toRoomId || undefined },
        workerIds: selectedWorkers,
        requestedBy: currentUser?.id || 'unknown',
        reason: reason || undefined,
      });

      toast({
        title: dict.transfers.requestCreated,
        description: dict.transfers.requestCreatedDesc.replace('{id}', transferRequest.id.slice(0, 8)),
      });

      // Reset form
      setSelectedWorkers([]);
      setFromResidenceId('');
      setFromRoomId('');
      setToResidenceId('');
      setToRoomId('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create transfer request:', error);
      toast({
        title: dict.ui.error,
        description: dict.transfers.createError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dict.transfers.createTransferRequest}</DialogTitle>
          <DialogDescription>
            {dict.transfers.createTransferDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Workers */}
          <div className="space-y-2">
            <Label>{dict.transfers.selectedWorkers} ({selectedWorkers.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/50">
              {selectedWorkers.length === 0 ? (
                <span className="text-sm text-muted-foreground">{dict.transfers.noWorkersSelected}</span>
              ) : (
                selectedWorkers.map(wid => (
                  <Badge key={wid} variant="secondary" className="gap-1">
                    {getWorkerName(wid)}
                    <button
                      type="button"
                      onClick={() => handleRemoveWorker(wid)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add Worker */}
          <div className="space-y-2">
            <Label>{dict.transfers.addWorker}</Label>
            <Select onValueChange={handleAddWorker}>
              <SelectTrigger>
                <SelectValue placeholder={dict.transfers.selectWorkerPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {availableWorkers.length === 0 ? (
                  <SelectItem value="_empty" disabled>{dict.transfers.noAvailableWorkers}</SelectItem>
                ) : (
                  availableWorkers.map(worker => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} {worker.employeeId ? `(${worker.employeeId})` : ''} - {worker.nationaliy}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* From Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="text-muted-foreground">{dict.transfers.from}:</span>
              <span className="text-sm text-muted-foreground">({dict.ui.optional})</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{dict.transfers.currentResidence}</Label>
                <Select value={fromResidenceId} onValueChange={setFromResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ui.selectResidence} />
                  </SelectTrigger>
                  <SelectContent>
                    {residences?.map(residence => (
                      <SelectItem key={residence.id} value={residence.id}>
                        {residence.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{dict.transfers.currentRoom}</Label>
                <Select value={fromRoomId} onValueChange={setFromRoomId} disabled={!fromResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ui.selectRoom} />
                  </SelectTrigger>
                  <SelectContent>
                    {fromRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>

          {/* To Section */}
          <div className="space-y-4 p-4 border-2 border-primary/50 rounded-lg bg-primary/5">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="text-primary">{dict.transfers.to}:</span>
              <span className="text-sm text-destructive">*{dict.ui.required}</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{dict.transfers.newResidence}</Label>
                <Select value={toResidenceId} onValueChange={setToResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ui.selectResidence} />
                  </SelectTrigger>
                  <SelectContent>
                    {residences?.map(residence => (
                      <SelectItem key={residence.id} value={residence.id}>
                        {residence.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{dict.transfers.newRoom}</Label>
                <Select value={toRoomId} onValueChange={setToRoomId} disabled={!toResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ui.selectRoomOptional} />
                  </SelectTrigger>
                  <SelectContent>
                    {toRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>{dict.transfers.transferReasonOptional}</Label>
            <Textarea
              placeholder={dict.transfers.transferReasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedWorkers.length > 0 && toResidenceId && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-md">
              <p className="text-sm font-medium mb-2">{dict.transfers.requestSummary}</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {dict.transfers.workersCount} {selectedWorkers.length}</li>
                {fromResidenceId && (
                  <li>• {dict.transfers.from}: {getResidenceName(fromResidenceId)} {fromRoomId ? `- ${getRoomName(fromRoomId, fromResidenceId)}` : ''}</li>
                )}
                <li>• {dict.transfers.to}: {getResidenceName(toResidenceId)} {toRoomId ? `- ${getRoomName(toRoomId, toResidenceId)}` : ''}</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {dict.ui.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedWorkers.length === 0 || !toResidenceId}>
            {isSubmitting ? dict.transfers.creating : dict.transfers.createTransferRequest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
