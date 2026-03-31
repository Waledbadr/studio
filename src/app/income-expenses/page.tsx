'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function IncomeExpensesDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income & Expenses</h1>
          <p className="text-muted-foreground mt-1">Financial tracking for all residences (Diesel, Payroll, Rent, Materials)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 opacity-75">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SAR 0.00</div>
            <p className="text-xs text-muted-foreground mt-1">From Accommodations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SAR 0.00</div>
            <p className="text-xs text-muted-foreground mt-1">From MRV & Upkeep</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SAR 0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Overall Balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-[400px] flex items-center justify-center flex-col text-center p-8 border-dashed border-2">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Income & Expenses Application (Coming Soon)</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          This module is currently under development. Soon, you will be able to log revenues (like residence invoices from Accommodation) and expenses (such as MRVs from Materials, diesel, payroll, and maintenance) to track financial health per residence.
        </p>
      </Card>
    </div>
  );
}
