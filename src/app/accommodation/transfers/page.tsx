"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useResidences } from '@/context/residences-context';
import { useLanguage } from '@/context/language-context';
import { useUsers } from '@/context/users-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, ArrowRight, Users, Home, Plus } from 'lucide-react';
import { CreateTransferDialog } from '@/components/accommodation/create-transfer-dialog';

export default function TransfersPage() {
  const { transferRequests, reviewTransferRequest, workers } = useAccommodation();
  const { residences } = useResidences();
  const { locale } = useLanguage();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const isAr = locale === 'ar';
  const t = (ar: string, en: string) => locale === 'ar' ? ar : en;

  const getResidenceName = (id: string) => {
    const residence: any = residences?.find(r => r.id === id);
    if (!residence) return id;
    return locale === 'ar'
      ? residence.nameAr || residence.name || residence.nameEn || id
      : residence.nameEn || residence.name || residence.nameAr || id;
  };

  const getWorker = (id: string) => {
    return workers?.find(w => w.id === id);
  };

  const getWorkerName = (id: string) => {
    return getWorker(id)?.name || id;
  };

  const getRoomInfo = (residenceId: string, roomId: string) => {
    const residence = residences?.find(r => r.id === residenceId);
    if (!residence) return roomId;
    
    // Search in flat rooms
    if (residence.rooms) {
      const room = residence.rooms.find(r => r.id === roomId);
      if (room) return getLocalizedName(room, locale) || roomId;
    }
    
    // Search in buildings
    if (residence.buildings) {
      for (const building of residence.buildings) {
        for (const floor of building.floors || []) {
          const room = floor.rooms?.find(r => r.id === roomId);
          if (room) return `${getLocalizedName(building, locale) || t('مبنى', 'Building')} - ${getLocalizedName(floor, locale) || t('طابق', 'Floor')} - ${getLocalizedName(room, locale) || roomId}`;
        }
      }
    }
    
    return roomId;
  };

  const handleReview = async (id: string, approve: boolean) => {
    try {
      await reviewTransferRequest(id, approve, currentUser?.id || 'unknown');
      toast({
        title: approve ? t('تمت الموافقة', 'Approved') : t('تم الرفض', 'Rejected'),
        description: approve 
          ? t('تمت الموافقة على طلب النقل بنجاح', 'Transfer request approved successfully')
          : t('تم رفض طلب النقل', 'Transfer request rejected'),
        variant: approve ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل في معالجة الطلب', 'Failed to process request'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {t('قيد الانتظار', 'Pending')}</Badge>;
      case 'Approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> {t('موافق عليه', 'Approved')}</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {t('مرفوض', 'Rejected')}</Badge>;
      case 'Cancelled':
        return <Badge variant="secondary" className="gap-1">{t('ملغي', 'Cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = transferRequests?.filter(r => r.status === 'Pending') || [];
  const reviewedRequests = transferRequests?.filter(r => r.status !== 'Pending') || [];

  return (
    <div className="space-y-6 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('طلبات النقل', 'Transfer Requests')}</h1>
          <p className="text-muted-foreground mt-1">{t('إدارة طلبات نقل العمال بين المساكن', 'Manage worker transfer requests between residences')}</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button onClick={() => setTransferDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('طلب نقل جديد', 'New Transfer Request')}
          </Button>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingRequests.length} {t('قيد الانتظار', 'pending')}
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
            {t('طلبات قيد المراجعة', 'Requests Pending Review')}
          </h2>
          <div className="grid gap-4">
            {pendingRequests.map(request => (
              <Card key={request.id} className="border-amber-200 dark:border-amber-900">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{t('طلب نقل', 'Transfer Request')} #{request.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        {t('تاريخ الطلب', 'Requested on')}: {new Date(request.requestedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
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
                        <p className="font-medium">{t('من', 'From')}:</p>
                        <p className="text-muted-foreground">
                          {request.from?.residenceId 
                            ? `${getResidenceName(request.from.residenceId)}${request.from.roomId ? ` - ${getRoomInfo(request.from.residenceId, request.from.roomId)}` : ''}`
                            : t('غير محدد', 'Not specified')}
                        </p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    
                    <div className="flex items-center gap-2 flex-1">
                      <Home className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{t('إلى', 'To')}:</p>
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
                      <p className="font-medium text-sm mb-1">{t('العمال', 'Workers')} ({request.workerIds.length}):</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {request.workerIds.slice(0, 12).map(wid => {
                          const worker: any = getWorker(wid);
                          return (
                            <div key={wid} className="rounded-md border bg-muted/30 p-2 text-xs">
                              <div className="font-medium text-foreground">{worker?.name || wid}</div>
                              <div className="text-muted-foreground">
                                {[worker?.employeeId ? `${t('رقم الموظف', 'Emp')}: ${worker.employeeId}` : '', worker?.idNumber ? `${t('الهوية', 'ID')}: ${worker.idNumber}` : ''].filter(Boolean).join(' | ') || wid}
                              </div>
                              <div className="text-muted-foreground">
                                {[worker?.company ? `${t('الشركة', 'Company')}: ${worker.company}` : '', worker?.nationaliy ? `${t('الجنسية', 'Nationality')}: ${worker.nationaliy}` : ''].filter(Boolean).join(' | ')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {request.workerIds.length > 12 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          +{request.workerIds.length - 12} {t('عامل إضافي', 'more workers')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm"><span className="font-medium">{t('السبب', 'Reason')}:</span> {request.reason}</p>
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
                      {t('موافقة', 'Approve')}
                    </Button>
                    <Button 
                      onClick={() => handleReview(request.id, false)}
                      className="flex-1"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('رفض', 'Reject')}
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
          <h2 className="text-xl font-semibold">{t('الطلبات السابقة', 'Previous Requests')}</h2>
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
                        <span>{request.workerIds.length} {t('عامل', 'workers')}</span>
                      </div>
                      {request.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          {t('تمت المراجعة', 'Reviewed on')}: {new Date(request.reviewedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
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
            <h3 className="text-lg font-semibold mb-2">{t('لا توجد طلبات نقل', 'No Transfer Requests')}</h3>
            <p className="text-muted-foreground text-center">
              {t('لم يتم إنشاء أي طلبات نقل بعد', 'No transfer requests have been created yet')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getLocalizedName(entity: any, locale: 'ar' | 'en') {
  if (!entity) return '';
  return locale === 'ar'
    ? entity.nameAr || entity.name || entity.nameEn || entity.id
    : entity.nameEn || entity.name || entity.nameAr || entity.id;
}
