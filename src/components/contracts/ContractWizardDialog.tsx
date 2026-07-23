'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2, Building2, Store, Home, Wrench, Droplets, Flame, Wifi, Users,
  FileText, DollarSign, Calendar, ShieldCheck, Plus, Trash2, Search, Sparkles,
  ChevronRight, ChevronLeft, Shield, Zap, Receipt, FileSpreadsheet, UserCheck
} from 'lucide-react';
import {
  type Contract,
  type ContractFormData,
  type ContractType,
  type BillingType,
  type PartyType,
  type ContractGuarantee,
  CONTRACT_TYPES,
  getContractTypeInfo,
  getContractCategoryLabel,
  getBillingTypeLabel,
  formatSAR
} from '@/types/contracts';

interface ResidenceOption {
  id: string;
  name: string;
  code?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface ContractWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  selectedContract?: Contract | null;
  companies: CompanyOption[];
  residences: ResidenceOption[];
  onSubmit: (formData: ContractFormData) => Promise<void>;
  isAr?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  Building2: <Building2 className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
  Droplets: <Droplets className="h-5 w-5" />,
  Store: <Store className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  Wifi: <Wifi className="h-5 w-5" />,
};

// 7 Primary Core Types for Step 1 selection
const CORE_TYPES: ContractType[] = [
  'lease_in',
  'lease_out',
  'accommodation_agreement',
  'service',
  'supply',
  'commercial',
  'utility',
];

// Presets for quick filling
const PRESETS = [
  {
    id: 'worker_housing',
    labelAr: 'عقد تسكين عمالة باليوم',
    labelEn: 'Worker Housing',
    type: 'accommodation_agreement' as ContractType,
    billingType: 'per_person_per_day' as BillingType,
    billingUnit: 'شخص/يوم',
    billingRate: 35,
    workers: 100,
  },
  {
    id: 'lease_in_bldg',
    labelAr: 'استئجار مبنى سكن (Lease In)',
    labelEn: 'Lease In Building',
    type: 'lease_in' as ContractType,
    billingType: 'fixed_monthly' as BillingType,
    billingUnit: 'شهري',
    billingRate: 50000,
  },
  {
    id: 'commercial_store',
    labelAr: 'تأجير محل / مطعم تجاري',
    labelEn: 'Commercial Store',
    type: 'commercial' as ContractType,
    billingType: 'fixed_monthly' as BillingType,
    billingUnit: 'شهري',
    billingRate: 4000,
  },
  {
    id: 'service_elevators',
    labelAr: 'عقد صيانة مصاعد ونظافة',
    labelEn: 'Service Contract',
    type: 'service' as ContractType,
    billingType: 'fixed_monthly' as BillingType,
    billingUnit: 'شهري',
    billingRate: 2500,
  },
  {
    id: 'utility_elec',
    labelAr: 'عقد عداد كهرباء / مرافق',
    labelEn: 'Utility Contract',
    type: 'utility' as ContractType,
    billingType: 'fixed_monthly' as BillingType,
    billingUnit: 'فاتورة',
    billingRate: 1200,
  },
];

