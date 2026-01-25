"use client";

import { useState, useEffect } from "react";
import { useAccommodation, Worker } from "@/context/accommodation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserLanguage } from "@/lib/i18n-helpers";

// Common nationalities in Saudi Arabia
const NATIONALITIES = [
  "Saudi",
  "Indian",
  "Pakistani",
  "Bangladeshi",
  "Filipino",
  "Egyptian",
  "Yemeni",
  "Syrian",
  "Jordanian",
  "Sudanese",
  "Indonesian",
  "Sri Lankan",
  "Nepali",
  "Ethiopian",
  "Other"
].sort();

interface AddWorkerDialogProps {
  trigger?: React.ReactNode;
  onWorkerAdded?: (worker: Worker) => void;
  defaultName?: string;
  defaultEmployeeId?: string;
  defaultIdNumber?: string;
}

export function AddWorkerDialog({ trigger, onWorkerAdded, defaultName = "", defaultEmployeeId = "", defaultIdNumber = "" }: AddWorkerDialogProps) {
  const { saveWorker, companies } = useAccommodation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('en');

  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    employeeId: "",
    nationaliy: "",
    company: "",
    role: "Worker" as "Worker" | "Supervisor" | "Engineer",
  });

  // Get user language on mount
  useEffect(() => {
    setLang(getUserLanguage());
  }, []);

  // Smart detection: Populate appropriate field based on search query
  useEffect(() => {
    if (open) {
      const updates: any = {};
      
      // If defaultEmployeeId provided, use it for employeeId
      if (defaultEmployeeId) {
        updates.employeeId = defaultEmployeeId;
      }
      // If defaultIdNumber provided (10 digits), use it for idNumber
      else if (defaultIdNumber && /^\d{10}$/.test(defaultIdNumber)) {
        updates.idNumber = defaultIdNumber;
      }
      // If defaultName is a 10-digit number, treat as ID number
      else if (defaultName && /^\d{10}$/.test(defaultName)) {
        updates.idNumber = defaultName;
        updates.name = ""; // Don't populate name
      }
      // If defaultName is numeric (but not 10 digits), treat as employee ID
      else if (defaultName && /^\d+$/.test(defaultName)) {
        updates.employeeId = defaultName;
        updates.name = ""; // Don't populate name
      }
      // Otherwise, it's a name
      else if (defaultName) {
        updates.name = defaultName;
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [open, defaultName, defaultEmployeeId, defaultIdNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      toast({
        title: lang === 'ar' ? "حقل مطلوب" : "Required Field",
        description: lang === 'ar' ? "الاسم مطلوب" : "Name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.employeeId?.trim()) {
      toast({
        title: lang === 'ar' ? "حقل مطلوب" : "Required Field",
        description: lang === 'ar' ? "رقم الموظف مطلوب" : "Employee ID is required",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.idNumber && !/^\d{10}$/.test(formData.idNumber)) {
      toast({
        title: lang === 'ar' ? "خطأ في الإدخال" : "Validation Error",
        description: lang === 'ar' ? "رقم الهوية/الإقامة يجب أن يكون 10 أرقام بالضبط" : "ID/Iqama must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newWorker: Worker = {
        id: `w_${Date.now()}`,
        ...formData,
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        idNumber: formData.idNumber.trim(),
      };
      
      await saveWorker(newWorker);
      
      toast({
        title: lang === 'ar' ? "نجح" : "Success",
        description: lang === 'ar' ? "تم إضافة العامل بنجاح" : "Worker added successfully",
      });
      
      if (onWorkerAdded) {
        onWorkerAdded(newWorker);
      }
      
      setOpen(false);
      // Reset form
      setFormData({
        name: "",
        idNumber: "",
        employeeId: "",
        nationaliy: "",
        company: "",
        role: "Worker",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: lang === 'ar' ? "خطأ" : "Error",
        description: lang === 'ar' ? "فشل في إضافة العامل" : "Failed to add worker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8">
            <UserPlus className="h-3.5 w-3.5 mr-2" />
            {lang === 'ar' ? 'إضافة عامل' : 'Add Worker'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            {lang === 'ar' ? 'إضافة عامل جديد' : 'Add New Worker'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {lang === 'ar' 
              ? 'املأ البيانات التالية لإضافة عامل جديد إلى النظام' 
              : 'Fill in the details below to add a new worker to the system'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 py-6">
            
            {/* Essential Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {lang === 'ar' ? 'معلومات أساسية' : 'Essential Information'}
              </h3>
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                  {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === 'ar' ? 'أحمد محمد علي' : 'Ahmed Mohammed Ali'}
                  required
                  className="h-12 text-base"
                  autoComplete="name"
                />
              </div>

              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium flex items-center gap-1">
                  {lang === 'ar' ? 'رقم الموظف' : 'Employee ID'}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder={lang === 'ar' ? '12345' : '12345'}
                  required
                  className="h-12 text-base font-mono"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                  {lang === 'ar' ? 'رقم إجباري للتعريف' : 'Required for identification'}
                </p>
              </div>
            </div>

            {/* Identification Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {lang === 'ar' ? 'بيانات الهوية' : 'Identification'}
              </h3>
              
              {/* ID/Iqama Number */}
              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-sm font-medium">
                  {lang === 'ar' ? 'رقم الهوية / الإقامة' : 'National ID / Iqama'}
                </Label>
                <div className="relative">
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, idNumber: value });
                    }}
                    placeholder="1234567890"
                    maxLength={10}
                    className={cn(
                      "h-12 text-base font-mono pr-16",
                      formData.idNumber && formData.idNumber.length === 10 && "border-green-500 focus:border-green-500"
                    )}
                    autoComplete="off"
                  />
                  {formData.idNumber && (
                    <div className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded",
                      formData.idNumber.length === 10 
                        ? "bg-green-100 text-green-700" 
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {formData.idNumber.length}/10
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar' 
                    ? '10 أرقام بالضبط (اختياري)' 
                    : '10 digits exactly (optional)'}
                </p>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {lang === 'ar' ? 'تفاصيل إضافية' : 'Additional Details'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nationality */}
                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-sm font-medium">
                    {lang === 'ar' ? 'الجنسية' : 'Nationality'}
                  </Label>
                  <Select 
                    value={formData.nationaliy} 
                    onValueChange={(val) => setFormData({ ...formData, nationaliy: val })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={lang === 'ar' ? 'اختر...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {NATIONALITIES.map((nationality) => (
                        <SelectItem key={nationality} value={nationality}>
                          {nationality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    {lang === 'ar' ? 'المسمى الوظيفي' : 'Job Role'}
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Worker">
                        {lang === 'ar' ? 'عامل' : 'Worker'}
                      </SelectItem>
                      <SelectItem value="Supervisor">
                        {lang === 'ar' ? 'مشرف' : 'Supervisor'}
                      </SelectItem>
                      <SelectItem value="Engineer">
                        {lang === 'ar' ? 'مهندس' : 'Engineer'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  {lang === 'ar' ? 'الشركة' : 'Company'}
                </Label>
                <Select 
                  value={formData.company} 
                  onValueChange={(val) => setFormData({ ...formData, company: val })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={lang === 'ar' ? 'اختر الشركة...' : 'Select company...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.name}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-3 pt-6 border-t mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1 h-11"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="flex-1 h-11"
            onClick={handleSubmit}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading 
              ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (lang === 'ar' ? 'حفظ العامل' : 'Save Worker')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
