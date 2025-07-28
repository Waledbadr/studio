
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { List } from "lucide-react";
import Link from "next/link";


export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View and generate reports for inventory, maintenance, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 hover:shadow-md transition-all">
          <Link href="/inventory" className="block h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <List className="h-6 w-6 text-primary" />
                <CardTitle>Inventory Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Click to go to the inventory page. From there, click on any item to view its detailed movement report (ledger).
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        {/* Placeholder for future reports */}
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="text-muted-foreground">Maintenance Reports</CardTitle>
            </CardHeader>
             <CardContent>
              <CardDescription>
                Future reports on maintenance activities will be available here.
              </CardDescription>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
