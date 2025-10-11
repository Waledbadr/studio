"use client";

import React, { useEffect, useState } from "react";
import { useResidences } from "@/context/residences-context";
import { useAccommodation } from "@/context/accommodation-context";
import { useToast } from "@/hooks/use-toast";
import { CreateTransferDialog } from "@/components/accommodation/create-transfer-dialog";
import { ArrowRightLeft, Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AccommodationAssignPage() {
  const { residences, loadResidences } = useResidences();
  const { occupants, workers } = useAccommodation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<string | null>(residences?.[0]?.id || null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [filterNationality, setFilterNationality] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [roomDetailsDialogOpen, setRoomDetailsDialogOpen] = useState(false);
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<any>(null);

  useEffect(() => {
    if (!residences || residences.length === 0) loadResidences();
    if (residences && residences.length && !selectedResidence) setSelectedResidence(residences[0].id);
  }, [residences, loadResidences]);

  // Use workers from context instead of API call
  useEffect(() => {
    console.log('🔍 Workers from context:', workers?.length || 0, workers);
    if (workers && workers.length > 0) {
      setSearchResults(workers);
    }
  }, [workers]);

  // Get occupant count for a room
  const getOccupantCount = (roomId: string) => {
    return occupants.filter(occ => occ.roomId === roomId).length;
  };

  // Get occupants in a specific room
  const getRoomOccupants = (roomId: string) => {
    return occupants
      .filter(occ => occ.roomId === roomId)
      .map(occ => {
        const worker = workers.find(w => w.id === occ.workerId);
        return {
          ...occ,
          id: occ.workerId + '_' + occ.roomId, // Unique ID for the occupant
          workerName: worker?.name || 'غير معروف',
          workerNationality: worker?.nationaliy || 'غير محدد',
          workerRole: worker?.role || 'Worker',
          employeeId: worker?.employeeId || '',
          assignedAt: occ.since, // Using 'since' field as assignedAt
        };
      });
  };

  // Handle room click to show details
  const handleRoomClick = (room: any) => {
    setSelectedRoomForDetails(room);
    setRoomDetailsDialogOpen(true);
  };

  // Handle remove worker from room
  const handleRemoveWorker = async (workerId: string, workerName: string) => {
    try {
      const res = await fetch('/api/accommodation/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId })
      });
      const data = await res.json();
      if (!data?.ok) {
        toast({
          title: "خطأ",
          description: data?.error || 'فشل إلغاء التسكين',
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "تم إلغاء التسكين",
        description: `تم إلغاء تسكين ${workerName} بنجاح`
      });
      // Note: The occupants will be updated automatically by the Firestore listener in the context
      // This will trigger a re-render and the dialog will show updated data
    } catch (e: any) {
      console.error(e);
      toast({
        title: "خطأ",
        description: e?.message || 'حدث خطأ',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!selectedResidence) return;
    const complex = residences.find((r) => r.id === selectedResidence);
    if (!complex) return setRooms([]);
    const flattened = (complex.buildings || []).flatMap((b) => (b.floors || []).flatMap((f) => f.rooms || []));
    setRooms(flattened || []);
    if (flattened && flattened.length) setSelectedRoom(flattened[0].id || null);
  }, [selectedResidence, residences]);

  function doSearch(q: string) {
    setSearchQ(q);
    console.log('🔍 Searching workers with query:', q);
    
    if (!q || !q.trim()) {
      // Show all workers if no search query
      setSearchResults(workers || []);
      console.log('✅ Showing all', workers?.length || 0, 'workers');
      return;
    }

    // Filter workers locally
    const norm = q.trim().toLowerCase();
    const filtered = (workers || []).filter((w: any) => 
      (w.name || '').toLowerCase().includes(norm) || 
      (w.nameEn || '').toLowerCase().includes(norm) || 
      (w.nameAr || '').includes(norm) ||
      (w.employeeId || '').toLowerCase().includes(norm) ||
      (w.nationaliy || '').toLowerCase().includes(norm) ||
      (w.role || '').toLowerCase().includes(norm)
    );
    
    setSearchResults(filtered);
    console.log('✅ Filtered results:', filtered.length, 'workers match query');
  }

  function toggleWorker(wid: string) {
    setSelectedWorkers(prev => prev.includes(wid) ? prev.filter(x => x !== wid) : [...prev, wid]);
  }

  async function handleBulkAssign() {
    if (!selectedResidence || !selectedRoom || selectedWorkers.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار المسكن والغرفة والعمال",
        variant: "destructive"
      });
      return;
    }
    
    // Check if any selected worker is already assigned to a room
    const alreadyAssignedWorkers = selectedWorkers.filter(wid => 
      occupants.some(occ => occ.workerId === wid)
    );
    
    if (alreadyAssignedWorkers.length > 0) {
      const workerNames = alreadyAssignedWorkers
        .map(wid => workers.find(w => w.id === wid)?.name || wid)
        .join('، ');
      toast({
        title: "لا يمكن التسكين",
        description: `العمال التالية مسكّنة بالفعل: ${workerNames}`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerIds: selectedWorkers, residenceId: selectedResidence, roomId: selectedRoom }) });
      const data = await res.json();
      if (!data?.ok) {
        const errorMsg = data?.error || 'فشل التسكين';
        // Translate common error messages
        let arabicError = errorMsg;
        if (errorMsg.includes('already assigned')) {
          arabicError = 'العامل مسكّن بالفعل في غرفة أخرى';
        } else if (errorMsg.includes('capacity exceeded')) {
          arabicError = 'الغرفة ممتلئة - تجاوزت السعة المحددة';
        } else if (errorMsg.includes('Nationality mismatch')) {
          arabicError = 'لا يمكن تسكين جنسيات مختلفة في نفس الغرفة';
        }
        toast({
          title: "فشل التسكين",
          description: arabicError,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "تم التسكين بنجاح",
        description: `تم تسكين ${data.count || selectedWorkers.length} عامل`,
      });
      setSelectedWorkers([]);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "خطأ",
        description: e?.message || 'حدث خطأ أثناء التسكين',
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  // simple DnD: drag worker id onto room element
  function onDragStart(e: React.DragEvent, id: string) { e.dataTransfer.setData('text/plain', id); }
  async function onDropToRoom(e: React.DragEvent, roomId: string) {
    e.preventDefault();
    const wid = e.dataTransfer.getData('text/plain');
    if (!wid || !selectedResidence) return;
    
    // Check if worker is already assigned
    const isAlreadyAssigned = occupants.some(occ => occ.workerId === wid);
    if (isAlreadyAssigned) {
      const workerName = workers.find((w: any) => w.id === wid)?.name || 'العامل';
      toast({
        title: "لا يمكن التسكين",
        description: `${workerName} مسكّن بالفعل في غرفة أخرى`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/accommodation/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId: wid, residenceId: selectedResidence, roomId }) });
      const data = await res.json();
      if (!data?.ok) {
        const errorMsg = data?.error || 'فشل التسكين';
        let arabicError = errorMsg;
        if (errorMsg.includes('already assigned')) {
          const workerName = workers.find((w: any) => w.id === wid)?.name || 'العامل';
          arabicError = `${workerName} مسكّن بالفعل في غرفة أخرى`;
        } else if (errorMsg.includes('capacity exceeded')) {
          arabicError = 'الغرفة ممتلئة';
        } else if (errorMsg.includes('Nationality mismatch')) {
          arabicError = 'لا يمكن مزج جنسيات مختلفة';
        }
        toast({
          title: "فشل التسكين",
          description: arabicError,
          variant: "destructive"
        });
        return;
      }
      const workerName = workers.find((w: any) => w.id === wid)?.name || 'العامل';
      toast({
        title: "تم التسكين",
        description: `تم تسكين ${workerName} بنجاح`
      });
    } catch (e:any) {
      console.error(e);
      toast({
        title: "خطأ",
        description: e?.message || 'حدث خطأ أثناء التسكين',
        variant: "destructive"
      });
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">تسكين العمال</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTransferDialogOpen(true)}
            className="rounded-md border border-border bg-background px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm"
          >
            <ArrowRightLeft className="h-4 w-4" />
            طلب نقل
          </button>
          <a href="/accommodation/diagnostic" className="text-sm text-muted-foreground hover:text-primary underline">
            تشخيص
          </a>
          <a href="/accommodation/quick-add-workers" className="text-sm text-primary hover:underline">
            إضافة عمال
          </a>
        </div>
      </div>
      
      <CreateTransferDialog 
        isOpen={transferDialogOpen} 
        onOpenChange={setTransferDialogOpen}
        preSelectedWorkers={selectedWorkers}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 rounded-md border p-4 bg-card">
          <label className="block text-sm font-medium mb-2">المسكن</label>
          <select className="border rounded px-3 py-2 w-full bg-background" value={selectedResidence ?? ''} onChange={(e) => setSelectedResidence(e.target.value)}>
            {residences.map((r:any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <label className="block mt-4 text-sm font-medium mb-2">الغرف المتاحة ({rooms.length})</label>
          {rooms.length === 0 && (
            <div className="text-center text-muted-foreground py-4 text-sm">
              لا توجد غرف في هذا المسكن
            </div>
          )}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {rooms.map((rm:any) => {
              const capacity = rm.capacity || Math.floor((rm.spaceSqm || rm.area || 20) / 4);
              const currentOccupants = getOccupantCount(rm.id);
              const isFull = currentOccupants >= capacity;
              const isNearFull = currentOccupants >= capacity * 0.8;
              
              return (
                <div 
                  key={rm.id} 
                  onDragOver={(e)=>e.preventDefault()} 
                  onDrop={(e)=>onDropToRoom(e, rm.id)} 
                  onClick={() => handleRoomClick(rm)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    isFull 
                      ? 'bg-destructive/10 border-destructive' 
                      : isNearFull 
                      ? 'bg-yellow-500/10 border-yellow-500' 
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{rm.name || 'غرفة ' + rm.id}</div>
                      {currentOccupants > 0 && (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rm.roomType || 'Worker'} • {rm.spaceSqm || rm.area || 20}م²
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      السعة: {currentOccupants} / {capacity}
                    </div>
                    {isFull && (
                      <span className="text-xs text-destructive font-medium">ممتلئة</span>
                    )}
                    {!isFull && isNearFull && (
                      <span className="text-xs text-yellow-600 font-medium">قرب الامتلاء</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 rounded-md border p-4 bg-card">
          <div className="flex gap-2 mb-4">
            <input 
              value={searchQ} 
              onChange={(e)=>doSearch(e.target.value)} 
              placeholder="ابحث عن عامل (الاسم، الرقم، الجنسية)" 
              className="border rounded px-3 py-2 flex-1 bg-background"
            />
            <select value={filterNationality} onChange={(e)=>setFilterNationality(e.target.value)} className="border rounded px-3 py-2 bg-background">
              <option value="">جميع الجنسيات</option>
              <option value="Egyptian">مصري</option>
              <option value="Pakistani">باكستاني</option>
              <option value="Indian">هندي</option>
              <option value="Bangladeshi">بنغلاديشي</option>
            </select>
            <button 
              onClick={handleBulkAssign} 
              disabled={submitting || selectedWorkers.length===0} 
              className="rounded-md bg-amber-600 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
            >
              {submitting ? 'جاري التسكين...' : `تسكين (${selectedWorkers.length})`}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>جاري التحميل...</p>
            </div>
          )}

          {!loading && searchQ && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">لا توجد نتائج للبحث</p>
              <p className="text-sm">جرب إضافة عمال من <a href="/accommodation/quick-add-workers" className="text-primary underline">هنا</a></p>
            </div>
          )}

          {!loading && !searchQ && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2 text-lg">لا يوجد عمال</p>
              <p className="text-sm mb-4">أضف عمال تجريبيين للبدء</p>
              <a href="/accommodation/quick-add-workers" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                إضافة عمال تجريبيين
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-3">نتائج البحث ({searchResults.filter(s=>!filterNationality|| (s.nationaliy||'').toLowerCase().includes(filterNationality.toLowerCase())).length})</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {searchResults.filter(s=>!filterNationality|| (s.nationaliy||'').toLowerCase().includes(filterNationality.toLowerCase())).map((w:any)=> {
                  const isAssigned = occupants.some(occ => occ.workerId === w.id);
                  const assignedRoom = isAssigned ? occupants.find(occ => occ.workerId === w.id) : null;
                  const roomInfo = assignedRoom ? rooms.find(r => r.id === assignedRoom.roomId) : null;
                  
                  return (
                    <div 
                      key={w.id} 
                      draggable={!isAssigned} 
                      onDragStart={(e)=>onDragStart(e,w.id)} 
                      className={`p-3 border rounded flex items-center justify-between transition-colors ${
                        isAssigned 
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 opacity-75 cursor-not-allowed' 
                          : 'bg-background hover:bg-accent cursor-move'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{w.name}</div>
                          {isAssigned && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                              مسكّن
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {w.nationaliy} • {w.role || 'Worker'}
                        </div>
                        {isAssigned && roomInfo && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            في: {roomInfo.name || 'غرفة ' + roomInfo.id}
                          </div>
                        )}
                      </div>
                      <div>
                        <input 
                          type="checkbox" 
                          checked={selectedWorkers.includes(w.id)} 
                          onChange={()=>toggleWorker(w.id)}
                          disabled={isAssigned}
                          className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">المحددين ({selectedWorkers.length})</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {selectedWorkers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    لم يتم اختيار عمال
                  </div>
                )}
                {selectedWorkers.map(id => {
                  const w = searchResults.find((s:any)=>s.id===id) || { id, name: id };
                  return (
                    <div key={id} className="p-3 border rounded flex items-center justify-between bg-background">
                      <div>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{(w as any).nationaliy}</div>
                      </div>
                      <button 
                        onClick={()=>toggleWorker(id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        إزالة
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Details Dialog */}
      <Dialog open={roomDetailsDialogOpen} onOpenChange={setRoomDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedRoomForDetails?.name || 'تفاصيل الغرفة'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoomForDetails && (
            <div className="space-y-1 text-right text-sm text-muted-foreground -mt-2 mb-4">
              <div>النوع: {selectedRoomForDetails.roomType || 'Worker'}</div>
              <div>المساحة: {selectedRoomForDetails.spaceSqm || selectedRoomForDetails.area || 20} متر مربع</div>
              <div>
                السعة: {getOccupantCount(selectedRoomForDetails.id)} / {selectedRoomForDetails.capacity || Math.floor((selectedRoomForDetails.spaceSqm || selectedRoomForDetails.area || 20) / 4)}
              </div>
            </div>
          )}

          {selectedRoomForDetails && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  العمال في الغرفة ({getRoomOccupants(selectedRoomForDetails.id).length})
                </h3>
                
                {getRoomOccupants(selectedRoomForDetails.id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>الغرفة فارغة</p>
                    <p className="text-sm mt-1">اسحب عامل إلى الغرفة لتسكينه</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getRoomOccupants(selectedRoomForDetails.id).map((occupant) => (
                      <div
                        key={occupant.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base">{occupant.workerName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span>{occupant.workerNationality}</span>
                            <span>•</span>
                            <span>{occupant.workerRole}</span>
                            {occupant.employeeId && (
                              <>
                                <span>•</span>
                                <span>رقم وظيفي: {occupant.employeeId}</span>
                              </>
                            )}
                          </div>
                          {occupant.assignedAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                              تاريخ التسكين: {new Date(occupant.assignedAt).toLocaleDateString('ar-SA')}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWorker(occupant.workerId, occupant.workerName)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 ml-1" />
                          إزالة
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Room Info */}
              {selectedRoomForDetails && (
                <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground mb-2">معلومات إضافية:</h4>
                  {selectedRoomForDetails.bedCount && (
                    <div className="flex justify-between">
                      <span>عدد الأسرّة:</span>
                      <span className="font-medium">{selectedRoomForDetails.bedCount}</span>
                    </div>
                  )}
                  {selectedRoomForDetails.floor && (
                    <div className="flex justify-between">
                      <span>الطابق:</span>
                      <span className="font-medium">{selectedRoomForDetails.floor}</span>
                    </div>
                  )}
                  {selectedRoomForDetails.building && (
                    <div className="flex justify-between">
                      <span>المبنى:</span>
                      <span className="font-medium">{selectedRoomForDetails.building}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setRoomDetailsDialogOpen(false)}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
