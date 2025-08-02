'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Download, Home, TrendingUp, TrendingDown, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface AuditCompletion {
  id: string;
  name: string;
  residenceId: string;
  residenceName: string;
  completedDate: Date;
  duration: string;
  totalItems: number;
  adjustedItems: number;
  positiveAdjustments: number;
  negativeAdjustments: number;
  netChange: number;
  adjustmentsSummary: {
    itemNameAr: string;
    locationName: string;
    oldStock: number;
    newStock: number;
    difference: number;
    unit: string;
    reason: string;
  }[];
}

export default function AuditCompletePage() {
  const params = useParams();
  const auditId = params.id as string;
  
  const [auditCompletion, setAuditCompletion] = useState<AuditCompletion | null>(null);

  // Mock completion data - in real implementation, this would come from Firestore
  useEffect(() => {
    const mockCompletion: AuditCompletion = {
      id: auditId,
      name: 'جرد فبراير 2025',
      residenceId: 'res-1',
      residenceName: 'المبنى الأول',
      completedDate: new Date(),
      duration: '2 أيام و 3 ساعات',
      totalItems: 25,
      adjustedItems: 2,
      positiveAdjustments: 1,
      negativeAdjustments: 1,
      netChange: -1,
      adjustmentsSummary: [
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

    setAuditCompletion(mockCompletion);
  }, [auditId]);

  const exportReport = () => {
    // Implementation for exporting audit report
    console.log('Exporting audit report...');
  };

  if (!auditCompletion) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تم إكمال الجرد بنجاح!</h1>
        <p className="text-gray-600 text-lg">
          {auditCompletion.name} - {auditCompletion.residenceName}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          مكتمل في {auditCompletion.completedDate.toLocaleDateString('ar-SA')} - 
          استغرق {auditCompletion.duration}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأصناف</p>
                <p className="text-2xl font-bold text-gray-900">{auditCompletion.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">أصناف معدلة</p>
                <p className="text-2xl font-bold text-gray-900">{auditCompletion.adjustedItems}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">زيادة</p>
                <p className="text-2xl font-bold text-gray-900">+{auditCompletion.positiveAdjustments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نقص</p>
                <p className="text-2xl font-bold text-gray-900">-{auditCompletion.negativeAdjustments}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Change Summary */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">صافي التغيير في المخزون</h3>
              <p className="text-gray-600">
                إجمالي التغيير في عدد الأصناف بعد تطبيق التعديلات
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${
                auditCompletion.netChange > 0 ? 'text-green-600' : 
                auditCompletion.netChange < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {auditCompletion.netChange > 0 ? '+' : ''}{auditCompletion.netChange}
              </p>
              <p className="text-sm text-gray-500">قطعة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments Summary */}
      {auditCompletion.adjustmentsSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص التعديلات المطبقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditCompletion.adjustmentsSummary.map((adjustment, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{adjustment.itemNameAr}</h4>
                      <p className="text-sm text-gray-600">{adjustment.locationName}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        adjustment.difference > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {adjustment.difference > 0 ? '+' : ''}{adjustment.difference} {adjustment.unit}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">التغيير:</span> {adjustment.oldStock} → {adjustment.newStock} {adjustment.unit}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">السبب:</span> {adjustment.reason}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          تحميل تقرير الجرد
        </Button>
        
        <Link href="/inventory/inventory-audit">
          <Button variant="outline" className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            عرض جميع عمليات الجرد
          </Button>
        </Link>
        
        <Link href="/inventory">
          <Button variant="outline" className="w-full sm:w-auto">
            <Home className="w-4 h-4 mr-2" />
            العودة للمخزون
          </Button>
        </Link>
      </div>

      {/* Additional Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">معلومات مهمة</h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <p>• تم تطبيق جميع التعديلات على مخزون النظام</p>
            <p>• تم إنشاء سجلات معاملات للتعديلات المطبقة</p>
            <p>• يمكنك عرض تاريخ هذه التعديلات في تقارير حركة المخزون</p>
            <p>• سيتم إرسال تقرير مفصل بالبريد الإلكتروني خلال 10 دقائق</p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>الخطوات التالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">مراجعة التقرير</p>
                <p className="text-gray-600">قم بمراجعة التقرير المفصل للجرد والتأكد من دقة البيانات</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">تحديث السياسات</p>
                <p className="text-gray-600">راجع أي أنماط في الاختلافات وحدث سياسات المخزون حسب الحاجة</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">جدولة الجرد التالي</p>
                <p className="text-gray-600">حدد موعد الجرد القادم بناءً على نتائج هذا الجرد</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
