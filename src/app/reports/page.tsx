
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { List, TrendingUp, Wrench, Grid3X3, Home, Users, AlertTriangle, Building2, UserX, BarChart3, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { useLanguage } from '@/context/language-context';

export default function ReportsPage() {
  const { dict } = useLanguage();
  
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.reportsTitle || 'Reports Center'}</h1>
        <p className="text-muted-foreground mt-2">{dict.reportsDescription || 'Access comprehensive reports for Inventory, Accommodation, and Maintenance.'}</p>
      </div>

      {/* Inventory Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <List className="h-5 w-5" />
          Inventory Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCard 
            href="/inventory/reports/stock-movement"
            icon={<TrendingUp className="h-6 w-6 text-green-600" />}
            title={dict.stockMovementReportTitle || 'Stock Movement'}
            description={dict.stockMovementReportDescription || 'Detailed material movements by residence and date.'}
          />
          <ReportCard 
            href="/inventory/reports/stock-matrix"
            icon={<Grid3X3 className="h-6 w-6 text-amber-600" />}
            title={dict.stockMatrixReportTitle || 'Stock Matrix'}
            description={dict.stockMatrixReportDescription || 'Current stock levels across all locations.'}
          />
          <ReportCard 
            href="/inventory/reports/consumption-by-residence"
            icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
            title="Consumption by Residence"
            description="Total items issued and consumed per residence."
          />
          <ReportCard 
            href="/inventory/reports/slow-moving"
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            title="Slow Moving Items"
            description="Items with no movement in the last 90 days."
          />
        </div>
      </section>

      {/* Accommodation Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Home className="h-5 w-5" />
          Accommodation Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCard 
            href="/accommodation/reports"
            icon={<Building2 className="h-6 w-6 text-indigo-600" />}
            title="Accommodation Reports Dashboard"
            description="Access all accommodation reports including Vacancy, Nationality, and Overcrowding."
          />
        </div>
      </section>

      {/* Maintenance Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Maintenance Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCard 
            href="/maintenance/reports/requests-by-status"
            icon={<Activity className="h-6 w-6 text-emerald-600" />}
            title="Requests by Status"
            description="Overview of maintenance requests and their progress."
          />
        </div>
      </section>
    </div>
  );
}

function ReportCard({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full">
      <Link href={href} className="block h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Link>
    </Card>
  );
}
