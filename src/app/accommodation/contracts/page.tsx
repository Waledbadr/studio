"use client";

import React, { useState, useMemo } from 'react';
import { useAccommodation, type Contract } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, FileText, TrendingUp, Calendar, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function ContractsPage() {
  const searchParams = useSearchParams();
  const companyFilter = searchParams?.get('company');
  
  const { contracts, companies, residences, occupants, workers, saveContract, deleteContract, getInvoicesByContract } = useAccommodation();
  const { currentUser } = useUsers();
  const { dict } = useLanguage();
  
  // Filter residences based on user role
  const filteredResidences = useMemo(() => {
    if (!currentUser) return residences;
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    companyId: '',
    residenceId: '',
    startDate: '',
    endDate: '',
    ratePerPersonPerMonth: 0,
    expectedWorkers: 0,
    status: 'Active' as Contract['status'],
    notes: '',
  });

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Company filter from URL
      if (companyFilter && contract.companyId !== companyFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all' && contract.status !== statusFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const company = companies.find(c => c.id === contract.companyId);
        const residence = residences.find(r => r.id === contract.residenceId);
        const searchLower = searchTerm.toLowerCase();
        
        if (
          !company?.name.toLowerCase().includes(searchLower) &&
          !residence?.name.toLowerCase().includes(searchLower) &&
          !contract.id.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      return true;
    });
  }, [contracts, statusFilter, searchTerm, companyFilter, companies, residences]);

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        companyId: contract.companyId,
        residenceId: contract.residenceId,
        startDate: contract.startDate.split('T')[0],
        endDate: contract.endDate.split('T')[0],
        ratePerPersonPerMonth: contract.ratePerPersonPerMonth,
        expectedWorkers: contract.expectedWorkers || 0,
        status: contract.status,
        notes: contract.notes || '',
      });
    } else {
      setEditingContract(null);
      setFormData({
        companyId: companyFilter || '',
        residenceId: '',
        startDate: '',
        endDate: '',
        ratePerPersonPerMonth: 0,
        expectedWorkers: 0,
        status: 'Active',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContract) {
        await saveContract({
          ...editingContract,
          ...formData,
        });
      } else {
        await saveContract({
          ...formData,
          createdAt: new Date().toISOString(),
        });
      }
      setDialogOpen(false);
      setEditingContract(null);
    } catch (error) {
      console.error('Failed to save contract:', error);
    }
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm(dict.contracts.deleteConfirm)) {
      return;
    }
    try {
      await deleteContract(contractId);
    } catch (error) {
      console.error('Failed to delete contract:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{dict.contracts.title}</h1>
          <p className="text-muted-foreground mt-1">{dict.contracts.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              {dict.contracts.addContract}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingContract ? dict.contracts.editContract : dict.contracts.addContract}</DialogTitle>
              <DialogDescription>
                {dict.contracts.subtitle}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">{dict.contracts.company}</Label>
                  <Select 
                    value={formData.companyId} 
                    onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dict.contracts.company} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residence">{dict.contracts.residence}</Label>
                  <Select 
                    value={formData.residenceId} 
                    onValueChange={(val) => setFormData({ ...formData, residenceId: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dict.contracts.residence} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredResidences.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{dict.contracts.startDate}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{dict.contracts.endDate}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">{dict.contracts.rate}</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.ratePerPersonPerMonth}
                    onChange={(e) => setFormData({ ...formData, ratePerPersonPerMonth: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedWorkers">{dict.contracts.expectedWorkers}</Label>
                  <Input
                    id="expectedWorkers"
                    type="number"
                    min="0"
                    value={formData.expectedWorkers}
                    onChange={(e) => setFormData({ ...formData, expectedWorkers: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{dict.contracts.status}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{dict.contracts.active}</SelectItem>
                    <SelectItem value="Expired">{dict.contracts.expired}</SelectItem>
                    <SelectItem value="Terminated">{dict.contracts.terminated}</SelectItem>
                    <SelectItem value="Pending">{dict.contracts.pending}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{dict.contracts.notes}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={dict.contracts.notes}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {dict.contracts.cancel}
                </Button>
                <Button type="submit">{dict.contracts.save}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={dict.contracts.searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full sm:w-[300px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={dict.contracts.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.contracts.allStatus}</SelectItem>
            <SelectItem value="Active">{dict.contracts.active}</SelectItem>
            <SelectItem value="Expired">{dict.contracts.expired}</SelectItem>
            <SelectItem value="Terminated">{dict.contracts.terminated}</SelectItem>
            <SelectItem value="Pending">{dict.contracts.pending}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.contracts.company}</TableHead>
                  <TableHead className="hidden md:table-cell">{dict.contracts.residence}</TableHead>
                  <TableHead className="hidden lg:table-cell">{dict.contracts.startDate}</TableHead>
                  <TableHead className="hidden lg:table-cell">{dict.contracts.endDate}</TableHead>
                  <TableHead className="text-center">{dict.contracts.status}</TableHead>
                  <TableHead className="text-right">{dict.contracts.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {dict.contracts.noContracts}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const company = companies.find(c => c.id === contract.companyId);
                    const residence = residences.find(r => r.id === contract.residenceId);
                    const statusColor = 
                      contract.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      contract.status === 'Expired' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      contract.status === 'Terminated' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                    
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          <div>{company?.name || 'Unknown Company'}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {residence?.name} • {contract.status}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {residence?.name || 'Unknown Residence'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(contract.startDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(contract.endDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <Badge variant="outline" className={`border-0 ${statusColor}`}>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(contract)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(contract.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Link href={`/accommodation/invoices?contractId=${contract.id}`}>
                              <Button variant="ghost" size="icon" title={dict.contracts.viewInvoices}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );






  const getActualWorkers = (residenceId: string, companyId: string) => {
    // Count workers in this residence that belong to this company
    return occupants.filter(occ => {
      const worker = workers.find(w => w.id === occ.workerId);
      // Assuming workers have a companyId field - may need adjustment
      return occ.residenceId === residenceId;
    }).length;
  };

  const getStatusBadge = (status: Contract['status']) => {
    const variants: Record<Contract['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Active: 'default',
      Expired: 'secondary',
      Cancelled: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground mt-2">Manage accommodation contracts with sister companies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingContract ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
                <DialogDescription>
                  {editingContract ? 'Update contract details' : 'Set up a new accommodation contract'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company *</Label>
                    <Select
                      value={formData.companyId}
                      onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="residenceId">Residence *</Label>
                    <Select
                      value={formData.residenceId}
                      onValueChange={(value) => setFormData({ ...formData, residenceId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select residence" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredResidences.map(residence => (
                          <SelectItem key={residence.id} value={residence.id}>
                            {residence.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ratePerPersonPerMonth">Rate per Person/Month (SAR) *</Label>
                    <Input
                      id="ratePerPersonPerMonth"
                      type="number"
                      step="0.01"
                      value={formData.ratePerPersonPerMonth}
                      onChange={(e) => setFormData({ ...formData, ratePerPersonPerMonth: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedWorkers">Expected Workers</Label>
                    <Input
                      id="expectedWorkers"
                      type="number"
                      value={formData.expectedWorkers}
                      onChange={(e) => setFormData({ ...formData, expectedWorkers: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Contract['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or terms..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search contracts..."
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
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts ({filteredContracts.length})</CardTitle>
          <CardDescription>Active and historical contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contracts found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create your first contract
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Residence</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Rate/Month</TableHead>
                    <TableHead className="text-center">Workers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const company = companies.find(c => c.id === contract.companyId);
                    const residence = residences.find(r => r.id === contract.residenceId);
                    const actualWorkers = getActualWorkers(contract.residenceId, contract.companyId);
                    const invoices = getInvoicesByContract(contract.id);
                    
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div className="font-medium">{company?.name || contract.companyId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{residence?.name || contract.residenceId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {contract.ratePerPersonPerMonth.toFixed(2)} SAR
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            <span className="font-medium">{actualWorkers}</span>
                            {contract.expectedWorkers ? (
                              <span className="text-muted-foreground"> / {contract.expectedWorkers}</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(contract.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(contract)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(contract.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contracts.filter(c => c.status === 'Active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Expired Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {contracts.filter(c => c.status === 'Expired').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts
                .filter(c => c.status === 'Active')
                .reduce((sum, c) => {
                  const workers = getActualWorkers(c.residenceId, c.companyId);
                  return sum + (workers * c.ratePerPersonPerMonth);
                }, 0)
                .toFixed(2)} SAR
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
