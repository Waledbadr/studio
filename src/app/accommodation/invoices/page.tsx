"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccommodation, type Invoice } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, Download, DollarSign, AlertCircle, CheckCircle2, Clock, Calendar as CalendarIcon, Plus, Printer, RefreshCw, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiscalMonthPeriod, formatFiscalDate, FISCAL_START_DAY } from '@/lib/fiscal-month-utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, contracts, companies, residences, generateMonthlyInvoices, saveInvoice, deleteInvoice } = useAccommodation();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  
  // Helper to format UTC dates correctly
  const formatUTCDate = (date: Date) => {
    const month = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${String(day).padStart(2, '0')}, ${year}`;
  };
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fiscalStartDay, setFiscalStartDay] = useState(FISCAL_START_DAY);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [newStatus, setNewStatus] = useState<Invoice['status']>('Pending');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedResidenceId, setSelectedResidenceId] = useState<string>('all');

  // Filter residences based on user's assigned residences
  const userResidences = useMemo(() => {
    if (!currentUser) return [];
    // Admin can see all residences
    if (currentUser.role === 'Admin') return residences;
    // Other users can only see their assigned residences
    if (!currentUser.assignedResidences || currentUser.assignedResidences.length === 0) return [];
    return residences.filter(r => 
      currentUser.assignedResidences.includes(r.id) ||
      r.managerId === currentUser.id
    );
  }, [residences, currentUser]);

  // Filter invoices to only show user's residences
  const userInvoices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return invoices;
    const userResidenceIds = userResidences.map(r => r.id);
    return invoices.filter(inv => userResidenceIds.includes(inv.residenceId));
  }, [invoices, currentUser, userResidences]);

  // Get current month in YYYY-MM format for default
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const filteredInvoices = useMemo(() => {
    return userInvoices
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

  // Group invoices by month
  const groupedInvoices = useMemo(() => {
    const groups: Record<string, Invoice[]> = {};
    filteredInvoices.forEach(invoice => {
      if (!groups[invoice.month]) {
        groups[invoice.month] = [];
      }
      groups[invoice.month].push(invoice);
    });
    
    // Sort months in descending order (newest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredInvoices]);
  
  // Track which months are open (latest/newest month open by default)
  const [openMonths, setOpenMonths] = useState<Set<string>>(() => {
    const latestMonth = groupedInvoices.length > 0 ? groupedInvoices[0][0] : currentMonth;
    return new Set([latestMonth]);
  });
  
  const toggleMonth = (month: string) => {
    setOpenMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

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
      }, {
        companyId: selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
        residenceId: selectedResidenceId !== 'all' ? selectedResidenceId : undefined
      });
      setGenerateDialogOpen(false);
      
      if (result.generated === 0 && result.errors === 0) {
        toast({
          title: 'No Invoices Generated',
          description: 'لا توجد عقود نشطة للفترة المحددة أو لا يوجد عمال مسكنين. تأكد من وجود عقود وعمال مسجلين.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Success',
          description: `Generated ${result.generated} invoices${result.errors > 0 ? ` with ${result.errors} errors` : ''}`,
        });
      }
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
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthStr = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
      return {
        value: monthStr,
        label: new Date(selectedYear, i).toLocaleString('default', { month: 'long' })
      };
    });
  }, [selectedYear]);

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

  const handleOpenStatusDialog = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setNewStatus(invoice.status);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!invoiceToEdit) return;
    try {
      await saveInvoice({
        ...invoiceToEdit,
        status: newStatus,
        paidAt: newStatus === 'Paid' ? new Date().toISOString() : invoiceToEdit.paidAt,
      });
      toast({ title: 'Success', description: `Invoice status updated to ${newStatus}` });
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toast({ title: 'Error', description: 'Failed to update invoice status', variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete.id);
      toast({ title: 'Success', description: 'Invoice deleted successfully' });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };

  const handleDeleteAndRegenerate = async () => {
    if (!invoiceToDelete) return;
    setIsRegenerating(true);
    try {
      const invoiceData = { ...invoiceToDelete };
      
      // Delete the invoice first
      await deleteInvoice(invoiceToDelete.id);
      
      // Wait for Firestore listener to update local state
      // This ensures the deleted invoice is removed from the invoices array
      // before generateMonthlyInvoices checks for existing invoices
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Regenerate for the same period with the same company and residence
      // Use forceRegenerate=true to skip existing invoice check since we just deleted it
      const result = await generateMonthlyInvoices(invoiceData.month, undefined, {
        startDate: new Date(invoiceData.startDate),
        endDate: new Date(invoiceData.endDate)
      }, {
        companyId: invoiceData.companyId,
        residenceId: invoiceData.residenceId
      }, true);
      
      if (result.generated > 0) {
        toast({ title: 'Success / تم بنجاح', description: `تم إعادة توليد الفاتورة بنجاح (${result.generated} فاتورة)` });
      } else {
        toast({ title: 'تنبيه', description: 'تم حذف الفاتورة. لم يتم توليد فاتورة جديدة (لا يوجد عمال في الفترة المحددة)', variant: 'default' });
      }
      
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Failed to regenerate invoice:', error);
      toast({ title: 'Error', description: 'Failed to regenerate invoice', variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
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
    const total = userInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paid = userInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pending = userInvoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdue = userInvoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    return { total, paid, pending, overdue };
  }, [userInvoices]);

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
                <Label>اختر السنة</Label>
                <div className="flex gap-2">
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                    <Button
                      key={year}
                      variant={selectedYear === year ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedYear(year);
                        setSelectedMonth(''); // Clear selected month when year changes
                        setDateRange({ from: undefined, to: undefined }); // Clear date range
                      }}
                      className="flex-1"
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Quick Select Month</Label>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((m) => {
                    const monthInvoices = userInvoices.filter(inv => inv.month === m.value);
                    return (
                      <Button
                        key={m.value}
                        variant={selectedMonth === m.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleMonthSelect(m.value)}
                        className="w-full relative"
                      >
                        <span className="flex flex-col items-center w-full">
                          <span>{m.label}</span>
                          {monthInvoices.length > 0 && (
                            <span className="text-[10px] opacity-70">
                              {monthInvoices.length} invoices
                            </span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fiscal Period Range</Label>
                <div className="flex flex-col gap-2">
                  <Popover modal={true}>
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
                              {formatUTCDate(dateRange.from)} -{" "}
                              {formatUTCDate(dateRange.to)}
                            </>
                          ) : (
                            formatUTCDate(dateRange.from)
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={4}>
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range ? { from: range.from, to: range.to } : { from: undefined, to: undefined })}
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
              
              {/* Show active contracts info */}
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Contracts:</span>
                  <Badge variant={contracts.filter(c => c.status === 'Active').length > 0 ? 'default' : 'destructive'}>
                    {contracts.filter(c => c.status === 'Active').length}
                  </Badge>
                </div>
                {contracts.filter(c => c.status === 'Active').length === 0 && (
                  <p className="text-xs text-destructive mt-2">
                    ⚠️ لا توجد عقود نشطة. يجب إنشاء عقد أولاً من صفحة العقود.
                  </p>
                )}
              </div>

              {/* Company Filter */}
              <div className="space-y-2">
                <Label>الشركة (اختياري)</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الشركات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الشركات</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Residence Filter */}
              <div className="space-y-2">
                <Label>السكن (اختياري)</Label>
                <Select value={selectedResidenceId} onValueChange={setSelectedResidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع السكنات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع السكنات</SelectItem>
                    {userResidences.map((residence) => (
                      <SelectItem key={residence.id} value={residence.id}>
                        {residence.name} {residence.city ? `- ${residence.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toFixed(2)} SAR</div>
            <p className="text-xs text-muted-foreground">{userInvoices.length} invoices</p>
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
              {userInvoices.filter(inv => inv.status === 'Paid').length} invoices
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
              {userInvoices.filter(inv => inv.status === 'Pending').length} invoices
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
              {userInvoices.filter(inv => inv.status === 'Overdue').length} invoices
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
            <div className="space-y-6">
              {groupedInvoices.map(([month, invoices]) => {
                const monthTotal = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const firstInvoice = invoices[0];
                const isOpen = openMonths.has(month);
                
                return (
                  <Collapsible key={month} open={isOpen} onOpenChange={() => toggleMonth(month)}>
                    <div className="space-y-3">
                      {/* Month Header */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform",
                              isOpen && "transform rotate-180"
                            )} />
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-semibold text-lg">{month}</h3>
                              <p className="text-xs text-muted-foreground">
                                {formatUTCDate(new Date(firstInvoice.startDate))} - {formatUTCDate(new Date(firstInvoice.endDate))}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">{invoices.length} invoices</div>
                            <div className="font-bold text-lg">{monthTotal.toFixed(2)} SAR</div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      {/* Invoices Table */}
                      <CollapsibleContent className="space-y-3">
                        <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Residence</TableHead>
                            <TableHead className="text-right">Workers</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => {
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
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewDetails(invoice)}
                                      title="View Details"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleOpenStatusDialog(invoice)}
                                      title="Change Status"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => router.push(`/accommodation/invoices/${invoice.id}`)}
                                      title="Print Invoice"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    {/* Delete button - Admin only */}
                                    {currentUser?.role === 'Admin' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setInvoiceToDelete(invoice);
                                          setDeleteDialogOpen(true);
                                        }}
                                        title="Delete / Regenerate"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {/* Regenerate button - Admin & Supervisor */}
                                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Supervisor') && currentUser?.role !== 'Admin' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setInvoiceToDelete(invoice);
                                          setDeleteDialogOpen(true);
                                        }}
                                        title="Regenerate Invoice"
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <RefreshCw className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
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

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => router.push(`/accommodation/invoices/${selectedInvoice.id}`)}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleOpenStatusDialog(selectedInvoice);
                    setDetailsDialogOpen(false);
                  }}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Change Status
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير حالة الفاتورة / Change Invoice Status</DialogTitle>
            <DialogDescription>
              {invoiceToEdit?.id.split('_').slice(-2).join('-')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status / الحالة الحالية</Label>
              <div>{getStatusBadge(invoiceToEdit?.status || 'Pending')}</div>
            </div>
            
            <div className="space-y-2">
              <Label>New Status / الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Invoice['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft - مسودة</SelectItem>
                  <SelectItem value="Pending">Pending - قيد الانتظار</SelectItem>
                  <SelectItem value="Paid">Paid - مدفوعة</SelectItem>
                  <SelectItem value="Overdue">Overdue - متأخرة</SelectItem>
                  <SelectItem value="Cancelled">Cancelled - ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Regenerate Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف / إعادة توليد الفاتورة</DialogTitle>
            <DialogDescription>
              Delete / Regenerate Invoice
            </DialogDescription>
          </DialogHeader>
          
          {invoiceToDelete && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice:</span>
                  <span className="font-mono">{invoiceToDelete.id.split('_').slice(-2).join('-')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span>{companies.find(c => c.id === invoiceToDelete.companyId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span>{invoiceToDelete.month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold">{invoiceToDelete.totalAmount.toFixed(2)} SAR</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">اختر الإجراء المطلوب:</p>
                <ul className="list-disc list-inside space-y-1">
                  {currentUser?.role === 'Admin' && (
                    <li><strong>حذف فقط:</strong> حذف الفاتورة بدون إعادة توليد</li>
                  )}
                  <li><strong>إعادة توليد:</strong> حذف وإنشاء فاتورة جديدة محدّثة</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isRegenerating}
            >
              Cancel / إلغاء
            </Button>
            {currentUser?.role === 'Admin' && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteInvoice}
                disabled={isRegenerating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Only / حذف فقط
              </Button>
            )}
            <Button 
              onClick={handleDeleteAndRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Delete & Regenerate / حذف وإعادة توليد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
