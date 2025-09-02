'use client';

import { TestComponentsManager } from '@/components/test/TestComponentsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FacilityComponentsTestPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">اختبار نظام مكونات المرافق</h1>
        <p className="text-muted-foreground">
          صفحة لاختبار إضافة وإدارة مكونات المرافق (اللمبات والأفياش وغيرها)
        </p>
      </div>

      <TestComponentsManager />

      <Card>
        <CardHeader>
          <CardTitle>خطوات الاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. إضافة المكونات</h3>
            <p className="text-sm text-muted-foreground">
              استخدم الأزرار أعلاه لإضافة مكونات تجريبية للممرات الموجودة
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">2. عرض المكونات</h3>
            <p className="text-sm text-muted-foreground">
              اذهب إلى صفحة السكن لترى المكونات المضافة تحت كل ممر
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">3. اختبار MIV</h3>
            <p className="text-sm text-muted-foreground">
              اذهب إلى صفحة MIV، اختر "تجهيزات"، اختر الممر، ستظهر قائمة المكونات للاختيار
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">4. النتيجة المتوقعة</h3>
            <p className="text-sm text-muted-foreground">
              يمكن صرف مواد للممر عام (دهان) أو لمكون محدد (لمبة 5)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
