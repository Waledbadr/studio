'use client';

import { useState, useEffect } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface InventoryAudit {
  id: string;
  residenceId: string;
  residenceName: string;
  startDate: Date;
  endDate?: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_APPROVAL';
  createdBy: string;
  itemsAudited: number;
  totalItems: number;
  discrepancies: number;
  adjustmentsMade: number;
}

export default function InventoryAuditPage() {
  const { items, loading } = useInventory();
  const { residences } = useResidences();
  const { dict } = useLanguage();
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);

  // Mock data for audits - in real implementation, this would come from Firestore
  useEffect(() => {
    // Simulate loading audits
    const mockAudits: InventoryAudit[] = [
      {
        id: 'audit-001',
        residenceId: 'res-1',
        residenceName: 'Building A',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-20'),
        status: 'COMPLETED',
        createdBy: 'أحمد محمد',
        itemsAudited: 150,
        totalItems: 150,
        discrepancies: 5,
        adjustmentsMade: 5
      },
      {
        id: 'audit-002',
        residenceId: 'res-2',
        residenceName: 'Building B',
        startDate: new Date('2025-01-25'),
        status: 'IN_PROGRESS',
        createdBy: 'فاطمة أحمد',
        itemsAudited: 75,
        totalItems: 120,
        discrepancies: 2,
        adjustmentsMade: 0
      },
      {
        id: 'audit-003',
        residenceId: 'res-1',
        residenceName: 'Building A',
        startDate: new Date('2025-02-01'),
        status: 'PENDING_APPROVAL',
        createdBy: 'محمد علي',
        itemsAudited: 200,
        totalItems: 200,
        discrepancies: 8,
        adjustmentsMade: 0
      }
    ];

    setTimeout(() => {
      setAudits(mockAudits);
      setLoadingAudits(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgress = (itemsAudited: number, totalItems: number) => {
    return Math.round((itemsAudited / totalItems) * 100);
  };

  if (loading || loadingAudits) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-100 dark:border-green-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{dict.sidebar.stockReconciliation}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Compare actual physical inventory with system records and reconcile discrepancies
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Reconciliations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{audits.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Balanced</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audits.filter(a => a.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audits.filter(a => a.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Items Adjusted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audits.reduce((sum, audit) => sum + audit.adjustmentsMade, 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/inventory/inventory-audit/new">
          <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Start New Reconciliation
          </Button>
        </Link>
        <Button variant="outline" className="w-full sm:w-auto">
          <FileText className="w-4 h-4 mr-2" />
          Reconciliation Report
        </Button>
      </div>

      {/* Audits Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Stock Reconciliation History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {audits.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No Reconciliations Found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">No stock reconciliations have been performed yet</p>
              <Link href="/inventory/inventory-audit/new">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Start First Reconciliation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Reconciliation ID</TableHead>
                    <TableHead className="text-left">Building</TableHead>
                    <TableHead className="text-left">Start Date</TableHead>
                    <TableHead className="text-left">Completion Date</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                    <TableHead className="text-left">Items Reviewed</TableHead>
                    <TableHead className="text-left">Discrepancies</TableHead>
                    <TableHead className="text-left">Adjustments</TableHead>
                    <TableHead className="text-left">Created By</TableHead>
                    <TableHead className="text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-left">
                        {audit.id}
                      </TableCell>
                      <TableCell className="text-left">
                        {audit.residenceName}
                      </TableCell>
                      <TableCell className="text-left">
                        {format(audit.startDate, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-left">
                        {audit.endDate ? format(audit.endDate, 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-left">
                        {getStatusBadge(audit.status)}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {audit.itemsAudited} / {audit.totalItems} items
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        {audit.discrepancies > 0 ? (
                          <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                            {audit.discrepancies}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          {audit.adjustmentsMade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        {audit.createdBy}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex gap-2">
                          <Link href={`/inventory/inventory-audit/${audit.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {audit.status === 'IN_PROGRESS' && (
                            <Link href={`/inventory/inventory-audit/${audit.id}/continue`}>
                              <Button size="sm" variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                Continue
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
