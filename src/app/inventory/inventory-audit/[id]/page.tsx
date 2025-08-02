'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Calendar, User, MapPin, Package, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

interface AuditDetail {
  id: string;
  name: string;
  description: string;
  residenceId: string;
  residenceName: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  scope: {
    locations: string[];
    categories: string[];
    includeAllItems: boolean;
    specificItems: string[];
  };
  summary: {
    totalItems: number;
    completedItems: number;
    discrepanciesCount: number;
    adjustmentsMade: number;
  };
  adjustments: {
    itemNameAr: string;
    locationName: string;
    oldStock: number;
    newStock: number;
    difference: number;
    unit: string;
    reason: string;
  }[];
}

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;
  
  const [auditDetail, setAuditDetail] = useState<AuditDetail | null>(null);

  // Mock audit detail data - in real implementation, this would come from Firestore
  useEffect(() => {
    const mockAuditDetail: AuditDetail = {
      id: auditId,
      name: 'جرد فبراير 2025',
      description: 'جرد شامل لجميع أصناف المخزون في المبنى الأول',
      residenceId: 'res-1',
      residenceName: 'المبنى الأول',
      status: 'COMPLETED',
      createdBy: 'أحمد محمد',
      createdAt: new Date('2025-02-01'),
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-03'),
      scope: {
        locations: ['room-101:غرفة 101', 'room-102:غرفة 102', 'room-103:غرفة 103'],
        categories: ['أثاث', 'إلكترونيات'],
        includeAllItems: true,
        specificItems: []
      },
      summary: {
        totalItems: 25,
        completedItems: 25,
        discrepanciesCount: 3,
        adjustmentsMade: 2
      },
      adjustments: [
        {
          itemNameAr: 'كرسي مكتب',
          locationName: 'غرفة 101',
          oldStock: 5,
          newStock: 4,
          difference: -1,
          unit: 'قطعة',
          reason: 'تلف في الكرسي وتم التخلص منه'
        },
        {
          itemNameAr: 'طابعة',
          locationName: 'غرفة 103',
          oldStock: 2,
          newStock: 3,
          difference: 1,
          unit: 'قطعة',
          reason: 'طابعة جديدة لم يتم تسجيلها'
        }
      ]
    };

    setAuditDetail(mockAuditDetail);
  }, [auditId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">تحت التخطيط</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">قيد التنفيذ</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-100 text-red-800">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportReport = () => {
    // Implementation for exporting audit report
    console.log('Exporting audit report...');
  };

  if (!auditDetail) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory/inventory-audit">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للقائمة
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{auditDetail.name}</h1>
          <p className="text-gray-600">{auditDetail.residenceName}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/inventory/inventory-audit/${auditId}/reconcile`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Package className="w-4 h-4 mr-2" />
              Start Stock Count
            </Button>
          </Link>
          {getStatusBadge(auditDetail.status)}
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            تحميل التقرير
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معلومات الجرد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium text-gray-700">رقم الجرد:</span>
              <p className="text-gray-900">{auditDetail.id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">الوصف:</span>
              <p className="text-gray-900">{auditDetail.description}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">المنشئ:</span>
              <p className="text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                {auditDetail.createdBy}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">تاريخ الإنشاء:</span>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(auditDetail.createdAt, 'dd/MM/yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              التواريخ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium text-gray-700">تاريخ البداية:</span>
              <p className="text-gray-900">
                {auditDetail.startDate ? format(auditDetail.startDate, 'dd/MM/yyyy') : 'لم يبدأ بعد'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">تاريخ الانتهاء:</span>
              <p className="text-gray-900">
                {auditDetail.endDate ? format(auditDetail.endDate, 'dd/MM/yyyy') : 'لم ينته بعد'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">المدة:</span>
              <p className="text-gray-900">
                {auditDetail.startDate && auditDetail.endDate
                  ? `${Math.ceil((auditDetail.endDate.getTime() - auditDetail.startDate.getTime()) / (1000 * 60 * 60 * 24))} أيام`
                  : 'غير محدد'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">الحالة:</span>
              <div className="mt-1">{getStatusBadge(auditDetail.status)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scope Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            نطاق الجرد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">المواقع</h4>
              <div className="space-y-1">
                {auditDetail.scope.locations.map((location, index) => {
                  const locationName = location.split(':')[1];
                  return (
                    <Badge key={index} variant="outline" className="mr-1">
                      {locationName}
                    </Badge>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">الفئات</h4>
              <div className="space-y-1">
                {auditDetail.scope.categories.length > 0 ? (
                  auditDetail.scope.categories.map((category, index) => (
                    <Badge key={index} variant="outline" className="mr-1">
                      {category}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">جميع الفئات</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">الأصناف</h4>
              <div>
                {auditDetail.scope.includeAllItems ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    جميع الأصناف
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    أصناف محددة ({auditDetail.scope.specificItems.length})
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأصناف</p>
                <p className="text-2xl font-bold text-gray-900">{auditDetail.summary.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">مكتمل</p>
                <p className="text-2xl font-bold text-gray-900">{auditDetail.summary.completedItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">اختلافات</p>
                <p className="text-2xl font-bold text-gray-900">{auditDetail.summary.discrepanciesCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">تعديلات مطبقة</p>
                <p className="text-2xl font-bold text-gray-900">{auditDetail.summary.adjustmentsMade}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustments Table */}
      {auditDetail.adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>التعديلات المطبقة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">الموقع</TableHead>
                    <TableHead className="text-right">المخزون السابق</TableHead>
                    <TableHead className="text-right">المخزون الجديد</TableHead>
                    <TableHead className="text-right">الفرق</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditDetail.adjustments.map((adjustment, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="text-right font-medium">
                        {adjustment.itemNameAr}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {adjustment.locationName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {adjustment.oldStock} {adjustment.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {adjustment.newStock} {adjustment.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          adjustment.difference > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {adjustment.difference > 0 ? '+' : ''}{adjustment.difference} {adjustment.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right max-w-xs">
                        <div className="text-sm text-gray-600 truncate" title={adjustment.reason}>
                          {adjustment.reason}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        {auditDetail.status === 'IN_PROGRESS' && (
          <Link href={`/inventory/inventory-audit/${auditId}/execute`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              متابعة الجرد
            </Button>
          </Link>
        )}
        
        <Button onClick={exportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          تحميل التقرير التفصيلي
        </Button>
      </div>
    </div>
  );
}
