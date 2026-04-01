"use client";

import React, { useMemo, useState } from "react";
import { useOrders } from "@/context/orders-context";
import { useResidences } from "@/context/residences-context";
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
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Timestamp } from "firebase/firestore";
import {
  PackageOpen,
  ClipboardList,
  CheckCircle2,
  Clock,
  Building2,
  Layers3,
} from "lucide-react";

const ORDER_COLORS = [
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
  totalOrders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
  approved: {
    label: "Approved",
    color: "hsl(var(--chart-3))",
  },
  delivered: {
    label: "Delivered",
    color: "hsl(var(--chart-4))",
  },
  items: {
    label: "Items",
    color: "hsl(var(--chart-5))",
  },
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function normalizeDate(value: any): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date(value as any);
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function OrdersAnalyticsPage() {
  const { orders } = useOrders();
  const { residences } = useResidences();
  const { locale } = useLanguage();

  const [range, setRange] = useState<"30d" | "90d" | "180d">("90d");

  const rangeDays = range === "30d" ? 30 : range === "90d" ? 90 : 180;
  const rangeStart = daysAgo(rangeDays);

  const { kpis, dailyStatusSeries, byResidence, byCategory, mostRequestedItems } = useMemo(() => {
    const filteredOrders = orders.filter((o) => {
      const d = normalizeDate(o.date);
      return d >= rangeStart && d <= new Date();
    });

    // KPIs
    const totalOrders = filteredOrders.length;
    const pending = filteredOrders.filter((o) => o.status === "Pending").length;
    const approved = filteredOrders.filter((o) => o.status === "Approved").length;
    const partiallyDelivered = filteredOrders.filter((o) => o.status === "Partially Delivered").length;
    const delivered = filteredOrders.filter((o) => o.status === "Delivered").length;

    // Daily status series
    const dayMap: Record<
      string,
      { date: string; pending: number; approved: number; delivered: number; total: number }
    > = {};

    filteredOrders.forEach((o) => {
      const d = formatDay(normalizeDate(o.date));
      if (!dayMap[d]) dayMap[d] = { date: d, pending: 0, approved: 0, delivered: 0, total: 0 };
      dayMap[d].total += 1;
      if (o.status === "Pending") dayMap[d].pending += 1;
      if (o.status === "Approved") dayMap[d].approved += 1;
      if (o.status === "Partially Delivered" || o.status === "Delivered") dayMap[d].delivered += 1;
    });

    const dailyStatusSeries = Object.values(dayMap).sort((a, b) => (a.date < b.date ? -1 : 1));

    // By residence
    const resMap: Record<string, { name: string; pending: number; total: number }> = {};
    filteredOrders.forEach((o) => {
      const resId = o.residenceId;
      const res = residences.find((r) => r.id === resId);
      if (!resMap[resId]) resMap[resId] = { name: res?.name || o.residence || resId, pending: 0, total: 0 };
      resMap[resId].total += 1;
      if (o.status === "Pending") resMap[resId].pending += 1;
    });

    const byResidence = Object.values(resMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // By item category
    const catMap: Record<string, number> = {};
    // By individual item (for most requested materials)
    const itemMap: Record<string, { id: string; name: string; category?: string; quantity: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = (item.category as any) || "Other";
        const qty = item.approvedQuantity ?? item.quantity ?? 0;
        catMap[cat] = (catMap[cat] || 0) + qty;

        const id = (item as any).id || `${(item as any).nameEn || (item as any).nameAr || "unknown"}`;
        const name =
          (item as any).nameEn ||
          (item as any).nameAr ||
          (item as any).name ||
          "Unknown item";
        if (!itemMap[id]) {
          itemMap[id] = {
            id,
            name,
            category: cat,
            quantity: 0,
          };
        }
        itemMap[id].quantity += qty;
      });
    });

    const byCategory = Object.entries(catMap).map(([name, value]) => ({ name, value }));
    const mostRequestedItems = Object.values(itemMap)
      .filter((i) => i.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      kpis: {
        totalOrders,
        pending,
        approved,
        partiallyDelivered,
        delivered,
      },
      dailyStatusSeries,
      byResidence,
      byCategory,
      mostRequestedItems,
    };
  }, [orders, residences, rangeStart]);

  return (
    <div className="p-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-amber-600/90 via-rose-700 to-sky-700 text-white px-6 py-8">
        <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {locale === "ar" ? "لوحة تحليلات طلبات المواد" : "Material Requests Analytics"}
            </h1>
            <p className="text-sm md:text-base text-amber-50/90">
              {locale === "ar"
                ? "تتبع حجم الطلبات، سرعة الاعتماد، ونشاط المساكن في طلب المواد."
                : "Track request volume, approval speed, and residence activity for material requests."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0 items-center">
            <Badge variant="outline" className="bg-white/10 border-white/40 text-xs md:text-sm">
              {locale === "ar" ? "تحليلات متقدمة - المخزون والطلبات" : "Advanced analytics – inventory & requests"}
            </Badge>
            <div className="flex items-center gap-2 bg-black/10 rounded-full px-3 py-1 text-xs md:text-sm">
              <Clock className="h-4 w-4" />
              <span>{locale === "ar" ? "المدى الزمني" : "Date range"}</span>
              <div className="flex gap-1 ms-2">
                {([
                  ["30d", locale === "ar" ? "30 يوم" : "30 days"],
                  ["90d", locale === "ar" ? "90 يوم" : "90 days"],
                  ["180d", locale === "ar" ? "6 أشهر" : "6 months"],
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
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "إجمالي الطلبات في المدى" : "Total orders in range"}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "كل الحالات" : "All statuses"}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "طلبات معلقة" : "Pending requests"}
            </CardTitle>
            <PackageOpen className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar" ? "في انتظار الاعتماد أو التنفيذ" : "Awaiting approval or fulfillment"}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "طلبات معتمدة" : "Approved requests"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">بانتظار التوريد أو جارية التوريد</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium">
              {locale === "ar" ? "تم توريدها بالكامل/جزئيًا" : "Delivered (full/partial)"}
            </CardTitle>
            <Layers3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.delivered + kpis.partiallyDelivered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "ar"
                ? `${kpis.delivered} مكتملة و ${kpis.partiallyDelivered} جزئية`
                : `${kpis.delivered} fully delivered and ${kpis.partiallyDelivered} partial`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: time series */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {locale === "ar" ? "منحنى الطلبات حسب اليوم والحالة" : "Daily orders by status"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "يوضح عدد الطلبات المضافة يوميًا بحسب حالة الطلب."
                  : "Shows how many requests are created per day by status."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyStatusSeries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد طلبات في هذا النطاق الزمني." : "No orders in this date range."}
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="w-full h-[320px]">
                  <LineChart data={dailyStatusSeries} margin={{ left: 8, right: 8, top: 8 }}>
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
                    <Line
                      type="monotone"
                      dataKey="pending"
                      name={locale === "ar" ? "معلقة" : "Pending"}
                      stroke="var(--color-pending)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="approved"
                      name={locale === "ar" ? "معتمدة" : "Approved"}
                      stroke="var(--color-approved)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="delivered"
                      name={locale === "ar" ? "موردة" : "Delivered"}
                      stroke="var(--color-delivered)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {locale === "ar" ? "أنشط المساكن في طلب المواد" : "Most active residences"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "أعلى 10 مساكن من حيث عدد الطلبات في الفترة المختارة."
                  : "Top 10 residences by number of requests in range."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {byResidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد بيانات طلبات للمساكن في هذا النطاق." : "No residence order data in this range."}
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="w-full h-[280px]">
                  <BarChart
                    data={byResidence}
                    layout="vertical"
                    margin={{ left: 8, right: 8, top: 8 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="total"
                      name={locale === "ar" ? "إجمالي الطلبات" : "Total requests"}
                      fill="var(--color-totalOrders)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: categories pie, top items, and summary */}
        <div className="space-y-6">
          {/* Categories pie */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {locale === "ar" ? "توزيع الكميات حسب الفئة" : "Quantities by category"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "اعتمادًا على إجمالي الكمية المطلوبة/المعتمدة لكل فئة."
                  : "Based on total requested/approved quantity per category."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد عناصر كافية لحساب التوزيع." : "Not enough items to calculate distribution."}
                </p>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="md:w-1/2 w-full h-[220px]">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <PieChart>
                        <Pie
                          data={byCategory}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {byCategory.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={ORDER_COLORS[index % ORDER_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    {byCategory
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((c) => (
                        <div key={c.name} className="flex items-center justify-between gap-2">
                          <span className="truncate max-w-[65%]">{c.name}</span>
                          <span className="text-muted-foreground">
                            {locale === "ar"
                              ? `${c.value.toLocaleString()} وحدة`
                              : `${c.value.toLocaleString()} units`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most requested materials */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {locale === "ar" ? "أكثر المواد طلبًا" : "Most requested materials"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "أعلى الأصناف حسب إجمالي الكمية المطلوبة/المعتمدة."
                  : "Top items by total requested/approved quantity."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mostRequestedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد طلبات مواد كافية." : "Not enough material requests yet."}
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="w-full h-[260px]">
                  <BarChart
                    data={mostRequestedItems}
                    layout="vertical"
                    margin={{ left: 8, right: 8, top: 8 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="quantity"
                      name={locale === "ar" ? "إجمالي الكمية" : "Total quantity"}
                      fill="var(--color-items)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Summary text */}
          <Card className="backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {locale === "ar" ? "ملخص تشغيلي سريع" : "Operational summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                {locale === "ar"
                  ? "راقب عدد الطلبات المعلقة في كل مسكن وحدد المساكن التي تحتاج إلى متابعة خاصة أو تعزيز في المخزون."
                  : "Monitor pending requests per residence to identify locations needing follow-up or stock reinforcement."}
              </p>
              <p>
                {locale === "ar"
                  ? "استخدم هذه اللوحة مع تقارير الاستهلاك والمخزون لمعرفة مدى توافق الطلبات مع الاستخدام الفعلي."
                  : "Use this board with consumption and stock reports to compare requests with actual usage."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
