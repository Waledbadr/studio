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
import { History, ArrowRight, ArrowLeft, Home, Building, LogIn, LogOut, ArrowRightLeft, Trash2, Edit, Undo2 } from "lucide-react";
import { useAccommodation, AccommodationHistory } from "@/context/accommodation-context";
import { useUsers } from "@/context/users-context";
import { useLanguage } from "@/context/language-context";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EditHistoryDialog } from "./edit-history-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkerHistoryDialogProps {
  workerId: string;
  workerName: string;
  trigger?: React.ReactNode;
}

export function WorkerHistoryDialog({ workerId, workerName, trigger }: WorkerHistoryDialogProps) {
  const { fetchWorkerHistory, deleteHistoryRecord, updateHistoryRecord, undoLastAction } = useAccommodation();
  const { getUserById, currentUser } = useUsers();
  const { dict, locale } = useLanguage();
  const [history, setHistory] = useState<AccommodationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<AccommodationHistory | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check if user is Admin or Supervisor
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Supervisor';

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkerHistory(workerId);
      setHistory(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && workerId) {
      loadHistory();
    }
  }, [open, workerId]);

  const handleDelete = async (historyId: string) => {
    const result = await deleteHistoryRecord(historyId);
    if (result.ok) {
      await loadHistory();
      setDeletingHistoryId(null);
      setShowDeleteDialog(false);
      setOpen(true); // إعادة فتح نافذة السجل
    }
  };

  const handleUpdate = async (historyId: string, updates: Partial<AccommodationHistory>) => {
    const result = await updateHistoryRecord(historyId, updates);
    if (result.ok) {
      await loadHistory();
    }
  };

  const handleUndo = async () => {
    const confirmMsg = locale === 'ar' 
      ? 'هل أنت متأكد من التراجع عن آخر عملية؟ هذا الإجراء لا يمكن التراجع عنه.'
      : 'Are you sure you want to undo the last action? This cannot be undone.';
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    const result = await undoLastAction(workerId);
    if (result.ok) {
      await loadHistory();
    }
  };

  const canUndoLastAction = () => {
    if (history.length === 0) return false;
    const lastAction = history[0];
    const now = new Date();
    const actionDate = new Date(lastAction.actionDate);
    const diffMinutes = (now.getTime() - actionDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30; // Can only undo within 30 minutes
  };

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
      case 'CHECK_IN': return locale === 'ar' ? 'تسكين' : 'Check In';
      case 'CHECK_OUT': return locale === 'ar' ? 'إخراج' : 'Check Out';
      case 'TRANSFER':
      case 'SWAP':
        return locale === 'ar' ? 'تبديل' : 'Swap';
      default: return type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <History className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <DialogTitle>
                  {locale === 'ar' ? `السجل: ${workerName}` : `History: ${workerName}`}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {/* Print certificate shortcut */}
                <a
                  href={`/accommodation/worker-certificate?workerId=${workerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="flex items-center gap-1" title={locale === 'ar' ? 'طباعة الشهادة' : 'Print Certificate'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-8 0v4h8v-4m-8 0h8" /></svg>
                    {locale === 'ar' ? 'طباعة الشهادة' : 'Print Certificate'}
                  </Button>
                </a>
                {isAdmin && canUndoLastAction() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    className="flex items-center gap-1"
                  >
                    <Undo2 className="h-4 w-4" />
                    {locale === 'ar' ? 'تراجع عن آخر عملية' : 'Undo Last Action'}
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription>
              {locale === 'ar' ? 'سجل حركة هذا العامل' : 'Movement history for this worker'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex justify-center p-8">
                {locale === 'ar' ? 'جاري التحميل...' : 'Loading history...'}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {locale === 'ar' ? 'لا يوجد سجل لهذا العامل.' : 'No history found for this worker.'}
              </div>
            ) : (
              <div className="space-y-4 relative pl-4 border-l border-muted ml-2 my-2 pb-4">
                {history.map((item, index) => (
                  <div key={item.id} className="relative mb-6 last:mb-0 group">
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
                        
                        {/* Action buttons for Admin/Supervisor only */}
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingHistory(item)}
                              title={locale === 'ar' ? 'تعديل السجل' : 'Edit Record'}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingHistoryId(item.id);
                                setOpen(false); // إغلاق نافذة السجل
                                setTimeout(() => setShowDeleteDialog(true), 100); // فتح نافذة التأكيد بعد قليل
                              }}
                              title={locale === 'ar' ? 'حذف السجل' : 'Delete Record'}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
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
                        
                        {(item.actionType === 'TRANSFER' || item.actionType === 'SWAP') && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground line-through text-xs">
                              <Home className="h-3 w-3" />
                              <span>{item.fromResidenceName} / {item.fromRoomName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-blue-500" />
                              <span>{locale === 'ar' ? 'تبديل إلى' : 'Swapped to'}</span>
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

      {/* Edit Dialog */}
      {editingHistory && (
        <EditHistoryDialog
          history={editingHistory}
          open={!!editingHistory}
          onOpenChange={(open) => !open && setEditingHistory(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeletingHistoryId(null);
            setOpen(true); // إعادة فتح نافذة السجل عند الإلغاء
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'ar' 
                ? 'سيتم حذف هذا السجل بشكل نهائي من التاريخ. لا يمكن التراجع عن هذا الإجراء.'
                : 'This record will be permanently deleted from history. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setDeletingHistoryId(null);
              setOpen(true); // إعادة فتح نافذة السجل
            }}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingHistoryId && handleDelete(deletingHistoryId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {locale === 'ar' ? 'حذف السجل' : 'Delete Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
