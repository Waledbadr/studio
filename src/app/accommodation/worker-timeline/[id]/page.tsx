"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccommodation } from '@/context/accommodation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  LogIn, 
  LogOut, 
  ArrowRightLeft,
  Repeat2,
  Clock,
  Home,
  User
} from 'lucide-react';

export default function WorkerTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params?.id as string;
  
  const { 
    workers, 
     
    fetchWorkerHistory,
    occupants,
    residences 
  } = useAccommodation();

  const worker = useMemo(() => 
    workers.find(w => w.id === workerId), 
    [workers, workerId]
  );

  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    fetchWorkerHistory(workerId).then(data => {
      if (active) setHistory(data || []);
    });
    return () => { active = false; };
  }, [workerId, fetchWorkerHistory]);

  const currentOccupancy = useMemo(() => 
    occupants.find(o => o.workerId === workerId && !o.until),
    [occupants, workerId]
  );

  const stats = useMemo(() => {
    const checkIns = history.filter((h: any) => h.actionType === 'CHECK_IN').length;
    const checkOuts = history.filter((h: any) => h.actionType === 'CHECK_OUT').length;
    const transfers = history.filter((h: any) => h.actionType === 'TRANSFER' || h.actionType === 'SWAP').length;
    
    // Calculate total days stayed dynamically from dates
    let totalDays = 0;
    
    // Sort history by date (oldest first)
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime()
    );
    
    // Calculate days between each CHECK_IN and corresponding CHECK_OUT
    let lastCheckInDate: Date | null = null;
    
    for (const record of sortedHistory) {
      if (record.actionType === 'CHECK_IN') {
        lastCheckInDate = new Date(record.actionDate);
        lastCheckInDate.setHours(0, 0, 0, 0);
      } else if (record.actionType === 'CHECK_OUT' && lastCheckInDate) {
        const checkOutDate = new Date(record.actionDate);
        checkOutDate.setHours(0, 0, 0, 0);
        const diffTime = checkOutDate.getTime() - lastCheckInDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // +1 to include check-in day
        totalDays += Math.max(diffDays + 1, 1);
        lastCheckInDate = null;
      }
    }

    // Add current occupancy days if active
    if (currentOccupancy) {
      const sinceDate = new Date(currentOccupancy.since);
      const today = new Date();
      sinceDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - sinceDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      // +1 to include check-in day
      totalDays += diffDays + 1;
    }

    return { checkIns, checkOuts, transfers,
      swaps: 0, totalDays };
  }, [history, currentOccupancy]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return <LogIn className="h-5 w-5 text-green-600" />;
      case 'CHECK_OUT': return <LogOut className="h-5 w-5 text-red-600" />;
      case 'TRANSFER': return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
      case 'SWAP': return <Repeat2 className="h-5 w-5 text-purple-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return 'تسكين';
      case 'CHECK_OUT': return 'إخراج';
      case 'TRANSFER': return 'تبديل';
      case 'SWAP': return 'تبديل';
      default: return type;
    }
  };

  const getActionBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'CHECK_IN': return 'default';
      case 'CHECK_OUT': return 'destructive';
      case 'TRANSFER': return 'secondary';
      case 'SWAP': return 'outline';
      default: return 'outline';
    }
  };

  if (!worker) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">العامل غير موجود</h2>
            <p className="text-muted-foreground mb-6">لم يتم العثور على بيانات العامل</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 ml-2" />
              رجوع
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{worker.name}</h1>
            <p className="text-muted-foreground">
              {worker.employeeId && `رقم وظيفي: ${worker.employeeId}`}
              {worker.nationaliy && ` • ${worker.nationaliy}`}
              {worker.role && ` • ${worker.role}`}
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      {currentOccupancy && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                الموقع الحالي
              </CardTitle>
              <Badge variant="default" className="bg-green-600">نشط</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-medium">
              <MapPin className="h-5 w-5 text-primary" />
              {(() => {
                const residence = residences.find(r => r.id === currentOccupancy.residenceId);
                return residence?.name || currentOccupancy.residenceId;
              })()}
              {currentOccupancy.roomId && ` - غرفة ${currentOccupancy.roomId}`}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              تاريخ التسكين: {new Date(currentOccupancy.since).toLocaleDateString('ar-SA')}
              {' • '}
              المدة: {Math.ceil((new Date().getTime() - new Date(currentOccupancy.since).getTime()) / (1000 * 60 * 60 * 24))} يوم
            </div>
            {currentOccupancy.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                {currentOccupancy.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>عمليات التسكين</CardDescription>
            <CardTitle className="text-3xl">{stats.checkIns}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>عمليات الإخراج</CardDescription>
            <CardTitle className="text-3xl">{stats.checkOuts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>عمليات النقل</CardDescription>
            <CardTitle className="text-3xl">{stats.transfers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>عمليات التبديل</CardDescription>
            <CardTitle className="text-3xl">{stats.swaps}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي الأيام</CardDescription>
            <CardTitle className="text-3xl">{stats.totalDays}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            التاريخ الزمني للحركات
          </CardTitle>
          <CardDescription>
            سجل كامل لجميع عمليات التسكين والنقل والإخراج
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد سجل حركات لهذا العامل</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Timeline items */}
              <div className="space-y-6">
                {history.map((item: any, index: number) => (
                  <div key={item.id} className="relative flex gap-4 pr-14">
                    {/* Timeline dot */}
                    <div className="absolute right-[18px] top-2 w-4 h-4 rounded-full bg-background border-4 border-primary z-10" />
                    
                    {/* Content */}
                    <div className="flex-1">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {getActionIcon(item.actionType)}
                              <div>
                                <CardTitle className="text-lg">
                                  {getActionLabel(item.actionType)}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(item.actionDate).toLocaleString('ar-SA', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={getActionBadgeVariant(item.actionType)}>
                              {getActionLabel(item.actionType)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {/* Location details based on action type */}
                          {item.actionType === 'CHECK_IN' && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{item.residenceName || item.residenceId}</span>
                              {item.roomName && ` - ${item.roomName}`}
                            </div>
                          )}
                          
                          {item.actionType === 'CHECK_OUT' && (
                            <>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{item.residenceName || item.residenceId}</span>
                                {item.roomName && ` - ${item.roomName}`}
                              </div>
                              {item.duration && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  مدة الإقامة: {item.duration} يوم
                                </div>
                              )}
                            </>
                          )}
                          
                          {item.actionType === 'TRANSFER' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-red-600">
                                <LogOut className="h-4 w-4" />
                                من: {item.fromResidenceName || item.fromResidenceId}
                                {item.fromRoomName && ` - ${item.fromRoomName}`}
                              </div>
                              <div className="flex items-center gap-2 text-green-600">
                                <LogIn className="h-4 w-4" />
                                إلى: {item.toResidenceName || item.toResidenceId}
                                {item.toRoomName && ` - ${item.toRoomName}`}
                              </div>
                            </div>
                          )}
                          
                          {item.actionType === 'SWAP' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                تبديل مع: {item.swappedWithWorkerName || item.swappedWithWorkerId}
                              </div>
                              <div className="flex items-center gap-2 text-red-600">
                                <LogOut className="h-4 w-4" />
                                من: {item.fromResidenceName || item.fromResidenceId}
                                {item.fromRoomName && ` - ${item.fromRoomName}`}
                              </div>
                              <div className="flex items-center gap-2 text-green-600">
                                <LogIn className="h-4 w-4" />
                                إلى: {item.toResidenceName || item.toResidenceId}
                                {item.toRoomName && ` - ${item.toRoomName}`}
                              </div>
                            </div>
                          )}
                          
                          {/* Reason */}
                          {item.reason && (
                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground">السبب: </span>
                              <span>{item.reason}</span>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {item.notes && (
                            <div className={item.reason ? '' : 'pt-2 border-t'}>
                              <span className="text-muted-foreground">ملاحظات: </span>
                              <span>{item.notes}</span>
                            </div>
                          )}
                          
                          {/* Performed by */}
                          {item.actionByName && (
                            <div className="text-xs text-muted-foreground pt-2">
                              بواسطة: {item.actionByName}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
