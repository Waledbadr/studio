"use client";

import React, { useState } from 'react';
import { useAccommodation, type Company } from '@/context/accommodation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, FileText, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CompaniesPage() {
  const { companies, contracts, saveCompany, deleteCompany, getContractsByCompany } = useAccommodation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    nameEn: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });

  const filteredCompanies = companies.filter(comp => 
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name || '',
        nameAr: company.nameAr || '',
        nameEn: company.nameEn || '',
        contactEmail: company.contactEmail || '',
        contactPhone: company.contactPhone || '',
        address: company.address || '',
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        nameAr: '',
        nameEn: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await saveCompany({
          ...editingCompany,
          ...formData,
        });
      } else {
        await saveCompany({
          ...formData,
          createdAt: new Date().toISOString(),
        });
      }
      setDialogOpen(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Failed to save company:', error);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteCompany(companyId);
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-2">Manage sister companies and external partners</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                <DialogDescription>
                  {editingCompany ? 'Update company information' : 'Add a new sister company or partner'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">English Name</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="English name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">Arabic Name</Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="الاسم بالعربية"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="email@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+966 50 123 4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Company address"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCompany ? 'Update Company' : 'Add Company'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies ({filteredCompanies.length})</CardTitle>
          <CardDescription>List of registered companies</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add your first company
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-center">Contracts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const companyContracts = getContractsByCompany(company.id);
                    const activeContracts = companyContracts.filter(c => c.status === 'Active').length;
                    
                    return (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {company.nameEn && <span>{company.nameEn}</span>}
                              {company.nameAr && <span className="mr-2"> • {company.nameAr}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.contactEmail && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${company.contactEmail}`} className="hover:underline">
                                  {company.contactEmail}
                                </a>
                              </div>
                            )}
                            {company.contactPhone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {company.contactPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {company.address || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link 
                            href={`/accommodation/contracts?company=${company.id}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            {companyContracts.length}
                            {activeContracts > 0 && (
                              <span className="text-xs text-green-600">({activeContracts} active)</span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(company.id)}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {contracts.filter(c => c.status === 'Active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Companies with Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(contracts.map(c => c.companyId)).size}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Missing import fix
import { Building } from 'lucide-react';
