"use client";

import React, { useState } from 'react';
import { useAccommodation } from '@/context/accommodation-context';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type ImportRow = {
  C_Number: string;
  'Employee Name': string;
  'W Type': string;
  Iqama_No: string;
  Nationality: string;
  Company: string;
};

export default function ImportWorkersPage() {
  const { saveWorker, workers } = useAccommodation();
  const { toast } = useToast();
  const [fileContent, setFileContent] = useState('');
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });

  // Parse TSV/CSV content
  const parseFile = (content: string) => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      toast({ title: 'خطأ', description: 'الملف فارغ أو لا يحتوي على بيانات', variant: 'destructive' });
      return;
    }

    // Parse header
    const headerLine = lines[0];
    const delimiter = headerLine.includes('\t') ? '\t' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim());

    // Parse data rows
    const data: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      if (values.length < headers.length) continue; // Skip incomplete rows

      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      data.push(row as ImportRow);
    }

    setParsedData(data);
    toast({ title: 'تم التحليل', description: `تم تحليل ${data.length} سطر من البيانات` });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      parseFile(content);
    };
    reader.readAsText(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const content = e.clipboardData.getData('text');
    setFileContent(content);
    parseFile(content);
  };

  const importWorkers = async () => {
    if (!saveWorker) {
      toast({ title: 'خطأ', description: 'Firebase غير مهيأ', variant: 'destructive' });
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of parsedData) {
      try {
        // Generate unique ID
        const workerId = `w${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Check if worker already exists by idNumber or employeeId
        const existingByIqama = workers.find((w: any) => w.idNumber === row.Iqama_No && row.Iqama_No);
        const existingByEmpId = workers.find((w: any) => w.employeeId === row.C_Number && w.company === row.Company);

        if (existingByIqama) {
          errors.push(`${row['Employee Name']} - موجود مسبقاً (رقم هوية: ${row.Iqama_No})`);
          failed++;
          continue;
        }

        if (existingByEmpId) {
          errors.push(`${row['Employee Name']} - موجود مسبقاً (رقم موظف: ${row.C_Number} في ${row.Company})`);
          failed++;
          continue;
        }

        await saveWorker({
          id: workerId,
          name: row['Employee Name'],
          employeeId: row.C_Number,
          idNumber: row.Iqama_No,
          nationaliy: row.Nationality,
          company: row.Company,
          role: row['W Type'] === 'Supervisor' ? 'Supervisor' : row['W Type'] === 'Engineer' ? 'Engineer' : 'Worker'
        });

        success++;
      } catch (error: any) {
        failed++;
        errors.push(`${row['Employee Name']} - ${error.message}`);
      }
    }

    setResults({ success, failed, errors });
    setImporting(false);
    toast({
      title: 'اكتمل الاستيراد',
      description: `نجح: ${success} | فشل: ${failed}`,
      variant: success > 0 ? 'default' : 'destructive'
    });
  };

  const downloadTemplate = () => {
    const template = `C_Number\tEmployee Name\tW Type\tIqama_No\tNationality\tCompany
37433\tAkram Naimu Deen\tWorkers\t2326188378\tIndian\tSACODECO
33023\tMohamed El Shawadfi\tWorkers\t2286381633\tEgypt\tSACODECO
20931\tمو أرمان مينودين\tWorkers\t\tIndian\tFAST`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers-template.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">استيراد العمال</h1>
          <p className="text-muted-foreground mt-1">Import Workers from Excel/CSV</p>
        </div>
        <Link href="/accommodation/workers" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          رجوع للقائمة
        </Link>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-2">كيفية الاستيراد:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>افتح ملف Excel الخاص بك</li>
              <li>حدد الأعمدة: C_Number, Employee Name, W Type, Iqama_No, Nationality, Company</li>
              <li>انسخ البيانات (Ctrl+C) والصقها في المربع أدناه (Ctrl+V)</li>
              <li>أو ارفع ملف TXT/CSV مباشرة</li>
              <li>اضغط "استيراد العمال"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Template Download */}
      <div className="flex gap-3">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Download className="h-4 w-4" />
          تحميل نموذج Template
        </button>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 cursor-pointer">
          <Upload className="h-4 w-4" />
          رفع ملف Upload File
          <input
            type="file"
            accept=".txt,.csv,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Data Input */}
      <div className="bg-card border border-border rounded-lg p-4">
        <label className="block text-sm font-semibold text-foreground mb-2">
          <FileSpreadsheet className="h-4 w-4 inline mr-2" />
          الصق البيانات من Excel (Paste from Excel)
        </label>
        <textarea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          onPaste={handlePaste}
          placeholder="C_Number    Employee Name    W Type    Iqama_No    Nationality    Company
37433    Akram Naimu Deen    Workers    2326188378    Indian    SACODECO
33023    Mohamed El Shawadfi    Workers    2286381633    Egypt    SACODECO"
          className="w-full h-48 p-3 border border-border rounded-md bg-background text-foreground font-mono text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => parseFile(fileContent)}
            disabled={!fileContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            تحليل البيانات Parse Data
          </button>
          <button
            onClick={() => { setFileContent(''); setParsedData([]); setResults({ success: 0, failed: 0, errors: [] }); }}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent"
          >
            مسح Clear
          </button>
        </div>
      </div>

      {/* Parsed Data Preview */}
      {parsedData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">معاينة البيانات ({parsedData.length} عامل)</h3>
            <button
              onClick={importWorkers}
              disabled={importing}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? 'جارٍ الاستيراد...' : 'استيراد العمال Import'}
              {!importing && <Upload className="h-4 w-4" />}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right p-2">#</th>
                  <th className="text-right p-2">رقم الموظف</th>
                  <th className="text-right p-2">الاسم</th>
                  <th className="text-right p-2">رقم الهوية</th>
                  <th className="text-right p-2">الجنسية</th>
                  <th className="text-right p-2">الشركة</th>
                  <th className="text-right p-2">الدور</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/30">
                    <td className="p-2 text-muted-foreground">{idx + 1}</td>
                    <td className="p-2 font-mono">{row.C_Number}</td>
                    <td className="p-2 font-medium">{row['Employee Name']}</td>
                    <td className="p-2 font-mono text-xs">{row.Iqama_No || '-'}</td>
                    <td className="p-2">{row.Nationality}</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                        {row.Company}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">{row['W Type']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                عرض أول 10 صفوف فقط • Showing first 10 rows only
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Results */}
      {(results.success > 0 || results.failed > 0) && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold text-foreground">نتائج الاستيراد</h3>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">{results.success} نجح</span>
            </div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">{results.failed} فشل</span>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">الأخطاء:</p>
              <div className="space-y-1 max-h-48 overflow-auto">
                {results.errors.map((err, idx) => (
                  <div key={idx} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
                    {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
