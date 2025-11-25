"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LogIn, 
  LogOut, 
  ArrowRightLeft, 
  Repeat2, 
  Calendar,
  BarChart3,
  Users,
  Home,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AccommodationGuidePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">🏠 دليل استخدام نظام التسكين</h1>
        <p className="text-xl text-muted-foreground">
          شرح بسيط وواضح لكيفية تسكين العمال والنقل والتبديل
        </p>
      </div>

      {/* Quick Actions Card */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            العمليات الأساسية
          </CardTitle>
          <CardDescription>
            جميع العمليات متاحة من صفحة التسكين الرئيسية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/accommodation/assign">
            <Button className="w-full h-16 text-lg" size="lg">
              <Home className="h-6 w-6 ml-2" />
              انتقل إلى صفحة التسكين
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Operations Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check-In */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <LogIn className="h-5 w-5" />
              1. التسكين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-2">كيفية تسكين عامل واحد:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>اذهب إلى <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">/accommodation/assign</span></li>
                <li>اختر المسكن والغرفة من القوائم</li>
                <li>اسحب العامل وأفلته على الغرفة (Drag & Drop)</li>
                <li>أو: حدد العامل واضغط "تسكين"</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2">تسكين جماعي (متعدد):</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>اضغط زر <span className="font-bold text-green-600">"تسكين جماعي"</span> في الأعلى</li>
                <li>حدد العمال المطلوبين</li>
                <li>اختر المسكن والغرفة</li>
                <li>حدد التاريخ (اختياري)</li>
                <li>أضف ملاحظات إن وُجدت</li>
                <li>اضغط "تسكين الجميع"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Check-Out */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              2. الإخراج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md border border-red-200 dark:border-red-800">
              <h4 className="font-semibold mb-2">كيفية إخراج عامل واحد:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>اذهب إلى صفحة التسكين</li>
                <li>اضغط على الغرفة التي فيها العامل</li>
                <li>اضغط زر <span className="font-bold">❌</span> بجانب اسم العامل</li>
                <li>أكد العملية</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2">إخراج جماعي (متعدد):</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>اضغط زر <span className="font-bold text-red-600">"إخراج جماعي"</span> في الأعلى</li>
                <li>حدد العمال المراد إخراجهم</li>
                <li>حدد تاريخ الإخراج</li>
                <li>اكتب السبب (اختياري)</li>
                <li>أضف ملاحظات</li>
                <li>اضغط "إخراج الجميع"</li>
              </ol>
              <p className="text-xs mt-2 text-muted-foreground">
                💡 سيتم حساب مدة الإقامة تلقائياً
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <ArrowRightLeft className="h-5 w-5" />
              3. النقل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2">نقل عامل من غرفة لأخرى:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>اضغط زر <span className="font-bold text-blue-600">"نقل جماعي"</span></li>
                <li>حدد العامل/العمال</li>
                <li>اختر المسكن والغرفة الجديدة</li>
                <li>حدد تاريخ النقل</li>
                <li>اكتب السبب (اختياري)</li>
                <li>اضغط "نقل الجميع"</li>
              </ol>
              <p className="text-xs mt-2 text-muted-foreground">
                💡 النظام يُخرج العامل من الغرفة القديمة ويُسكّنه في الجديدة تلقائياً
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold mb-2">طلب نقل (للموافقة):</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>اضغط زر <span className="font-bold">"طلب نقل"</span></li>
                <li>حدد العمال</li>
                <li>حدد الموقع الجديد</li>
                <li>أرسل الطلب</li>
                <li>ينتظر موافقة المشرف/المدير</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Calendar className="h-5 w-5" />
              4. عرض التاريخ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-2">عرض تاريخ عامل معين:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>من صفحة التسكين، اضغط زر "التاريخ" على العامل</li>
                <li>أو اذهب مباشرة: <span className="font-mono text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">/accommodation/worker-timeline/[id]</span></li>
              </ol>
              
              <h4 className="font-semibold mb-2 mt-4">ماذا ستشاهد:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>جميع حركات العامل (تسكين، إخراج، نقل)</li>
                <li>التواريخ والمواقع</li>
                <li>مدة كل إقامة</li>
                <li>Timeline بصري جميل</li>
                <li>إحصائيات شاملة</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports */}
      <Card className="border-2 border-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-600">
            <BarChart3 className="h-6 w-6" />
            التقارير والتحليلات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            صفحة التقارير الزمنية توفر لك:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <span className="font-semibold">تصفية متقدمة:</span> حسب الفترة الزمنية، نوع العملية، المسكن
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <span className="font-semibold">إحصائيات شاملة:</span> عدد العمليات، متوسط مدة الإقامة
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <span className="font-semibold">رسوم بيانية:</span> النشاط حسب أيام الأسبوع والمسكن
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <span className="font-semibold">قوائم:</span> العمال الأكثر حركة
              </div>
            </li>
          </ul>
          
          <Link href="/accommodation/timeline-reports">
            <Button className="w-full" variant="outline" size="lg">
              <BarChart3 className="h-5 w-5 ml-2" />
              افتح صفحة التقارير الزمنية
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-300">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">💡 نصائح مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-xl">✅</span>
            <p>جميع العمليات تُسجّل تلقائياً في نظام التاريخ</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">✅</span>
            <p>يمكنك تحديد تواريخ مخصصة لكل عملية</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">✅</span>
            <p>النظام يحسب مدة الإقامة تلقائياً عند الإخراج</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">✅</span>
            <p>يتم التحقق من الجنسية والسعة تلقائياً</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">✅</span>
            <p>كل عملية تُسجّل: من قام بها، متى، ولماذا</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <p className="font-semibold">لا يمكن تسكين عامل في غرفة ممتلئة أو بها جنسية مختلفة</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/accommodation/assign">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">التسكين</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accommodation/timeline-reports">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">التقارير</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accommodation/workers">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold">العمال</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accommodation/overview">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">نظرة عامة</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
