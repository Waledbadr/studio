"use client";

import React, { useEffect, useState } from "react";
import { useResidences } from "@/context/residences-context";
import { useAccommodation } from "@/context/accommodation-context";
import { auth, db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Users, 
  Building2, 
  Bed,
  RefreshCw,
  Home
} from "lucide-react";

export default function DebugDataPage() {
  const { residences, loading: residencesLoading } = useResidences();
  const { workers, occupants } = useAccommodation();
  const [authStatus, setAuthStatus] = useState<any>(null);

  useEffect(() => {
    if (auth) {
      const user = auth.currentUser;
      setAuthStatus({
        isAuthenticated: !!user,
        userId: user?.uid || null,
        email: user?.email || null,
      });
    }
  }, []);

  // Calculate statistics
  const stats = {
    // Workers
    totalWorkers: workers.length,
    workersWithId: workers.filter(w => w.id).length,
    workersWithName: workers.filter(w => w.name).length,
    workersWithNationality: workers.filter(w => w.nationaliy).length,
    
    // Occupants
    totalOccupants: occupants.length,
    activeOccupants: occupants.filter(o => !o.until).length,
    inactiveOccupants: occupants.filter(o => o.until).length,
    
    // Residences
    totalResidences: residences.length,
    residencesWithBuildings: residences.filter(r => r.buildings && r.buildings.length > 0).length,
    residencesWithFlatRooms: residences.filter(r => r.rooms && r.rooms.length > 0).length,
    
    // Rooms
    totalRooms: residences.reduce((sum, r) => {
      // Count hierarchical rooms
      const hierarchicalRooms = r.buildings?.reduce((bsum, b) => 
        bsum + (b.floors?.reduce((fsum, f) => fsum + (f.rooms?.length || 0), 0) || 0), 0
      ) || 0;
      // Count flat rooms
      const flatRooms = r.rooms?.length || 0;
      return sum + hierarchicalRooms + flatRooms;
    }, 0),
    
    totalCapacity: residences.reduce((sum, r) => {
      const hierarchicalCapacity = r.buildings?.reduce((bsum, b) => 
        bsum + (b.floors?.reduce((fsum, f) => 
          fsum + (f.rooms?.reduce((rsum, room) => rsum + (room.capacity || 0), 0) || 0), 0
        ) || 0), 0
      ) || 0;
      const flatCapacity = r.rooms?.reduce((rsum, room) => rsum + (room.capacity || 0), 0) || 0;
      return sum + hierarchicalCapacity + flatCapacity;
    }, 0),
  };

  // Check data integrity
  const issues: { type: 'error' | 'warning' | 'info'; message: string }[] = [];

  if (!db) {
    issues.push({ type: 'error', message: 'Firebase DB غير مهيأ - تحقق من .env.local' });
  }
  if (!auth?.currentUser) {
    issues.push({ type: 'warning', message: 'لم يتم تسجيل الدخول - قد لا تظهر البيانات' });
  }
  if (workers.length === 0) {
    issues.push({ type: 'error', message: 'لا توجد بيانات عمال في النظام' });
  }
  if (residences.length === 0) {
    issues.push({ type: 'error', message: 'لا توجد مساكن في النظام' });
  }
  if (stats.totalRooms === 0 && residences.length > 0) {
    issues.push({ type: 'warning', message: 'المساكن موجودة لكن لا توجد غرف!' });
  }
  if (occupants.length > 0 && workers.length === 0) {
    issues.push({ type: 'warning', message: 'يوجد سجلات تسكين لكن لا توجد بيانات عمال!' });
  }
  if (stats.activeOccupants > stats.totalRooms && stats.totalRooms > 0) {
    issues.push({ type: 'warning', message: 'عدد المساكن الفعلية أكبر من عدد الغرف المتاحة!' });
  }

  // Sample data
  const sampleWorker = workers[0];
  const sampleOccupant = occupants[0];
  const sampleResidence = residences[0];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 تشخيص البيانات</h1>
          <p className="text-muted-foreground mt-1">فحص شامل لحالة قاعدة البيانات والاتصال</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      <Separator />

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              حالة Firebase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {db ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">متصل</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">غير متصل</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              حالة المصادقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {authStatus?.isAuthenticated ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">مسجل الدخول</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">غير مسجل</span>
                </>
              )}
            </div>
            {authStatus?.email && (
              <p className="text-xs text-muted-foreground mt-1">{authStatus.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              حالة التحميل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {residencesLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-sm">جاري التحميل...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">تم التحميل</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              مشاكل محتملة ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  {issue.type === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : issue.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-yellow-700 dark:text-yellow-300">{issue.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">العمال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalWorkers}</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>✓ {stats.workersWithId} لديهم معرّف</div>
              <div>✓ {stats.workersWithName} لديهم اسم</div>
              <div>✓ {stats.workersWithNationality} لديهم جنسية</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">التسكين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalOccupants}</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>✓ {stats.activeOccupants} نشط</div>
              <div>✓ {stats.inactiveOccupants} منتهي</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">المساكن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalResidences}</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>✓ {stats.residencesWithBuildings} بنية هرمية</div>
              <div>✓ {stats.residencesWithFlatRooms} غرف مباشرة</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">الغرف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalRooms}</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>✓ السعة: {stats.totalCapacity}</div>
              <div>✓ المشغول: {stats.activeOccupants}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sample Worker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              عينة عامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {sampleWorker ? (
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(sampleWorker, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sample Occupant */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bed className="h-4 w-4" />
              عينة تسكين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {sampleOccupant ? (
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(sampleOccupant, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sample Residence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              عينة مسكن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {sampleResidence ? (
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify({
                    id: sampleResidence.id,
                    name: sampleResidence.name,
                    buildingsCount: sampleResidence.buildings?.length || 0,
                    flatRoomsCount: sampleResidence.rooms?.length || 0,
                    // Show first building structure if exists
                    firstBuilding: sampleResidence.buildings?.[0] ? {
                      id: sampleResidence.buildings[0].id,
                      name: sampleResidence.buildings[0].name,
                      floorsCount: sampleResidence.buildings[0].floors?.length || 0,
                      firstFloor: sampleResidence.buildings[0].floors?.[0] ? {
                        id: sampleResidence.buildings[0].floors[0].id,
                        name: sampleResidence.buildings[0].floors[0].name,
                        roomsCount: sampleResidence.buildings[0].floors[0].rooms?.length || 0,
                      } : null
                    } : null
                  }, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Residence Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل المساكن</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {residences.map((residence) => {
                const hierarchicalRooms = residence.buildings?.reduce((bsum, b) => 
                  bsum + (b.floors?.reduce((fsum, f) => fsum + (f.rooms?.length || 0), 0) || 0), 0
                ) || 0;
                const flatRooms = residence.rooms?.length || 0;
                const totalRooms = hierarchicalRooms + flatRooms;

                return (
                  <div key={residence.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{residence.name}</h3>
                      <Badge variant="outline">
                        {totalRooms} غرفة
                      </Badge>
                    </div>
                    
                    {residence.buildings && residence.buildings.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <div className="font-medium mb-1">بنية هرمية:</div>
                        <ul className="space-y-1 mr-4">
                          {residence.buildings.map((building) => (
                            <li key={building.id}>
                              • {building.name} ({building.floors?.length || 0} طوابق، 
                              {building.floors?.reduce((sum, f) => sum + (f.rooms?.length || 0), 0) || 0} غرفة)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {residence.rooms && residence.rooms.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <div className="font-medium">غرف مباشرة: {flatRooms}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                console.log('=== FULL DEBUG DUMP ===');
                console.log('Workers:', workers);
                console.log('Occupants:', occupants);
                console.log('Residences:', residences);
                console.log('Auth:', authStatus);
                console.log('Firebase DB:', !!db);
                alert('تم طباعة جميع البيانات في Console (اضغط F12)');
              }}
            >
              طباعة البيانات في Console
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const data = {
                  workers,
                  occupants,
                  residences: residences.map(r => ({
                    ...r,
                    buildingsCount: r.buildings?.length || 0,
                    flatRoomsCount: r.rooms?.length || 0,
                  })),
                  stats,
                  authStatus,
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `debug-data-${new Date().toISOString()}.json`;
                a.click();
              }}
            >
              تصدير البيانات JSON
            </Button>
            
            <Button
              onClick={() => window.location.href = '/accommodation/unified-management'}
            >
              العودة للإدارة الموحدة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