export function ContractWizardDialog({
  open,
  onOpenChange,
  mode,
  selectedContract,
  companies,
  residences,
  onSubmit,
  isAr = true,
}: ContractWizardDialogProps) {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  const [residenceSearch, setResidenceSearch] = useState<string>('');

  const initialFormData: ContractFormData = useMemo(() => ({
    title: '',
    contractNumber: `CTR-${Math.floor(100000 + Math.random() * 900000)}`,
    contractType: 'accommodation_agreement',
    contractCategory: 'revenue',
    partyType: 'company',
    partyId: '',
    partyName: '',
    partyContact: '',
    partyPhone: '',
    linkedResidences: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isOpenEnded: false,
    currency: 'SAR',
    billingType: 'per_person_per_day',
    billingRate: 0,
    vatPercentage: 15,
    billingUnit: isAr ? 'شخص/يوم' : 'person/day',
    paymentTerms: '',
    advancePayment: 0,
    services: [],
    guarantees: [],
    leaseDetails: { propertyType: 'building', totalAreaSqm: 0, buildingName: '', unitNumbers: [] },
    accommodationDetails: { targetWorkersCount: 50, dailyRatePerWorker: 30, bedsCount: 60 },
    serviceDetails: { serviceCategory: 'صيانة ونظافة', slaResponseHours: 4, visitFrequency: 'monthly', equipmentCount: 1 },
    supplyDetails: { supplyCategory: 'water', unitPrice: 120, deliverySchedule: 'أسبوعي' },
    commercialDetails: { commercialActivity: 'grocery', concessionType: 'fixed_rent', concessionPercentage: 0 },
    utilityDetails: { utilityType: 'electricity', meterNumber: '', accountNumber: '', providerName: 'شركة الكهرباء' },
    notes: '',
    renewalType: 'manual',
    autoRenew: false,
    noticePeriodDays: 30,
    contractManager: '',
    accountantName: '',
  }), [isAr]);

  const [formData, setFormData] = useState<ContractFormData>(initialFormData);

  useEffect(() => {
    if (open) {
      setStep(1);
      if (mode === 'edit' && selectedContract) {
        setFormData({
          title: selectedContract.title || '',
          contractNumber: selectedContract.contractNumber || `CTR-${selectedContract.id}`,
          contractType: selectedContract.contractType,
          contractCategory: selectedContract.contractCategory,
          partyType: selectedContract.partyType,
          partyId: selectedContract.partyId,
          partyName: selectedContract.partyName,
          partyContact: selectedContract.partyContact || '',
          partyPhone: selectedContract.partyPhone || '',
          linkedResidences: selectedContract.linkedResidences || [],
          startDate: selectedContract.startDate || '',
          endDate: selectedContract.endDate || '',
          isOpenEnded: selectedContract.isOpenEnded || false,
          currency: selectedContract.currency || 'SAR',
          billingType: selectedContract.billingType,
          billingRate: selectedContract.billingRate || 0,
          vatPercentage: selectedContract.vatPercentage ?? 15,
          billingUnit: selectedContract.billingUnit || '',
          paymentTerms: selectedContract.paymentTerms || '',
          advancePayment: selectedContract.advancePayment || 0,
          services: selectedContract.services || [],
          guarantees: selectedContract.guarantees || [],
          leaseDetails: selectedContract.leaseDetails || { propertyType: 'building', totalAreaSqm: 0, buildingName: '' },
          accommodationDetails: selectedContract.accommodationDetails || { targetWorkersCount: 50, dailyRatePerWorker: 30, bedsCount: 60 },
          serviceDetails: selectedContract.serviceDetails || { serviceCategory: 'صيانة ونظافة', slaResponseHours: 4, visitFrequency: 'monthly' },
          supplyDetails: selectedContract.supplyDetails || { supplyCategory: 'water', unitPrice: 120 },
          commercialDetails: selectedContract.commercialDetails || { commercialActivity: 'grocery', concessionType: 'fixed_rent' },
          utilityDetails: selectedContract.utilityDetails || { utilityType: 'electricity', meterNumber: '', accountNumber: '' },
          notes: selectedContract.notes || '',
          renewalType: selectedContract.renewalType || 'manual',
          autoRenew: selectedContract.autoRenew || false,
          noticePeriodDays: selectedContract.noticePeriodDays || 30,
          contractManager: selectedContract.contractManager || '',
          accountantName: selectedContract.accountantName || '',
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, mode, selectedContract, initialFormData]);

  const steps = [
    { num: 1, titleAr: 'نوع العقد والتصنيف', titleEn: 'Contract Type', icon: FileText },
    { num: 2, titleAr: 'الطرف الآخر والمباني', titleEn: 'Party & Properties', icon: Building2 },
    { num: 3, titleAr: 'البيانات الديناميكية والفوترة', titleEn: 'Dynamic Specs & Billing', icon: DollarSign },
    { num: 4, titleAr: 'المدة والضمانات والمسؤولين', titleEn: 'Duration, Guarantees & Roles', icon: Calendar },
    { num: 5, titleAr: 'المراجعة والإنشاء', titleEn: 'Review & Confirm', icon: ShieldCheck },
  ];

  const handleTypeChange = (type: ContractType) => {
    const info = getContractTypeInfo(type);
    setFormData(prev => ({
      ...prev,
      contractType: type,
      contractCategory: info.category,
      billingType: info.defaultBillingType,
      billingUnit: info.defaultBillingUnit,
      services: info.hasServices ? (prev.services && prev.services.length > 0 ? prev.services : [{ name: '', rate: 0, frequency: 'monthly' }]) : [],
    }));
  };

  const handlePartyChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setFormData(prev => ({
        ...prev,
        partyId: company.id,
        partyName: company.name,
        partyContact: company.contactEmail || prev.partyContact,
        partyPhone: company.contactPhone || prev.partyPhone,
      }));
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    handleTypeChange(preset.type);
    setFormData(prev => ({
      ...prev,
      billingType: preset.billingType,
      billingUnit: preset.billingUnit,
      billingRate: preset.billingRate,
      accommodationDetails: preset.workers ? { ...prev.accommodationDetails, targetWorkersCount: preset.workers, dailyRatePerWorker: preset.billingRate } : prev.accommodationDetails,
    }));
  };

  const toggleResidence = (id: string) => {
    setFormData(prev => ({
      ...prev,
      linkedResidences: prev.linkedResidences.includes(id)
        ? prev.linkedResidences.filter(rId => rId !== id)
        : [...prev.linkedResidences, id],
    }));
  };

  const setDurationMonths = (months: number) => {
    if (!formData.startDate) return;
    const start = new Date(formData.startDate);
    start.setMonth(start.getMonth() + months);
    setFormData(prev => ({
      ...prev,
      endDate: start.toISOString().split('T')[0],
      isOpenEnded: false,
    }));
  };

  // VAT calculations
  const vatAmount = useMemo(() => {
    const rate = formData.billingRate || 0;
    const vatPct = formData.vatPercentage || 0;
    return (rate * vatPct) / 100;
  }, [formData.billingRate, formData.vatPercentage]);

  const totalWithVat = useMemo(() => {
    return (formData.billingRate || 0) + vatAmount;
  }, [formData.billingRate, vatAmount]);

  // Primary contract type cards filtered
  const filteredPrimaryTypes = useMemo(() => {
    const primaryInfoList = CORE_TYPES.map(t => getContractTypeInfo(t));
    if (categoryFilter === 'all') return primaryInfoList;
    return primaryInfoList.filter(t => t.category === categoryFilter);
  }, [categoryFilter]);

  const filteredResidences = useMemo(() => {
    if (!residenceSearch.trim()) return residences;
    const q = residenceSearch.toLowerCase();
    return residences.filter(r => r.name.toLowerCase().includes(q) || (r.code && r.code.toLowerCase().includes(q)));
  }, [residences, residenceSearch]);

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to submit contract wizard:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = useMemo(() => {
    if (step === 1) return !!formData.contractType;
    if (step === 2) return !!formData.partyName.trim();
    if (step === 3) return formData.billingRate >= 0;
    if (step === 4) return formData.isOpenEnded || !!formData.startDate;
    return true;
  }, [step, formData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 border-primary/20 shadow-2xl">
        {/* Header with Stepper */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary-foreground border-primary/30">
                  {mode === 'edit' ? (isAr ? 'تعديل عقد' : 'Edit Contract') : (isAr ? 'عقد جديد' : 'New Contract')}
                </Badge>
                <span className="text-xs text-slate-400">
                  {isAr ? `الخطوة ${step} من 5` : `Step ${step} of 5`}
                </span>
                {formData.contractNumber && (
                  <span className="text-xs font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {formData.contractNumber}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold mt-1 text-white flex items-center gap-2">
                {steps[step - 1].titleAr}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {isAr ? 'معالج إنشاء وإدارة العقود النظامي' : 'Enterprise contract wizard'}
              </DialogDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              <span className="text-slate-400">{isAr ? 'التصنيف:' : 'Category:'}</span>
              <Badge className={formData.contractCategory === 'revenue' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}>
                {getContractCategoryLabel(formData.contractCategory, isAr)}
              </Badge>
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {steps.map((st) => {
              const isActive = step === st.num;
              const isCompleted = step > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => isCompleted && setStep(st.num)}
                  disabled={!isCompleted && !isActive}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-center ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-md scale-105'
                      : isCompleted
                      ? 'bg-slate-800/90 text-emerald-400 hover:bg-slate-800 cursor-pointer'
                      : 'bg-slate-800/40 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                        isActive ? 'bg-white text-primary' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {st.num}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] truncate max-w-full hidden md:inline">
                    {isAr ? st.titleAr : st.titleEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
          {/* STEP 1: Core Polymorphic Contract Types */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Presets Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{isAr ? 'اختيارات سريعة جاهزة (Quick Presets):' : 'Quick Presets:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className={`text-xs h-8 gap-1.5 transition-all ${
                        formData.contractType === preset.type
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isAr ? preset.labelAr : preset.labelEn}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center justify-between border-b pb-3">
                <Label className="text-base font-bold">{isAr ? 'اختر نوع العقد الرئيسي (7 أنواع نظامية):' : 'Select Core Contract Type:'}</Label>
                <div className="flex bg-muted p-1 rounded-lg gap-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                      categoryFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    {isAr ? 'الكل (7)' : 'All (7)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('revenue')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                      categoryFilter === 'revenue' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600 hover:bg-emerald-500/10'
                    }`}
                  >
                    {isAr ? '🟢 إيرادات' : '🟢 Revenue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('expense')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                      categoryFilter === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 hover:bg-rose-500/10'
                    }`}
                  >
                    {isAr ? '🔴 مصروفات' : '🔴 Expense'}
                  </button>
                </div>
              </div>

              {/* Core Types Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPrimaryTypes.map((typeObj) => {
                  const isSelected = formData.contractType === typeObj.type;
                  const isRev = typeObj.category === 'revenue';
                  return (
                    <div
                      key={typeObj.type}
                      onClick={() => handleTypeChange(typeObj.type)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-lg ${isRev ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {typeIcons[typeObj.icon] || <FileText className="h-5 w-5" />}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isRev ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-rose-300 text-rose-700 bg-rose-50'
                          }`}
                        >
                          {getContractCategoryLabel(typeObj.category, isAr)}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-bold text-sm text-foreground">
                          {isAr ? typeObj.labelAr : typeObj.labelEn}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {typeObj.descriptionAr}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Party & Linked Entities */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* General info inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'رقم العقد:' : 'Contract Number:'}</Label>
                  <Input
                    value={formData.contractNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="CTR-100200"
                    className="mt-1.5 bg-background font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'عنوان/اسم العقد الوصفي:' : 'Contract Title:'}</Label>
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isAr ? 'مثال: عقد إيجار سكن عمال شركة البناء' : 'e.g. Workers Lease Agreement'}
                    className="mt-1.5 bg-background text-xs"
                  />
                </div>
              </div>

              {/* Party Type Select */}
              <div className="space-y-3">
                <Label className="text-base font-bold">{isAr ? 'نوع الطرف الثاني في العقد:' : 'Second Party Type:'}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'company', labelAr: 'شركة / جهة', labelEn: 'Company', icon: Building2 },
                    { id: 'vendor', labelAr: 'مورد / مقاول', labelEn: 'Vendor', icon: Store },
                    { id: 'individual', labelAr: 'فرد / شخص', labelEn: 'Individual', icon: Users },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, partyType: p.id as PartyType }))}
                      className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                        formData.partyType === p.id
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-card hover:bg-accent'
                      }`}
                    >
                      <p.icon className="h-4 w-4" />
                      <span>{isAr ? p.labelAr : p.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Party Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'اختر من القائمة المسجلة:' : 'Select Registered Party:'}</Label>
                  <Select value={formData.partyId} onValueChange={handlePartyChange}>
                    <SelectTrigger className="mt-1.5 bg-background text-xs">
                      <SelectValue placeholder={isAr ? 'اختر شركة مسجلة...' : 'Select company...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'اسم الطرف في العقد (مطلوب):' : 'Party Name (Required):'}</Label>
                  <Input
                    value={formData.partyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
                    placeholder={isAr ? 'اسم الشركة أو الفرد' : 'Company or individual name'}
                    className="mt-1.5 bg-background text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'البريد أو مسؤول التواصل:' : 'Contact Email/Person:'}</Label>
                  <Input
                    value={formData.partyContact || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, partyContact: e.target.value }))}
                    placeholder="contact@company.com"
                    className="mt-1.5 bg-background text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'رقم الهاتف:' : 'Phone Number:'}</Label>
                  <Input
                    value={formData.partyPhone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, partyPhone: e.target.value }))}
                    placeholder="05XXXXXXXX"
                    className="mt-1.5 bg-background text-xs"
                  />
                </div>
              </div>

              {/* Linked Residences */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-bold">{isAr ? 'السكنات / العقارات المرتبطة:' : 'Linked Properties/Residences:'}</Label>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={residenceSearch}
                    onChange={(e) => setResidenceSearch(e.target.value)}
                    placeholder={isAr ? 'بحث في السكنات...' : 'Search residences...'}
                    className="pr-9 bg-background text-xs h-9"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {filteredResidences.map(res => {
                    const isChecked = formData.linkedResidences.includes(res.id);
                    return (
                      <label
                        key={res.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                            : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleResidence(res.id)} />
                        <span className="text-xs truncate">{res.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Dynamic Specs & Billing & Financials */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* DYNAMIC SECTION BASED ON CONTRACT TYPE */}
              {formData.contractType === 'lease_in' || formData.contractType === 'lease_out' ? (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                  <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {isAr ? '🏢 بيانات قسم عقد الإيجار (Lease Specs):' : 'Lease Specifications:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <Label className="text-xs">{isAr ? 'نوع العقار:' : 'Property Type:'}</Label>
                      <Select
                        value={formData.leaseDetails?.propertyType || 'building'}
                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, leaseDetails: { ...prev.leaseDetails, propertyType: val } }))}
                      >
                        <SelectTrigger className="bg-background mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="building">{isAr ? 'مبنى / عمارة' : 'Building'}</SelectItem>
                          <SelectItem value="residence">{isAr ? 'مجمع سكن' : 'Housing Complex'}</SelectItem>
                          <SelectItem value="land">{isAr ? 'أرض' : 'Land'}</SelectItem>
                          <SelectItem value="warehouse">{isAr ? 'مستودع' : 'Warehouse'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'المساحة الإجمالية (م²):' : 'Total Area (sqm):'}</Label>
                      <Input
                        type="number"
                        value={formData.leaseDetails?.totalAreaSqm || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, leaseDetails: { ...prev.leaseDetails, totalAreaSqm: Number(e.target.value) } }))}
                        placeholder="1200"
                        className="bg-background mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'اسم المبنى / المشروع:' : 'Building Name:'}</Label>
                      <Input
                        value={formData.leaseDetails?.buildingName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, leaseDetails: { ...prev.leaseDetails, buildingName: e.target.value } }))}
                        placeholder={isAr ? 'مبنى السلام A' : 'Al-Salam Bldg A'}
                        className="bg-background mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : formData.contractType === 'accommodation_agreement' ? (
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                  <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {isAr ? '🛌 بيانات قسم عقد الإسكان والتسكين (Accommodation Specs):' : 'Accommodation Specifications:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <Label className="text-xs">{isAr ? 'عدد العمال المستهدف:' : 'Target Workers Count:'}</Label>
                      <Input
                        type="number"
                        value={formData.accommodationDetails?.targetWorkersCount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, accommodationDetails: { ...prev.accommodationDetails, targetWorkersCount: Number(e.target.value) } }))}
                        placeholder="120"
                        className="bg-background mt-1 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'السعر اليومي للفرد (ر.س):' : 'Daily Rate / Worker:'}</Label>
                      <Input
                        type="number"
                        value={formData.billingRate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingRate: Number(e.target.value), accommodationDetails: { ...prev.accommodationDetails, dailyRatePerWorker: Number(e.target.value) } }))}
                        placeholder="40"
                        className="bg-background mt-1 text-xs font-mono font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'عدد الأسرة المخصصة:' : 'Beds Reserved:'}</Label>
                      <Input
                        type="number"
                        value={formData.accommodationDetails?.bedsCount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, accommodationDetails: { ...prev.accommodationDetails, bedsCount: Number(e.target.value) } }))}
                        placeholder="150"
                        className="bg-background mt-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : formData.contractType === 'service' ? (
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-3">
                  <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    {isAr ? '🔧 بيانات قسم عقد الخدمات والصيانة (Service Specs):' : 'Service Specifications:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <Label className="text-xs">{isAr ? 'تصنيف الخدمة:' : 'Service Category:'}</Label>
                      <Input
                        value={formData.serviceDetails?.serviceCategory || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceDetails: { ...prev.serviceDetails, serviceCategory: e.target.value } }))}
                        placeholder={isAr ? 'مصاعد، نظافة، رش مبيدات' : 'Elevators, Cleaning'}
                        className="bg-background mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'فترة الاستجابة SLA (بالساعات):' : 'SLA Response Hours:'}</Label>
                      <Input
                        type="number"
                        value={formData.serviceDetails?.slaResponseHours || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceDetails: { ...prev.serviceDetails, slaResponseHours: Number(e.target.value) } }))}
                        placeholder="4"
                        className="bg-background mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'دورية الزيارات:' : 'Visit Frequency:'}</Label>
                      <Select
                        value={formData.serviceDetails?.visitFrequency || 'monthly'}
                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, serviceDetails: { ...prev.serviceDetails, visitFrequency: val } }))}
                      >
                        <SelectTrigger className="bg-background mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">{isAr ? 'أسبوعي' : 'Weekly'}</SelectItem>
                          <SelectItem value="biweekly">{isAr ? 'كل أسبوعين' : 'Biweekly'}</SelectItem>
                          <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                          <SelectItem value="quarterly">{isAr ? 'ربع سنوي' : 'Quarterly'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : formData.contractType === 'supply' ? (
                <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 space-y-3">
                  <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    {isAr ? '📦 بيانات قسم عقد التوريد (Supply Specs):' : 'Supply Specifications:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <Label className="text-xs">{isAr ? 'نوع التوريد:' : 'Supply Category:'}</Label>
                      <Select
                        value={formData.supplyDetails?.supplyCategory || 'water'}
                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, supplyDetails: { ...prev.supplyDetails, supplyCategory: val } }))}
                      >
                        <SelectTrigger className="bg-background mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="water">{isAr ? 'مياه شرب / غسيل' : 'Water'}</SelectItem>
                          <SelectItem value="diesel">{isAr ? 'ديزل للمولدات' : 'Diesel'}</SelectItem>
                          <SelectItem value="furniture">{isAr ? 'أثاث ومستلزمات' : 'Furniture'}</SelectItem>
                          <SelectItem value="appliances">{isAr ? 'أجهزة كهربائية' : 'Appliances'}</SelectItem>
                          <SelectItem value="beds">{isAr ? 'أسرة وفرش' : 'Beds & Mattresses'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'سعر الوحدة (ر.س):' : 'Unit Price:'}</Label>
                      <Input
                        type="number"
                        value={formData.billingRate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingRate: Number(e.target.value), supplyDetails: { ...prev.supplyDetails, unitPrice: Number(e.target.value) } }))}
                        placeholder="120"
                        className="bg-background mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'جدول التوريد والتسليم:' : 'Delivery Schedule:'}</Label>
                      <Input
                        value={formData.supplyDetails?.deliverySchedule || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplyDetails: { ...prev.supplyDetails, deliverySchedule: e.target.value } }))}
                        placeholder={isAr ? 'يومياً الساعة 8 صباحاً' : 'Daily 8 AM'}
                        className="bg-background mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : formData.contractType === 'utility' ? (
                <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/20 space-y-3">
                  <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    {isAr ? '⚡ بيانات قسم المرافق والعدادات (Utility Specs):' : 'Utility Specifications:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <Label className="text-xs">{isAr ? 'رقم العداد:' : 'Meter Number:'}</Label>
                      <Input
                        value={formData.utilityDetails?.meterNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, utilityDetails: { ...prev.utilityDetails, meterNumber: e.target.value } }))}
                        placeholder="MTR-900812"
                        className="bg-background mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'رقم الحساب لدى الشركة:' : 'Account Number:'}</Label>
                      <Input
                        value={formData.utilityDetails?.accountNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, utilityDetails: { ...prev.utilityDetails, accountNumber: e.target.value } }))}
                        placeholder="ACC-50041"
                        className="bg-background mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{isAr ? 'اسم الشركة المزودة:' : 'Provider Name:'}</Label>
                      <Input
                        value={formData.utilityDetails?.providerName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, utilityDetails: { ...prev.utilityDetails, providerName: e.target.value } }))}
                        placeholder={isAr ? 'شركة الكهرباء السعودية' : 'SEC'}
                        className="bg-background mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Billing Calculation Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border">
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'آلية احتساب الفوترة:' : 'Billing Type:'}</Label>
                  <Select
                    value={formData.billingType}
                    onValueChange={(val: any) => setFormData(prev => ({ ...prev, billingType: val }))}
                  >
                    <SelectTrigger className="bg-background mt-1.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_person_per_day">{isAr ? 'للشخص/اليوم' : 'Per Person/Day'}</SelectItem>
                      <SelectItem value="per_person_per_month">{isAr ? 'للشخص/الشهر' : 'Per Person/Month'}</SelectItem>
                      <SelectItem value="fixed_monthly">{isAr ? 'مبلغ شهري ثابت' : 'Fixed Monthly'}</SelectItem>
                      <SelectItem value="fixed_yearly">{isAr ? 'مبلغ سنوي ثابت' : 'Fixed Yearly'}</SelectItem>
                      <SelectItem value="per_invoice">{isAr ? 'حسب الفاتورة' : 'Per Invoice'}</SelectItem>
                      <SelectItem value="per_unit">{isAr ? 'حسب الوحدة' : 'Per Unit'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'المبلغ قبل الضريبة (ر.س):' : 'Base Rate (SAR):'}</Label>
                  <Input
                    type="number"
                    value={formData.billingRate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingRate: Number(e.target.value) }))}
                    placeholder="0.00"
                    className="mt-1.5 bg-background font-mono text-base font-bold"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'ضريبة القيمة المضافة %:' : 'VAT %:'}</Label>
                  <Input
                    type="number"
                    value={formData.vatPercentage ?? 15}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatPercentage: Number(e.target.value) }))}
                    placeholder="15"
                    className="mt-1.5 bg-background text-xs font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{isAr ? 'الإجمالي الشامل للضريبة:' : 'Total with VAT:'}</Label>
                  <div className="mt-1.5 h-10 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center font-mono font-extrabold text-emerald-600 text-sm">
                    {formatSAR(totalWithVat)} SAR
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Duration, Guarantees & Roles */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Presets Duration Buttons */}
              <div className="bg-muted/30 p-3.5 rounded-xl border">
                <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'حدد مدة العقد بسرعة:' : 'Quick Duration Presets:'}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { labelAr: '3 أشهر', labelEn: '3 Months', months: 3 },
                    { labelAr: '6 أشهر', labelEn: '6 Months', months: 6 },
                    { labelAr: 'سنة واحدة (12 شهر)', labelEn: '1 Year', months: 12 },
                    { labelAr: 'سنتان (24 شهر)', labelEn: '2 Years', months: 24 },
                  ].map((p) => (
                    <Button
                      key={p.months}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDurationMonths(p.months)}
                      className="text-xs bg-background hover:bg-primary/10 hover:text-primary"
                    >
                      {isAr ? p.labelAr : p.labelEn}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dates Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'تاريخ بداية العقد:' : 'Start Date:'}</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1.5 bg-background"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'تاريخ نهاية العقد:' : 'End Date:'}</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={formData.isOpenEnded}
                    className="mt-1.5 bg-background"
                  />
                </div>
              </div>

              {/* Guarantees Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    {isAr ? 'قسم الضمانات والـ Securities (تأمين، شيكات، كفالات):' : 'Contract Guarantees & Securities:'}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, guarantees: [...(prev.guarantees || []), { type: 'security_deposit', amount: 0 }] }))}
                    className="text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? 'إضافة ضمان' : 'Add Guarantee'}
                  </Button>
                </div>

                {(formData.guarantees || []).map((g, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-muted/40 rounded-lg border">
                    <Select
                      value={g.type}
                      onValueChange={(val: any) => {
                        const list = [...(formData.guarantees || [])];
                        list[idx].type = val;
                        setFormData(prev => ({ ...prev, guarantees: list }));
                      }}
                    >
                      <SelectTrigger className="bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="security_deposit">{isAr ? 'تأمين نقدي' : 'Security Deposit'}</SelectItem>
                        <SelectItem value="check">{isAr ? 'شيك ضمان' : 'Check'}</SelectItem>
                        <SelectItem value="letter_of_credit">{isAr ? 'خطاب ضمان بنكي' : 'Letter of Credit'}</SelectItem>
                        <SelectItem value="bail">{isAr ? 'كفالة حضورية/غرمية' : 'Bail'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={g.amount || ''}
                      onChange={(e) => {
                        const list = [...(formData.guarantees || [])];
                        list[idx].amount = Number(e.target.value);
                        setFormData(prev => ({ ...prev, guarantees: list }));
                      }}
                      placeholder={isAr ? 'قيمة الضمان' : 'Amount'}
                      className="bg-background text-xs font-mono"
                    />
                    <Input
                      value={g.referenceNumber || ''}
                      onChange={(e) => {
                        const list = [...(formData.guarantees || [])];
                        list[idx].referenceNumber = e.target.value;
                        setFormData(prev => ({ ...prev, guarantees: list }));
                      }}
                      placeholder={isAr ? 'رقم الشيك / الخطاب' : 'Ref #' }
                      className="bg-background text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      onClick={() => {
                        const list = (formData.guarantees || []).filter((_, i) => i !== idx);
                        setFormData(prev => ({ ...prev, guarantees: list }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'مدير/مسؤول العقد:' : 'Contract Manager:'}</Label>
                  <Input
                    value={formData.contractManager || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractManager: e.target.value }))}
                    placeholder={isAr ? 'اسم المدير المسؤول' : 'Manager Name'}
                    className="mt-1.5 bg-background text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">{isAr ? 'المحاسب المتابع:' : 'Accountant Name:'}</Label>
                  <Input
                    value={formData.accountantName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountantName: e.target.value }))}
                    placeholder={isAr ? 'اسم المحاسب' : 'Accountant Name'}
                    className="mt-1.5 bg-background text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Summary & Confirm */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    {isAr ? 'العقد جاهز للاعتماد والإنشاء النهائي!' : 'Contract Ready to Save!'}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {isAr ? 'تم تطبيق الأقسام الديناميكية والضمانات بنجاح. انقر زر الحفظ أدناه.' : 'Review summary below.'}
                  </p>
                </div>
              </div>

              {/* Summary Sheet */}
              <div className="border-2 border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                <div className="bg-muted p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary text-primary-foreground rounded-xl">
                      {typeIcons[getContractTypeInfo(formData.contractType).icon] || <FileText className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          {isAr ? getContractTypeInfo(formData.contractType).labelAr : getContractTypeInfo(formData.contractType).labelEn}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">({formData.contractNumber})</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-foreground">{formData.partyName}</h3>
                    </div>
                  </div>
                  <Badge className={formData.contractCategory === 'revenue' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                    {getContractCategoryLabel(formData.contractCategory, isAr)}
                  </Badge>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">{isAr ? 'الطرف الثاني:' : 'Party:'}</span>
                    <p className="font-bold">{formData.partyName} ({formData.partyType})</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground">{isAr ? 'الفوترة والمالية الشاملة:' : 'Total Amount (VAT incl):'}</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatSAR(totalWithVat)} SAR <span className="text-[10px] font-normal text-muted-foreground">({formatSAR(formData.billingRate)} + {formData.vatPercentage}% VAT)</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground">{isAr ? 'فترة السريان:' : 'Validity:'}</span>
                    <p className="font-bold">
                      {formData.startDate} ⬅️ {formData.isOpenEnded ? (isAr ? 'مفتوح' : 'Open') : formData.endDate}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground">{isAr ? 'عدد الضمانات المسجلة:' : 'Guarantees:'}</span>
                    <p className="font-bold">
                      {(formData.guarantees || []).length} {isAr ? 'ضمانات' : 'Guarantees'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 bg-muted/40 border-t flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            disabled={isSubmitting}
            className="gap-2 text-xs"
          >
            {isAr ? (
              <>
                <ChevronRight className="h-4 w-4" />
                {step === 1 ? 'إلغاء' : 'الخطوة السابقة'}
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? 'Cancel' : 'Previous Step'}
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext || isSubmitting}
                className="gap-2 text-xs font-bold"
              >
                {isAr ? (
                  <>
                    الخطوة التالية
                    <ChevronLeft className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting
                  ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                  : mode === 'edit'
                  ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                  : (isAr ? 'تأكيد وإنشاء العقد الآن' : 'Create Contract Now')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
