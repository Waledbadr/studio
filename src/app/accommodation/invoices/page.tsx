"use client";

import React, { useState, useMemo } from 'react';
import { useAccommodation, type Invoice } from '@/context/accommodation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Download, DollarSign, AlertCircle, CheckCircle2, Clock, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiscalMonthPeriod, formatFiscalDate, FISCAL_START_DAY } from '@/lib/fiscal-month-utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function InvoicesPage() {
  const { invoices, contracts, companies, residences, generateMonthlyInvoices, saveInvoice } = useAccommodation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [fiscalStartDay, setFiscalStartDay] = useState(FISCAL_START_DAY);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Get current month in YYYY-MM format for default
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
        
        if (searchTerm) {
          const company = companies.find(c => c.id === invoice.companyId);
          const residence = residences.find(r => r.id === invoice.residenceId);
          const searchLower = searchTerm.toLowerCase();
          
          if (
            !invoice.id.toLowerCase().includes(searchLower) &&
            !company?.name.toLowerCase().includes(searchLower) &&
            !residence?.name.toLowerCase().includes(searchLower) &&
            !invoice.month.includes(searchLower)
          ) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }, [invoices, statusFilter, searchTerm, companies, residences]);

  const handleGenerateInvoices = async () => {
    if (!selectedMonth) {
      toast({ title: 'Error', description: 'Please select a month', variant: 'destructive' });
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast({ title: 'Error', description: 'Please select a date range', variant: 'destructive' });
      return;
    }
    
    try {
      const result = await generateMonthlyInvoices(selectedMonth, undefined, {
        startDate: dateRange.from,
        endDate: dateRange.to
      });
      setGenerateDialogOpen(false);
      toast({
        title: 'Success',
        description: `Generated ${result.generated} invoices${result.errors > 0 ? ` with ${result.errors} errors` : ''}`,
      });
    } catch (error) {
      console.error('Failed to generate invoices:', error);
    }
  };

  const handleMonthSelect = (monthStr: string) => {
    setSelectedMonth(monthStr);
    const period = getFiscalMonthPeriod(monthStr, fiscalStartDay);
    setDateRange({ from: period.startDate, to: period.endDate });
  };

  const months = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthStr = `${currentYear}-${String(monthNum).padStart(2, '0')}`;
      return {
        value: monthStr,
        label: new Date(currentYear, i).toLocaleString('default', { month: 'long' })
      };
    });
  }, []);

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await saveInvoice({
        ...invoice,
        status: 'Paid',
        paidAt: new Date().toISOString(),
      });
      toast({ title: 'Success', description: 'Invoice marked as paid' });
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const config: Record<Invoice['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      Draft: { variant: 'outline', icon: FileText },
      Pending: { variant: 'default', icon: Clock },
      Paid: { variant: 'secondary', icon: CheckCircle2 },
      Overdue: { variant: 'destructive', icon: AlertCircle },
      Cancelled: { variant: 'outline', icon: AlertCircle },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pending = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdue = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    return { total, paid, pending, overdue };
  }, [invoices]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-2">Manage accommodation invoices and billing</p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Invoices
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Monthly Invoices</DialogTitle>
              <DialogDescription>
                Generate invoices for all active contracts for the selected month
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quick Select Month</Label>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((m) => (
                    <Button
                      key={m.value}
                      variant={selectedMonth === m.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMonthSelect(m.value)}
                      className="w-full"
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fiscal Period Range</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Start date is inclusive, End date is exclusive for calculation purposes.
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>This will create invoices for:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All active contracts during the selected month</li>
                  <li>Based on actual worker occupancy</li>
                  <li>Calculated using contract rates</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateInvoices}>
                Generate Invoices
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">{invoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'Paid').length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'Pending').length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'Overdue').length} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
          <CardDescription>Billing history and pending invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <Button onClick={() => setGenerateDialogOpen(true)} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Generate invoices
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Residence</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Workers</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const company = companies.find(c => c.id === invoice.companyId);
                    const residence = residences.find(r => r.id === invoice.residenceId);
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-mono text-sm">{invoice.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{company?.name || invoice.companyId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{residence?.name || invoice.residenceId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3" />
                            {invoice.month}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFiscalDate(invoice.startDate)} - {formatFiscalDate(invoice.endDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{invoice.numberOfWorkers}</div>
                          <div className="text-xs text-muted-foreground">
                            @ {invoice.ratePerPerson} SAR/mo
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold">{invoice.totalAmount.toFixed(2)} SAR</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(invoice)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {invoice.status === 'Pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsPaid(invoice)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!invoice.pdfUrl}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>
                  {selectedInvoice.id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Company</Label>
                    <div className="font-medium">
                      {companies.find(c => c.id === selectedInvoice.companyId)?.name || selectedInvoice.companyId}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Residence</Label>
                    <div className="font-medium">
                      {residences.find(r => r.id === selectedInvoice.residenceId)?.name || selectedInvoice.residenceId}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Billing Period</Label>
                    <div className="font-medium">{selectedInvoice.month}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedInvoice.startDate).toLocaleDateString()} - {new Date(selectedInvoice.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Number of Days</Label>
                    <div className="font-medium">{selectedInvoice.numberOfDays} days</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Number of Workers</Label>
                    <div className="font-medium">{selectedInvoice.numberOfWorkers}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Rate per Person/Month</Label>
                    <div className="font-medium">{selectedInvoice.ratePerPerson.toFixed(2)} SAR</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Total Amount</Label>
                    <div className="text-2xl font-bold">{selectedInvoice.totalAmount.toFixed(2)} SAR</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Total calculated based on individual worker occupancy days (Rate ÷ 30 × Days).
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Generated At</Label>
                    <div className="font-medium">
                      {new Date(selectedInvoice.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {selectedInvoice.paidAt && (
                  <div>
                    <Label className="text-muted-foreground">Paid At</Label>
                    <div className="font-medium text-green-600">
                      {new Date(selectedInvoice.paidAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedInvoice.notes && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Worker Breakdown</Label>
                    {(() => {
                      try {
                        const breakdown = JSON.parse(selectedInvoice.notes);
                        if (Array.isArray(breakdown)) {
                          return (
                            <div className="rounded-md border max-h-[200px] overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="h-8">Worker</TableHead>
                                    <TableHead className="h-8 text-right">Days</TableHead>
                                    <TableHead className="h-8 text-right">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {breakdown.map((w: any) => (
                                    <TableRow key={w.workerId}>
                                      <TableCell className="py-2">{w.name}</TableCell>
                                      <TableCell className="py-2 text-right">{w.days}</TableCell>
                                      <TableCell className="py-2 text-right">{Number(w.amount).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        }
                        return <div className="text-sm">{selectedInvoice.notes}</div>;
                      } catch (e) {
                        return <div className="text-sm">{selectedInvoice.notes}</div>;
                      }
                    })()}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                {selectedInvoice.status === 'Pending' && (
                  <Button onClick={() => {
                    handleMarkAsPaid(selectedInvoice);
                    setDetailsDialogOpen(false);
                  }}>
                    Mark as Paid
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
