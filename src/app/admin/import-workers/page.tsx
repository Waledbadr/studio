'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileJson, CheckCircle, XCircle, AlertCircle, Loader2, FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface ImportResult {
  success: boolean;
  message: string;
  results: {
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total: number;
    withEmployeeId: number;
    withIdNumber: number;
    withCompany: number;
    valid: number;
    invalid: number;
    duplicateEmployeeIds?: Map<string, number>;
  };
}

// دالة التحويل من ملف نصي إلى JSON
function parseTextToJSON(text: string): any[] {
  const lines = text.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('الملف فارغ');
  }

  // محاولة اكتشاف الفاصل
  const firstLine = lines[0];
  let delimiter: string | RegExp = '\t'; // افتراضيًا TSV
  
  if (firstLine.includes(',')) delimiter = ',';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.split(/\s+/).length > 1) delimiter = /\s+/;

  // تحليل السطر الأول كرؤوس
  const headers = (typeof delimiter === 'string' 
    ? firstLine.split(delimiter) 
    : firstLine.split(delimiter as RegExp)
  ).map(h => h.trim());

  // تحليل باقي الأسطر
  const workers: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = (typeof delimiter === 'string'
      ? line.split(delimiter)
      : line.split(delimiter as RegExp)
    ).map(v => v.trim());

    const worker: any = {
      name: '',
      employeeId: '',
      idNumber: '',
      company: '',
      nationality: '',
      role: 'Worker'
    };

    // رسم القيم على الحقول
    values.forEach((value, idx) => {
      if (!value) return;

      const header = headers[idx]?.toLowerCase() || '';
      
      // اكتشاف نوع الحقل
      if (header.includes('name') || header.includes('اسم')) {
        worker.name = value;
      } else if (header.includes('employee') || header.includes('موظف') || header.includes('رقم وظيفي')) {
        worker.employeeId = value;
      } else if (header.includes('national') || header.includes('هوية') || header.includes('id number')) {
        worker.idNumber = value;
      } else if (header.includes('company') || header.includes('شركة')) {
        worker.company = value;
      } else if (header.includes('nationality') || header.includes('جنسية')) {
        worker.nationality = value;
      } else if (header.includes('role') || header.includes('دور')) {
        worker.role = value;
      } else {
        // اكتشاف تلقائي بناءً على طول الرقم
        if (/^\d+$/.test(value)) {
          if (value.length <= 6) {
            worker.employeeId = value;
          } else if (value.length >= 8) {
            worker.idNumber = value;
          }
        } else if (!worker.name) {
          worker.name = value;
        }
      }
    });

    if (worker.name) {
      workers.push(worker);
    }
  }

  return workers;
}

// دالة التحقق من البيانات
function validateWorkersData(workers: any[]): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      total: workers.length,
      withEmployeeId: 0,
      withIdNumber: 0,
      withCompany: 0,
      valid: 0,
      invalid: 0,
      duplicateEmployeeIds: new Map()
    }
  };

  if (!Array.isArray(workers)) {
    result.valid = false;
    result.errors.push('البيانات يجب أن تكون مصفوفة من العمال');
    return result;
  }

  if (workers.length === 0) {
    result.valid = false;
    result.errors.push('لا توجد بيانات للاستيراد');
    return result;
  }

  const employeeIdMap = new Map<string, Set<string>>();

  workers.forEach((worker, index) => {
    const lineNum = index + 1;
    let hasError = false;

    // التحقق من الحقول المطلوبة
    if (!worker.name || worker.name.trim() === '') {
      result.errors.push(`السطر ${lineNum}: الاسم مطلوب`);
      hasError = true;
    }

    // التحقق من الأنماط
    if (worker.employeeId) {
      result.stats.withEmployeeId++;
      
      // تسجيل للتحقق من التكرار
      if (!employeeIdMap.has(worker.employeeId)) {
        employeeIdMap.set(worker.employeeId, new Set());
      }
      employeeIdMap.get(worker.employeeId)!.add(worker.idNumber || 'unknown');
      
      if (!/^\d+$/.test(worker.employeeId)) {
        result.warnings.push(`السطر ${lineNum}: الرقم الوظيفي يجب أن يكون أرقامًا فقط`);
      }
    }

    if (worker.idNumber) {
      result.stats.withIdNumber++;
      if (!/^\d{10}$/.test(worker.idNumber)) {
        result.warnings.push(`السطر ${lineNum}: رقم الهوية يجب أن يكون 10 أرقام`);
      }
    }

    if (worker.company) {
      result.stats.withCompany++;
    }

    if (hasError) {
      result.stats.invalid++;
    } else {
      result.stats.valid++;
    }
  });

  // فحص التكرار
  employeeIdMap.forEach((idNumbers, employeeId) => {
    if (idNumbers.size > 1) {
      result.stats.duplicateEmployeeIds!.set(employeeId, idNumbers.size);
      result.warnings.push(
        `الرقم الوظيفي ${employeeId} مكرر لـ ${idNumbers.size} أشخاص مختلفين (هذا مسموح إذا كانوا في شركات مختلفة)`
      );
    }
  });

  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}

