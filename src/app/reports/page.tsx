
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { List, TrendingUp, Wrench, Grid3X3 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from '@/context/language-context';


export default function ReportsPage() {
  const { dict } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{dict.reportsTitle || 'Reports'}</h1>
        <p className="text-muted-foreground">{dict.reportsDescription || 'View and create reports for inventory, maintenance and more.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 hover:shadow-md transition-all">
          <Link href="/inventory" className="block h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <List className="h-6 w-6 text-primary" />
                <CardTitle>{dict.inventoryReportsTitle || 'Inventory Reports'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{dict.inventoryReportsDescription || 'Click to go to the inventory page. From there, click any item to view its detailed movement report.'}</CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 hover:shadow-md transition-all">
          <Link href="/inventory/reports/stock-movement" className="block h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <CardTitle>{dict.stockMovementReportTitle || 'Stock Movement Report'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{dict.stockMovementReportDescription || 'A detailed report of material movements by residence, date range, and movement type.'}</CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 hover:shadow-md transition-all">
          <Link href="/inventory/reports/stock-matrix" className="block h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Grid3X3 className="h-6 w-6 text-amber-600" />
                <CardTitle>{dict.stockMatrixReportTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {dict.stockMatrixReportDescription}
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        {/* Placeholder for future reports */}
        <Card className="border-dashed">
            <CardHeader>
                <div className="flex items-center gap-3">
                  <Wrench className="h-6 w-6 text-muted-foreground" />
          <CardTitle className="text-muted-foreground">{dict.maintenanceReportsTitle || 'Maintenance Reports'}</CardTitle>
                </div>
            </CardHeader>
             <CardContent>
        <CardDescription>{dict.maintenanceReportsDescription || 'Future reports for maintenance activities will be available here.'}</CardDescription>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
