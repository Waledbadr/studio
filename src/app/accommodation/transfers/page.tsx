"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useResidences } from '@/context/residences-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, ArrowRight, Users, Home, Plus } from 'lucide-react';
import { CreateTransferDialog } from '@/components/accommodation/create-transfer-dialog';

export default function TransfersPage() {
  const { transferRequests, reviewTransferRequest, workers, occupants } = useAccommodation();
  const { residences } = useResidences();
  const { toast } = useToast();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const getResidenceName = (id: string) => {
    return residences?.find(r => r.id === id)?.name || id;
  };

  const getWorkerName = (id: string) => {
    return workers?.find(w => w.id === id)?.name || id;
  };

  const getRoomInfo = (residenceId: string, roomId: string) => {
    const residence = residences?.find(r => r.id === residenceId);
    if (!residence) return roomId;
    
    // Search in flat rooms
    if (residence.rooms) {
      const room = residence.rooms.find(r => r.id === roomId);
      if (room) return room.name || roomId;
    }
    
    // Search in buildings
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          const room = floor.rooms?.find(r => r.id === roomId);
          if (room) return `${building.name || 'Building'} - ${floor.name || 'Floor'} - ${room.name || roomId}`;
        }
      }
    }
    
    return roomId;
  };

  const handleReview = async (id: string, approve: boolean) => {
    try {
      await reviewTransferRequest(id, approve, 'current-user-id');
      toast({
        title: approve ? 'تمت الموافقة' : 'تم الرفض',
        description: approve 
          ? 'تمت الموافقة على طلب النقل بنجاح' 
          : 'تم رفض طلب النقل',
        variant: approve ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في معالجة الطلب',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> قيد الانتظار</Badge>;
      case 'Approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> موافق عليه</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> مرفوض</Badge>;
      case 'Cancelled':
        return <Badge variant="secondary" className="gap-1">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = transferRequests?.filter(r => r.status === 'Pending') || [];
  const reviewedRequests = transferRequests?.filter(r => r.status !== 'Pending') || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">طلبات النقل</h1>
          <p className="text-muted-foreground mt-1">إدارة طلبات نقل العمال بين المساكن</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button onClick={() => setTransferDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            طلب نقل جديد
          </Button>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingRequests.length} قيد الانتظار
          </Badge>
        </div>
      </div>
      
      <CreateTransferDialog 
        isOpen={transferDialogOpen} 
        onOpenChange={setTransferDialogOpen}
      />

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            طلبات قيد المراجعة
          </h2>
          <div className="grid gap-4">
            {pendingRequests.map(request => (
              <Card key={request.id} className="border-amber-200 dark:border-amber-900">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">طلب نقل #{request.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        تاريخ الطلب: {new Date(request.requestedAt).toLocaleDateString('ar-EG')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Transfer Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">من:</p>
                        <p className="text-muted-foreground">
                          {request.from?.residenceId 
                            ? `${getResidenceName(request.from.residenceId)}${request.from.roomId ? ` - ${getRoomInfo(request.from.residenceId, request.from.roomId)}` : ''}`
                            : 'غير محدد'}
                        </p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    
                    <div className="flex items-center gap-2 flex-1">
                      <Home className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">إلى:</p>
                        <p className="text-primary">
                          {getResidenceName(request.to.residenceId)}
                          {request.to.roomId && ` - ${getRoomInfo(request.to.residenceId, request.to.roomId)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workers */}
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">العمال ({request.workerIds.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {request.workerIds.map(wid => (
                          <Badge key={wid} variant="secondary">
                            {getWorkerName(wid)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm"><span className="font-medium">السبب:</span> {request.reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleReview(request.id, true)}
                      className="flex-1"
                      variant="default"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      موافقة
                    </Button>
                    <Button 
                      onClick={() => handleReview(request.id, false)}
                      className="flex-1"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      رفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">الطلبات السابقة</h2>
          <div className="grid gap-3">
            {reviewedRequests.map(request => (
              <Card key={request.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{request.id.slice(0, 8)}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{getResidenceName(request.to.residenceId)}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{request.workerIds.length} عامل</span>
                      </div>
                      {request.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          تمت المراجعة: {new Date(request.reviewedAt).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {transferRequests?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowRight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد طلبات نقل</h3>
            <p className="text-muted-foreground text-center">
              لم يتم إنشاء أي طلبات نقل بعد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