export default function ImportWorkersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [isTextFile, setIsTextFile] = useState(false);
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
  const [defaultCompany, setDefaultCompany] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchCompanies = async () => {
      try {
        if (!db) return;
        const q = query(collection(db, 'companies'), orderBy('name'));
        const snap = await getDocs(q);
        setCompanies(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (e) {
        console.error("Failed to fetch companies", e);
      }
    };
    fetchCompanies();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const isTxt = selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.tsv');
    const isJson = selectedFile.name.endsWith('.json');
    
    if (!isTxt && !isJson) {
      toast({
        title: 'نوع ملف غير صحيح',
        description: 'يرجى رفع ملف JSON أو TXT فقط',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setValidationResult(null);
    setIsTextFile(isTxt);

    // Parse and preview
    try {
      const text = await selectedFile.text();
      let workers: any[];

      if (isTxt) {
        // تحويل تلقائي من نص إلى JSON
        setValidating(true);
        workers = parseTextToJSON(text);
        setParsedData(workers);
        toast({
          title: '✅ تم التحويل بنجاح',
          description: `تم تحويل ${workers.length} سجل من ملف نصي إلى JSON`,
        });
      } else {
        // ملف JSON
        const data = JSON.parse(text);
        workers = Array.isArray(data) ? data : (data.workers || []);
        setParsedData(workers);
      }

      // معاينة أول 10 سجلات
      setPreviewData(workers.slice(0, 10));
      
      // التحقق التلقائي
      const validation = validateWorkersData(workers);
      setValidationResult(validation);
      
    } catch (error) {
      toast({
        title: 'خطأ في قراءة الملف',
        description: error instanceof Error ? error.message : 'تأكد من صيغة الملف',
        variant: 'destructive',
      });
      setFile(null);
      setPreviewData(null);
      setParsedData(null);
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData || !validationResult?.valid) {
      toast({
        title: 'لا يمكن الاستيراد',
        description: 'يرجى إصلاح الأخطاء أولاً',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Apply default company
      const dataToImport = parsedData.map(w => ({
        ...w,
        company: w.company || defaultCompany || ''
      }));

      const response = await fetch('/api/workers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToImport),
      });

      const result: ImportResult = await response.json();

      if (response.ok && result.success) {
        setResult(result);
        toast({
          title: '✅ تم الاستيراد بنجاح',
          description: result.message,
        });
      } else {
        throw new Error(result.message || 'فشل الاستيراد');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: 'فشل الاستيراد',
        description: errorMsg,
        variant: 'destructive',
      });
      setResult({
        success: false,
        message: errorMsg,
        results: {
          total: 0,
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: [errorMsg],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setValidationResult(null);
    setPreviewData(null);
    setParsedData(null);
    setIsTextFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">استيراد بيانات العمال</h1>
        <p className="text-muted-foreground">
          رفع ملف JSON أو TXT واستيراده إلى قاعدة البيانات مع التحويل والتحقق التلقائي
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            رفع ملف البيانات
          </CardTitle>
          <CardDescription>
            يدعم ملفات JSON أو ملفات نصية (CSV, TSV) مع التحويل التلقائي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.csv,.tsv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={validating || loading}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${
                (validating || loading) ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {validating ? (
                <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
              ) : (
                <FileJson className="w-12 h-12 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {validating ? 'جارٍ التحويل...' : 'اضغط لاختيار ملف أو اسحبه هنا'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JSON, TXT, CSV, TSV (حجم أقصى: 10MB)
                </p>
              </div>
            </label>
          </div>

          {file && (
            <Alert>
              {isTextFile ? <FileText className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span>الملف المحدد: <strong>{file.name}</strong></span>
                    {isTextFile && (
                      <Badge variant="outline" className="mr-2">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        تم التحويل تلقائيًا
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetImport}
                    disabled={loading}
                  >
                    إلغاء
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* تعليمات صيغة الملف */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">صيغة الملف المتوقعة:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>JSON:</strong> مصفوفة من العمال مع الحقول: name, employeeId, idNumber, company, nationality</li>
                <li><strong>TXT/CSV:</strong> سطر للرؤوس ثم سطر لكل عامل (مفصول بفاصلة أو تاب أو مسافات)</li>
                <li><strong>employeeId:</strong> رقم وظيفي قصير (مثل: 40097) - يمكن تكراره في شركات مختلفة</li>
                <li><strong>idNumber:</strong> رقم الهوية الوطنية (10 أرقام مثل: 2059537999)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              نتيجة التحقق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{validationResult.stats.total}</div>
                <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validationResult.stats.valid}</div>
                <div className="text-sm text-muted-foreground">صالح</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{validationResult.stats.invalid}</div>
                <div className="text-sm text-muted-foreground">غير صالح</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{validationResult.stats.withEmployeeId}</div>
                <div className="text-sm text-muted-foreground">لديه رقم وظيفي</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{validationResult.stats.withIdNumber}</div>
                <div className="text-sm text-muted-foreground">لديه رقم هوية</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{validationResult.stats.withCompany}</div>
                <div className="text-sm text-muted-foreground">لديه شركة</div>
              </div>
            </div>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">أخطاء ({validationResult.errors.length}):</p>
                  <ul className="text-sm space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                    {validationResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {validationResult.errors.length > 10 && (
                      <li className="font-medium">و {validationResult.errors.length - 10} خطأ آخر...</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">تحذيرات ({validationResult.warnings.length}):</p>
                  <ul className="text-sm space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                    {validationResult.warnings.slice(0, 10).map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                    {validationResult.warnings.length > 10 && (
                      <li className="font-medium">و {validationResult.warnings.length - 10} تحذير آخر...</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Default Company Selection */}
      {parsedData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إعدادات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label>الشركة الافتراضية (للعمال الذين ليس لديهم شركة)</Label>
              <Select value={defaultCompany} onValueChange={(val) => setDefaultCompany(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر شركة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- بدون --</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewData && previewData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>معاينة البيانات (أول 10 سجلات)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-right">
                    <th className="p-2">الاسم</th>
                    <th className="p-2">الرقم الوظيفي</th>
                    <th className="p-2">رقم الهوية</th>
                    <th className="p-2">الشركة</th>
                    <th className="p-2">الجنسية</th>
                    <th className="p-2">الدور</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((worker, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2">{worker.name}</td>
                      <td className="p-2">
                        {worker.employeeId ? (
                          <Badge variant="outline">{worker.employeeId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {worker.idNumber ? (
                          <Badge variant="secondary">{worker.idNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">{worker.company || defaultCompany || '-'}</td>
                      <td className="p-2">{worker.nationality || worker.nationaliy || '-'}</td>
                      <td className="p-2">{worker.role || 'Worker'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {parsedData && (
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleImport}
            disabled={loading || !validationResult?.valid}
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جارٍ الاستيراد...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                استيراد {parsedData.length} عامل
              </>
            )}
          </Button>
          <Button
            onClick={resetImport}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            إعادة تعيين
          </Button>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              نتيجة الاستيراد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.results.total}</div>
                <div className="text-sm text-muted-foreground">إجمالي</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.results.imported}</div>
                <div className="text-sm text-muted-foreground">تم الاستيراد</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.results.updated}</div>
                <div className="text-sm text-muted-foreground">تم التحديث</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.results.skipped}</div>
                <div className="text-sm text-muted-foreground">تم التخطي</div>
              </div>
            </div>

            {result.results.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">أخطاء:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                    {result.results.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={resetImport} className="w-full">
              استيراد ملف آخر
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تنسيق الملف المطلوب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="mb-2 font-semibold">1. ملف JSON:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs" dir="ltr">
{`[
  {
    "name": "أحمد محمد",
    "employeeId": "40097",
    "idNumber": "2059537999",
    "company": "الشركة الأولى",
    "nationality": "سعودي",
    "role": "Worker"
  }
]`}
            </pre>
          </div>

          <div className="text-sm">
            <p className="mb-2 font-semibold">2. ملف نصي (CSV/TSV):</p>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs" dir="ltr">
{`name,employeeId,idNumber,company,nationality,role
أحمد محمد,40097,2059537999,الشركة الأولى,سعودي,Worker
محمد علي,40098,2059538000,الشركة الثانية,مصري,Supervisor`}
            </pre>
          </div>

          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">ملاحظات:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>name</strong>: إجباري - اسم العامل</li>
              <li><strong>employeeId</strong>: اختياري - الرقم الوظيفي (يمكن تكراره في شركات مختلفة)</li>
              <li><strong>idNumber</strong>: اختياري - رقم الهوية الوطنية (10 أرقام)</li>
              <li><strong>company</strong>: اختياري - الشركة (لتمييز العمال بنفس الرقم الوظيفي)</li>
              <li><strong>nationality</strong>: اختياري - الجنسية</li>
              <li><strong>role</strong>: اختياري - الدور (Worker / Supervisor / Engineer)</li>
              <li>الملفات النصية يتم تحويلها تلقائيًا إلى JSON مع اكتشاف الحقول</li>
              <li>سيتم التحقق من صحة البيانات قبل الاستيراد</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
