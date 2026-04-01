"use client";

import React, { useMemo, useState } from "react";
import { useAccommodation } from "@/context/accommodation-context";
import { useUsers } from "@/context/users-context";
import { useLanguage } from "@/context/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  Users,
  TrendingUp,
  ArrowRightLeft,
  Clock,
  DollarSign,
  CalendarRange,
} from "lucide-react";

const ACCOMMODATION_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
];

const chartConfig: ChartConfig = {
  occupancy: {
    label: "Occupancy %",
    color: "hsl(var(--chart-1))",
  },
  checkIns: {
    label: "Check-ins",
    color: "hsl(var(--chart-2))",
  },
  checkOuts: {
    label: "Check-outs",
    color: "hsl(var(--chart-3))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-4))",
  },
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function AccommodationAnalyticsPage() {
  const {
    residences,
    workers,
    occupants,
    accommodationHistory,
    contracts,
    invoices,
    transferRequests,
    dashboardStats,
  } = useAccommodation();
  const { currentUser } = useUsers();
  const { locale } = useLanguage();

  const [range, setRange] = useState<"30d" | "90d" | "180d">("30d");

  const rangeDays = range === "30d" ? 30 : range === "90d" ? 90 : 180;
  const rangeStart = daysAgo(rangeDays);
  const todayStr = formatDay(new Date());

  const {
    kpis,
    occupancyByResidence,
    occupancyChartData,
    movementSeries,
    nationalitySeries,
    revenueByResidence,
  } = useMemo(() => {
    const hasFullData = workers.length > 0 && occupants.length > 0;

    const filteredHistory = accommodationHistory.filter((h) => {
      const d = new Date(h.actionDate as any);
      return d >= rangeStart && d <= new Date();
    });

    // KPIs
    const totalWorkers = dashboardStats?.totalWorkers || workers.length;
    const assignedWorkers = dashboardStats?.assignedWorkers || occupants.length;
    const unassignedWorkers = Math.max(totalWorkers - assignedWorkers, 0);
    const occupancyRate =
      dashboardStats?.occupancyRate ??
      (totalWorkers > 0 ? Math.round((assignedWorkers / totalWorkers) * 100) : 0);

    const activeContracts = contracts.filter((c) => c.status === "Active").length;

    // Revenue in current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const revenueThisMonth = invoices
      .filter((inv) => inv.month === currentMonthKey && ["Paid", "Pending", "Overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const pendingTransfers = transferRequests.filter((t) => t.status === "Pending").length;

    // Avg stay duration from history (if duration field exists)
    const durations: number[] = [];
    filteredHistory.forEach((h: any) => {
      if (typeof h.duration === "number") durations.push(h.duration);
    });
    const avgStayDuration = durations.length
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : 0;

    // Occupancy / capacity by residence (current)
    const occupancyByResidence: Record<string, { occupied: number; capacity: number }> = {};

    residences.forEach((res: any) => {
      let capacity = 0;

      const processRooms = (rooms: any[]) => {
        if (!Array.isArray(rooms)) return;
        for (const room of rooms) {
          if (room.spaceSqm && room.roomType) {
            const space = Number(room.spaceSqm);
            const per = room.roomType === "Worker" ? 4 : room.roomType === "Supervisor" ? 8 : 16;
            capacity += Math.floor(space / per);
          } else if (room.capacity) {
            capacity += Number(room.capacity);
          }
        }
      };

      if (res.rooms) processRooms(res.rooms);
      if (res.buildings) {
        for (const building of res.buildings) {
          if (building.floors) {
            for (const floor of building.floors) {
              if (floor.rooms) processRooms(floor.rooms);
            }
          }
        }
      }

      let occupied = 0;
      if (hasFullData) {
        occupied = occupants.filter((o) => o.residenceId === res.id && (!o.until || o.until >= todayStr)).length;
      } else if (dashboardStats?.residenceOccupancy) {
        occupied = dashboardStats.residenceOccupancy[res.id] || 0;
      }

      occupancyByResidence[res.id] = { occupied, capacity };
    });

    const occupancyChartData = residences.map((res) => {
      const data = occupancyByResidence[res.id] || { occupied: 0, capacity: 0 };
      const rate = data.capacity > 0 ? Math.round((data.occupied / data.capacity) * 100) : 0;
      return {
        id: res.id,
        name: res.name,
        occupancyRate: rate,
        occupied: data.occupied,
        capacity: data.capacity,
      };
    });

    // Movements series (check-ins vs check-outs)
    const movementMap: Record<string, { date: string; checkIns: number; checkOuts: number }> = {};

    filteredHistory.forEach((h: any) => {
      const d = formatDay(new Date(h.actionDate as any));
      if (!movementMap[d]) movementMap[d] = { date: d, checkIns: 0, checkOuts: 0 };
      if (h.actionType === "CHECK_IN") movementMap[d].checkIns += 1;
      if (h.actionType === "CHECK_OUT" || h.actionType === "TRANSFER_OUT") movementMap[d].checkOuts += 1;
    });

    const movementSeries = Object.values(movementMap).sort((a, b) => (a.date < b.date ? -1 : 1));

    // Nationality distribution based on current occupants
    const nationalityMap: Record<string, number> = {};
    const workerById = new Map(workers.map((w) => [w.id, w] as const));

    occupants.forEach((o: any) => {
      if (o.since > todayStr || (o.until && o.until < todayStr)) return;
      const w: any = workerById.get(o.workerId);
      const nat = (w && (w.nationaliy || w.nationality)) || "Unknown";
      nationalityMap[nat] = (nationalityMap[nat] || 0) + 1;
    });

    const nationalitySeries = Object.entries(nationalityMap).map(([name, value]) => ({ name, value }));

    // Revenue by residence (last rangeDays)
    const revenueMap: Record<string, { name: string; revenue: number }> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.startDate as any);
      if (d < rangeStart) return;
      const key = inv.residenceId;
      const res = residences.find((r) => r.id === key);
      if (!revenueMap[key]) revenueMap[key] = { name: res?.name || key, revenue: 0 };
      revenueMap[key].revenue += inv.totalAmount;
    });

    const revenueByResidence = Object.values(revenueMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    return {
      kpis: {
        totalWorkers,
        assignedWorkers,
        unassignedWorkers,
        occupancyRate,
        activeContracts,
        revenueThisMonth,
        pendingTransfers,
        avgStayDuration,
      },
      occupancyByResidence,
      occupancyChartData,
      movementSeries,
      nationalitySeries,
      revenueByResidence,
    };
  }, [
    workers,
    occupants,
    accommodationHistory,
    contracts,
    invoices,
    transferRequests,
    dashboardStats,
    residences,
    rangeStart,
    todayStr,
  ]);

  const isAdminView = currentUser?.role === "Admin";

  return (
    <div className="p-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-sky-600/90 via-indigo-700 to-emerald-600 text-white px-6 py-8">
        <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {locale === "ar" ? "لوحة تحليلات التسكين" : "Accommodation Analytics"}
            </h1>
            <p className="text-sm md:text-base text-sky-50/90">
              {locale === "ar"
                ? "رؤية بصرية شاملة لحركة التسكين، الإشغال، العقود، والإيرادات عبر جميع المساكن."
                : "Comprehensive visual insight into movements, occupancy, contracts, and revenue across residences."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0 items-center">
            <Badge variant="outline" className="bg-white/10 border-white/40 text-xs md:text-sm">
              {locale === "ar"
                ? isAdminView
                  ? "وضع المدير"
                  : "وضع المشرف"
                : isAdminView
                  ? "Admin mode"
                  : "Supervisor mode"}
            </Badge>
            <div className="flex items-center gap-2 bg-black/10 rounded-full px-3 py-1 text-xs md:text-sm">
              <CalendarRange className="h-4 w-4" />
              <span>{locale === "ar" ? "المدى الزمني" : "Date range"}</span>
              <div className="flex gap-1 ms-2">
                {([
                  ["30d", locale === "ar" ? "آخر 30 يوم" : "Last 30 days"],
                  ["90d", locale === "ar" ? "آخر 90 يوم" : "Last 90 days"],
                  ["180d", locale === "ar" ? "آخر 6 أشهر" : "Last 6 months"],
                ] as const).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={range === key ? "secondary" : "ghost"}
                    className="h-7 px-3 text-[11px] md:text-xs rounded-full"
                    onClick={() => setRange(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "إجمالي العمال" : "Total workers"}
            </CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalWorkers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar"
                ? `${kpis.assignedWorkers} مسكن / ${kpis.unassignedWorkers} غير مسكن`
                : `${kpis.assignedWorkers} housed / ${kpis.unassignedWorkers} unassigned`}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "نسبة الإشغال الكلية" : "Overall occupancy"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar"
                ? "نسبة استخدام الطاقة الاستيعابية الإجمالية"
                : "Share of total capacity currently used"}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "العقود النشطة" : "Active contracts"}
            </CardTitle>
            <Building2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeContracts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar"
                ? "شركات مرتبطة حاليًا بالمساكن"
                : "Companies currently linked to residences"}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "إيرادات هذا الشهر" : "Revenue this month"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.revenueThisMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "بناءً على الفواتير الصادرة" : "Based on issued invoices"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "طلبات النقل المعلقة" : "Pending transfers"}
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingTransfers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "في انتظار الموافقة أو التنفيذ" : "Awaiting approval or execution"}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "متوسط مدة الإقامة" : "Average stay duration"}
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgStayDuration} يوم</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "احتساب تقريبي من سجل الحركات" : "Approximate value from movement history"}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80 hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "مؤشرات عامة" : "General indicators"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>
              {locale === "ar"
                ? "هذه اللوحة مخصّصة للقراءة التحليلية وليست بديلاً عن تقارير التدقيق التفصيلية."
                : "This board is for analytical reading and does not replace detailed audit reports."}
            </p>
            <p>
              {locale === "ar"
                ? "استخدم تقارير التايم لاين والتقارير اليومية للطباعة والتوقيع."
                : "Use timeline and daily reports for printing and signatures."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Layout: left column charts, right column charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: occupancy & movements */}
        <div className="space-y-6 lg:col-span-2">
          {/* Occupancy by residence */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-sky-600" />
                {locale === "ar" ? "الإشغال حسب المسكن" : "Occupancy by residence"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "مقارنة مرئية لنسبة الإشغال الحالية بين المساكن (أعلى 12 مسكن)."
                  : "Visual comparison of current occupancy across the top 12 residences."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {occupancyChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد مساكن مسجلة بعد." : "No residences registered yet."}
                </p>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="w-full h-[320px]"
                >
                  <BarChart
                    data={occupancyChartData
                      .slice()
                      .sort((a, b) => b.occupancyRate - a.occupancyRate)
                      .slice(0, 12)}
                    margin={{ left: 8, right: 8, top: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      height={40}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      unit="%"
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="occupancyRate"
                      name={locale === "ar" ? "الإشغال (%)" : "Occupancy (%)"}
                      fill="var(--color-occupancy)"
                      radius={[6, 6, 2, 2]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Check-ins vs check-outs */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {locale === "ar" ? "حركة التسكين والإخراج" : "Check-ins vs check-outs"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "منحنى زمني لعمليات التسكين والإخراج خلال الفترة المحددة."
                  : "Time series of check-ins and check-outs in the selected range."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movementSeries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد عمليات في هذا النطاق الزمني." : "No movements in this date range."}
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="w-full h-[320px]">
                  <AreaChart data={movementSeries} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent />}
                    />
                    <Area
                      type="monotone"
                      dataKey="checkIns"
                      name={locale === "ar" ? "تسكين" : "Check-ins"}
                      stroke="var(--color-checkIns)"
                      fill="var(--color-checkIns)"
                      fillOpacity={0.18}
                    />
                    <Area
                      type="monotone"
                      dataKey="checkOuts"
                      name={locale === "ar" ? "إخراج/نقل خارج" : "Check-outs / transfers out"}
                      stroke="var(--color-checkOuts)"
                      fill="var(--color-checkOuts)"
                      fillOpacity={0.16}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: nationality + revenue ranking */}
        <div className="space-y-6">
          {/* Nationality distribution */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">
                {locale === "ar" ? "توزيع الجنسيات الحالية" : "Current nationality distribution"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "حسب العمال المقيمين حاليًا في النظام."
                  : "Based on workers currently accommodated in the system."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nationalitySeries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "لا توجد بيانات إشغال كافية لحساب التوزيع."
                    : "Not enough occupancy data to calculate distribution."}
                </p>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="md:w-1/2 w-full h-[220px]">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <PieChart>
                        <Pie
                          data={nationalitySeries}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {nationalitySeries.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={ACCOMMODATION_COLORS[index % ACCOMMODATION_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    {nationalitySeries
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((n) => (
                        <div key={n.name} className="flex items-center justify-between gap-2">
                          <span className="truncate max-w-[65%]">{n.name}</span>
                          <span className="text-muted-foreground">
                            {locale === "ar"
                              ? `${n.value.toLocaleString()} عامل`
                              : `${n.value.toLocaleString()} workers`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by residence */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-amber-600" />
                {locale === "ar" ? "أعلى المساكن من حيث الإيراد" : "Top residences by revenue"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "إجمالي الفواتير خلال الفترة المختارة (أعلى 8)."
                  : "Total invoice value in the selected period (top 8)."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByResidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "لا توجد فواتير ضمن هذا النطاق الزمني."
                    : "No invoices found in this date range."}
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="w-full h-[260px]">
                  <BarChart
                    data={revenueByResidence}
                    layout="vertical"
                    margin={{ left: 8, right: 8, top: 8 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="revenue"
                      name={locale === "ar" ? "الإيراد الكلي" : "Total revenue"}
                      fill="var(--color-revenue)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
