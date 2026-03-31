"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Calendar,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  Download,
  Filter,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Repeat2,
} from 'lucide-react';

export default function TimelineReportsPage() {
  const {
    fetchHistoryByDateRange,
    workers,
    residences,
  } = useAccommodation();
  const { currentUser } = useUsers();

  // Filter residences based on user role
  const filteredResidences = useMemo(() => {
    if (!currentUser) return residences;
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences]);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [residenceFilter, setResidenceFilter] = useState<string>('ALL');

  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch filtered history
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        let history = await fetchHistoryByDateRange(
          startDate + 'T00:00:00.000Z',
          endDate + 'T23:59:59.999Z'
        );

        if (actionTypeFilter !== 'ALL') {
          history = history.filter(h => h.actionType === actionTypeFilter);
        }

        if (residenceFilter !== 'ALL') {
          history = history.filter(h => 
            h.residenceId === residenceFilter ||
            h.fromResidenceId === residenceFilter ||
            h.toResidenceId === residenceFilter
          );
        }

        if (isMounted) setFilteredHistory(history);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [startDate, endDate, actionTypeFilter, residenceFilter, fetchHistoryByDateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const checkIns = filteredHistory.filter(h => h.actionType === 'CHECK_IN').length;
    const checkOuts = filteredHistory.filter(h => h.actionType === 'CHECK_OUT').length;
    const transfers = filteredHistory.filter(h => h.actionType === 'TRANSFER').length;
    const swaps = filteredHistory.filter(h => h.actionType === 'SWAP').length;
    
    // Calculate average stay duration from dates dynamically
    // Group history by worker and calculate durations
    const workerStays: Record<string, { checkIn: Date | null; durations: number[] }> = {};
    
    // Sort by date
    const sortedHistory = [...filteredHistory].sort((a, b) => 
      new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime()
    );
    
    for (const record of sortedHistory) {
      if (!workerStays[record.workerId]) {
        workerStays[record.workerId] = { checkIn: null, durations: [] };
      }
      
      if (record.actionType === 'CHECK_IN') {
        const checkInDate = new Date(record.actionDate);
        checkInDate.setHours(0, 0, 0, 0);
        workerStays[record.workerId].checkIn = checkInDate;
      } else if (record.actionType === 'CHECK_OUT' && workerStays[record.workerId].checkIn) {
        const checkOutDate = new Date(record.actionDate);
        checkOutDate.setHours(0, 0, 0, 0);
        const checkInDate = workerStays[record.workerId].checkIn!;
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const duration = Math.max(diffDays + 1, 1); // +1 to include check-in day
        workerStays[record.workerId].durations.push(duration);
        workerStays[record.workerId].checkIn = null;
      }
    }
    
    // Calculate average
    const allDurations = Object.values(workerStays).flatMap(w => w.durations);
    const avgStayDuration = allDurations.length > 0
      ? Math.round(allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length)
      : 0;

    // Activity by residence
    const activityByResidence: Record<string, number> = {};
    filteredHistory.forEach(h => {
      const resId = h.residenceId || h.toResidenceId || h.fromResidenceId;
      if (resId) {
        activityByResidence[resId] = (activityByResidence[resId] || 0) + 1;
      }
    });

    // Most active workers
    const activityByWorker: Record<string, number> = {};
    filteredHistory.forEach(h => {
      activityByWorker[h.workerId] = (activityByWorker[h.workerId] || 0) + 1;
    });

    const topWorkers = Object.entries(activityByWorker)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([workerId, count]) => ({
        workerId,
        workerName: workers.find(w => w.id === workerId)?.name || workerId,
        activityCount: count,
      }));

    // Activity by day of week
    const activityByDayOfWeek: Record<number, number> = {};
    filteredHistory.forEach(h => {
      const day = new Date(h.actionDate).getDay();
      activityByDayOfWeek[day] = (activityByDayOfWeek[day] || 0) + 1;
    });

    return {
      checkIns,
      checkOuts,
      transfers,
      swaps,
      total: filteredHistory.length,
      avgStayDuration,
      activityByResidence,
      topWorkers,
      activityByDayOfWeek,
    };
  }, [filteredHistory, workers]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return <LogIn className="h-4 w-4 text-green-600" />;
      case 'CHECK_OUT': return <LogOut className="h-4 w-4 text-red-600" />;
      case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'SWAP': return <Repeat2 className="h-4 w-4 text-purple-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return 'تسكين';
      case 'CHECK_OUT': return 'إخراج';
      case 'TRANSFER': return 'نقل';
      case 'SWAP': return 'تبديل';
      default: return type;
    }
  };

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">التقارير الزمنية</h1>
        <p className="text-muted-foreground">
          تحليل شامل لحركة العمال والإشغال عبر الزمن
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            التصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="end-date">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="action-type">نوع العملية</Label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع العمليات</SelectItem>
                  <SelectItem value="CHECK_IN">تسكين</SelectItem>
                  <SelectItem value="CHECK_OUT">إخراج</SelectItem>
                  <SelectItem value="TRANSFER">نقل</SelectItem>
                  <SelectItem value="SWAP">تبديل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="residence">المسكن</Label>
              <Select value={residenceFilter} onValueChange={setResidenceFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع السكنات</SelectItem>
                  {filteredResidences.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي العمليات</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-green-600" />
              <CardDescription>تسكين</CardDescription>
            </div>
            <CardTitle className="text-3xl text-green-600">{stats.checkIns}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-red-600" />
              <CardDescription>إخراج</CardDescription>
            </div>
            <CardTitle className="text-3xl text-red-600">{stats.checkOuts}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              <CardDescription>نقل</CardDescription>
            </div>
            <CardTitle className="text-3xl text-blue-600">{stats.transfers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <CardDescription>متوسط مدة الإقامة</CardDescription>
            </div>
            <CardTitle className="text-3xl text-purple-600">{stats.avgStayDuration} يوم</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Activity by Day of Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            النشاط حسب أيام الأسبوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dayNames.map((day, index) => {
              const count = stats.activityByDayOfWeek[index] || 0;
              const maxCount = Math.max(...Object.values(stats.activityByDayOfWeek));
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">{day}</span>
                  <div className="flex-1 bg-secondary rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Active Workers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            العمال الأكثر حركة
          </CardTitle>
          <CardDescription>
            العمال الذين لديهم أكبر عدد من عمليات التسكين والنقل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topWorkers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topWorkers.map((item, index) => (
                <div key={item.workerId} className="flex items-center gap-4 p-3 rounded-md border">
                  <Badge variant={index === 0 ? 'default' : 'outline'} className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium">{item.workerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.activityCount} عملية
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity by Residence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            النشاط حسب المسكن
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.activityByResidence).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.activityByResidence)
                .sort(([, a], [, b]) => b - a)
                .map(([residenceId, count]) => {
                  const residence = residences.find(r => r.id === residenceId);
                  const maxCount = Math.max(...Object.values(stats.activityByResidence));
                  const percentage = (count / maxCount) * 100;

                  return (
                    <div key={residenceId} className="flex items-center gap-4">
                      <span className="w-40 text-sm font-medium truncate">
                        {residence?.name || residenceId}
                      </span>
                      <div className="flex-1 bg-secondary rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                سجل العمليات التفصيلي
              </CardTitle>
              <CardDescription>
                عرض {filteredHistory.length} عملية
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العملية</TableHead>
                  <TableHead>العامل</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>المدة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد عمليات في هذه الفترة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(item.actionDate).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(item.actionType)}
                          <span>{getActionLabel(item.actionType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.workerName || item.workerId}</TableCell>
                      <TableCell>
                        {item.actionType === 'CHECK_IN' && (
                          <span>{item.residenceName || item.residenceId}</span>
                        )}
                        {item.actionType === 'CHECK_OUT' && (
                          <span>{item.residenceName || item.residenceId}</span>
                        )}
                        {item.actionType === 'TRANSFER' && (
                          <span className="text-sm">
                            {item.fromResidenceName} → {item.toResidenceName}
                          </span>
                        )}
                        {item.actionType === 'SWAP' && (
                          <span className="text-sm">
                            مع {item.swappedWithWorkerName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.duration ? `${item.duration} يوم` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredHistory.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              عرض 50 من أصل {filteredHistory.length} عملية
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
