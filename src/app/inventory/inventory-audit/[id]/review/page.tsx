'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, AlertTriangle, FileText, Download, Send, Package, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ReconciliationSummary {
  id: string;
  name: string;
  residenceId: string;
  residenceName: string;
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'APPROVED';
  startDate: Date;
  completedDate: Date;
  conductedBy: string;
  totalItems: number;
  balancedItems: number;
  varianceItems: number;
  adjustedItems: number;
  totalCostVariance: number;
  totalPositiveVariance: number;
  totalNegativeVariance: number;
  items: ReconciliationItem[];
  approvalNotes: string;
}

interface ReconciliationItem {
  id: string;
  itemId: string;
  itemName: string;
  itemNameAr: string;
  category: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  variance: number;
  variancePercentage: number;
  costPerUnit: number;
  totalCostVariance: number;
  adjustmentReason: string;
  notes: string;
  locationName: string;
  isAdjusted: boolean;
}

export default function ReconciliationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { items } = useInventory();
  const { residences } = useResidences();

  const reconciliationId = params.id as string;
  
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock reconciliation summary data
  useEffect(() => {
    const mockSummary: ReconciliationSummary = {
      id: reconciliationId,
      name: 'February 2025 Stock Reconciliation',
      residenceId: 'res-1',
      residenceName: 'Building A',
      status: 'COMPLETED',
      startDate: new Date(2025, 1, 15),
      completedDate: new Date(),
      conductedBy: 'Ahmed Mohamed',
      totalItems: 25,
      balancedItems: 17,
      varianceItems: 8,
      adjustedItems: 8,
      totalCostVariance: -2450.75,
      totalPositiveVariance: 1200.00,
      totalNegativeVariance: -3650.75,
      approvalNotes: '',
      items: [
        {
          id: '1',
          itemId: 'item-1',
          itemName: 'Office Chair',
          itemNameAr: 'كرسي مكتب',
          category: 'Furniture',
          unit: 'piece',
          systemStock: 10,
          physicalStock: 8,
          variance: -2,
          variancePercentage: -20,
          costPerUnit: 450.50,
          totalCostVariance: -901.00,
          adjustmentReason: 'Damaged items',
          notes: '2 chairs found damaged and unusable',
          locationName: 'Room 101',
          isAdjusted: true
        },
        {
          id: '2',
          itemId: 'item-2',
          itemName: 'Desk',
          itemNameAr: 'مكتب',
          category: 'Furniture',
          unit: 'piece',
          systemStock: 5,
          physicalStock: 5,
          variance: 0,
          variancePercentage: 0,
          costPerUnit: 1200.00,
          totalCostVariance: 0,
          adjustmentReason: '',
          notes: '',
          locationName: 'Room 101',
          isAdjusted: false
        },
        {
          id: '3',
          itemId: 'item-3',
          itemName: 'Computer',
          itemNameAr: 'حاسوب',
          category: 'Electronics',
          unit: 'piece',
          systemStock: 8,
          physicalStock: 10,
          variance: 2,
          variancePercentage: 25,
          costPerUnit: 3500.00,
          totalCostVariance: 7000.00,
          adjustmentReason: 'Recently received items not yet recorded',
          notes: 'Found 2 new computers delivered but not processed',
          locationName: 'Room 102',
          isAdjusted: true
        }
      ]
    };

    setSummary(mockSummary);
  }, [reconciliationId]);

  const handleSubmitForApproval = async () => {
    if (!summary) return;

    setIsSubmitting(true);
    
    try {
      // Here you would submit the reconciliation for approval
      console.log('Submitting reconciliation for approval:', {
        reconciliationId: summary.id,
        approvalNotes
      });

      // Navigate back to reconciliations list
      router.push('/inventory/inventory-audit');
    } catch (error) {
      console.error('Error submitting reconciliation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateReport = () => {
    // Here you would generate and download the report
    console.log('Generating reconciliation report for:', summary?.id);
  };

  const getVarianceBadge = (variance: number, percentage: number) => {
    if (variance === 0) {
      return <Badge className="bg-green-100 text-green-800">Balanced</Badge>;
    } else if (variance > 0) {
      return <Badge className="bg-blue-100 text-blue-800">+{variance} (+{percentage}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{variance} ({percentage}%)</Badge>;
    }
  };

  const getAdjustmentBadge = (isAdjusted: boolean) => {
    return isAdjusted 
      ? <Badge className="bg-purple-100 text-purple-800">Adjusted</Badge>
      : <Badge variant="outline">No Action</Badge>;
  };

  if (!summary) {
    return <div className="p-6">Loading...</div>;
  }

  const varianceItems = summary.items.filter(item => item.variance !== 0);
  const positiveVariances = varianceItems.filter(item => item.variance > 0);
  const negativeVariances = varianceItems.filter(item => item.variance < 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory/inventory-audit">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reconciliations
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reconciliation Review</h1>
          <p className="text-gray-600 dark:text-gray-300">{summary.name} • {summary.residenceName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button 
            onClick={handleSubmitForApproval}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Balanced Items</p>
                <p className="text-2xl font-bold text-green-600">{summary.balancedItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Variances Found</p>
                <p className="text-2xl font-bold text-red-600">{summary.varianceItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Cost Impact</p>
                <p className={`text-2xl font-bold ${summary.totalCostVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(summary.totalCostVariance).toFixed(2)}
                </p>
              </div>
              {summary.totalCostVariance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Variance Summary */}
          {varianceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Variance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-300">Negative Variances</span>
                    </div>
                    <p className="text-lg font-bold text-red-600">{negativeVariances.length} items</p>
                    <p className="text-sm text-red-600">Cost Impact: ${Math.abs(summary.totalNegativeVariance).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">Positive Variances</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{positiveVariances.length} items</p>
                    <p className="text-sm text-blue-600">Cost Impact: ${summary.totalPositiveVariance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Physical</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.category} • {item.locationName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.systemStock} {item.unit}</TableCell>
                      <TableCell>{item.physicalStock} {item.unit}</TableCell>
                      <TableCell>
                        {getVarianceBadge(item.variance, item.variancePercentage)}
                      </TableCell>
                      <TableCell>
                        <span className={item.totalCostVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(item.totalCostVariance).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getAdjustmentBadge(item.isAdjusted)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Reconciliation Info */}
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Conducted By</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">{summary.conductedBy}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Start Date</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {summary.startDate.toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Completion Date</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {summary.completedDate.toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {Math.ceil((summary.completedDate.getTime() - summary.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Current Status</Label>
                <div className="mt-1">
                  <Badge className="bg-green-100 text-green-800">
                    {summary.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variance Details */}
          {varianceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variance Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {varianceItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{item.itemName}</p>
                      {getVarianceBadge(item.variance, item.variancePercentage)}
                    </div>
                    
                    {item.adjustmentReason && (
                      <div className="mb-2">
                        <Label className="text-xs">Reason:</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{item.adjustmentReason}</p>
                      </div>
                    )}
                    
                    {item.notes && (
                      <div>
                        <Label className="text-xs">Notes:</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{item.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Approval Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="approvalNotes">Additional Comments</Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any additional comments for the approval process..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Review all variance items and their adjustments before submitting for approval.
            This reconciliation will affect inventory levels once approved.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
