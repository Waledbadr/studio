
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { List, TrendingUp, Wrench } from "lucide-react";
import Link from "next/link";


export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-muted-foreground">
          عرض وإنشاء تقارير للمخزون والصيانة والمزيد.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 hover:shadow-md transition-all">
          <Link href="/inventory" className="block h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <List className="h-6 w-6 text-primary" />
                <CardTitle>تقارير المخزون</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                انقر للذهاب إلى صفحة المخزون. من هناك، انقر على أي صنف لعرض تقرير حركته المفصل.
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 hover:shadow-md transition-all">
          <Link href="/inventory/reports/stock-movement" className="block h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <CardTitle>تقرير حركة المخزون</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                تقرير مفصل لحركة المواد حسب السكن والفترة الزمنية ونوع الحركة.
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        {/* Placeholder for future reports */}
        <Card className="border-dashed">
            <CardHeader>
                <div className="flex items-center gap-3">
                  <Wrench className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="text-muted-foreground">تقارير الصيانة</CardTitle>
                </div>
            </CardHeader>
             <CardContent>
              <CardDescription>
                التقارير المستقبلية لأنشطة الصيانة ستكون متاحة هنا.
              </CardDescription>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
