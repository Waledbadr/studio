'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccommodation, type Invoice, type AccommodationHistory } from '@/context/accommodation-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Building2, Calendar, Users, DollarSign, FileText } from 'lucide-react';
import { format, parseISO, differenceInDays, isWithinInterval, max, min, startOfDay, endOfDay } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

type WorkerInvoiceDetail = {
  workerId: string;
  name: string;
  employeeId?: string;
  idNumber?: string;
  nationality?: string;
  roomName: string;
  buildingName?: string;
  floorName?: string;
  checkInDate: string;
  checkOutDate: string | null;
  effectiveCheckIn: string;
  effectiveCheckOut: string;
  days: number;
  amount: number;
};

export default function InvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  
  const {
    invoices,
    companies,
    residences,
    workers,
    occupants,
    accommodationHistory,
    contracts,
    getHistoryByDateRange,
  } = useAccommodation();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give context time to load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const invoice = useMemo(() => {
    return invoices.find(inv => inv.id === invoiceId);
  }, [invoices, invoiceId]);

  const company = useMemo(() => {
    if (!invoice) return null;
    return companies.find(c => c.id === invoice.companyId);
  }, [companies, invoice]);

  const residence = useMemo(() => {
    if (!invoice) return null;
    return residences.find(r => r.id === invoice.residenceId);
  }, [residences, invoice]);

  const contract = useMemo(() => {
    if (!invoice) return null;
    return contracts.find(c => c.id === invoice.contractId);
  }, [contracts, invoice]);

  // Get detailed worker breakdown with room information
  const workerDetails = useMemo((): WorkerInvoiceDetail[] => {
    if (!invoice || !company) return [];

    const startDate = new Date(invoice.startDate);
    const endDate = new Date(invoice.endDate);

    // Get all history for the period
    const periodHistory = getHistoryByDateRange(invoice.startDate, invoice.endDate);

    // Find workers for this company
    const companyWorkers = workers.filter(w => 
      w.company === company.name || w.company === company.id
    );

    const details: WorkerInvoiceDetail[] = [];

    for (const worker of companyWorkers) {
      // Get worker movements in this residence during the period
      const workerMovements = periodHistory.filter(h => 
        h.workerId === worker.id && 
        h.residenceId === invoice.residenceId
      ).sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime());

      // Check current occupancy
      const currentOccupancy = occupants.find(o => 
        o.workerId === worker.id && o.residenceId === invoice.residenceId && !o.until
      );

      // Determine initial state and room info
      let isInside = false;
      let roomName = '';
      let buildingName = '';
      let floorName = '';
      let originalCheckIn = '';
      let originalCheckOut: string | null = null;

      if (workerMovements.length > 0) {
        const firstEvent = workerMovements[0];
        const isTransferOut = firstEvent.actionType === 'TRANSFER' && firstEvent.fromResidenceId === invoice.residenceId;
        
        if (firstEvent.actionType === 'CHECK_OUT' || isTransferOut) {
          isInside = true;
          roomName = firstEvent.roomName || firstEvent.fromRoomName || '';
          buildingName = firstEvent.buildingName || '';
          floorName = firstEvent.floorName || '';
        }
      } else if (currentOccupancy) {
        if (new Date(currentOccupancy.since) < startDate) {
          isInside = true;
        }
      }

      // Find room info from movements or occupancy
      const checkInEvent = workerMovements.find(h => 
        h.actionType === 'CHECK_IN' || 
        (h.actionType === 'TRANSFER' && h.toResidenceId === invoice.residenceId)
      );
      
      const checkOutEvent = workerMovements.find(h => 
        h.actionType === 'CHECK_OUT' || 
        (h.actionType === 'TRANSFER' && h.fromResidenceId === invoice.residenceId)
      );

      if (checkInEvent) {
        roomName = checkInEvent.roomName || checkInEvent.toRoomName || roomName;
        buildingName = checkInEvent.buildingName || buildingName;
        floorName = checkInEvent.floorName || floorName;
        originalCheckIn = checkInEvent.actionDate;
      }

      if (checkOutEvent) {
        originalCheckOut = checkOutEvent.actionDate;
      }

      if (!roomName && currentOccupancy) {
        // Try to get room name from residence structure
        const res = residences.find(r => r.id === invoice.residenceId);
        if (res) {
          for (const building of res.buildings || []) {
            for (const floor of building.floors || []) {
              const room = floor.rooms?.find(r => r.id === currentOccupancy.roomId);
              if (room) {
                roomName = room.name || currentOccupancy.roomId;
                buildingName = building.name || '';
                floorName = floor.name || '';
                break;
              }
            }
            if (roomName) break;
          }
        }
        if (!roomName) roomName = currentOccupancy.roomId;
        originalCheckIn = currentOccupancy.since;
        originalCheckOut = currentOccupancy.until || null;
      }

      // Calculate days
      let days = 0;
      let currentStatus = isInside;
      let lastDate = startDate;

      for (const event of workerMovements) {
        const eventDate = new Date(event.actionDate);
        if (eventDate < startDate) continue;
        if (eventDate > endDate) break;

        if (currentStatus) {
          const diff = differenceInDays(eventDate, lastDate);
          days += diff;
        }

        const isTransferIn = event.actionType === 'TRANSFER' && event.toResidenceId === invoice.residenceId;

        if (event.actionType === 'CHECK_IN' || isTransferIn) {
          currentStatus = true;
        } else {
          currentStatus = false;
        }
        lastDate = eventDate;
      }

      if (currentStatus) {
        const diff = differenceInDays(endDate, lastDate) + 1; // +1 to include last day
        days += diff;
      }

      if (days > 0) {
        const rate = contract?.ratePerPersonPerMonth || invoice.ratePerPerson || 0;
        const amount = (rate / 30) * days;

        // Calculate effective dates within the billing period
        const workerCheckIn = originalCheckIn ? new Date(originalCheckIn) : startDate;
        const workerCheckOut = originalCheckOut ? new Date(originalCheckOut) : endDate;
        const effectiveStart = workerCheckIn < startDate ? startDate : workerCheckIn;
        const effectiveEnd = workerCheckOut > endDate ? endDate : workerCheckOut;

        details.push({
          workerId: worker.id,
          name: worker.name,
          employeeId: worker.employeeId,
          idNumber: worker.idNumber,
          nationality: worker.nationaliy,
          roomName,
          buildingName,
          floorName,
          checkInDate: originalCheckIn || startDate.toISOString(),
          checkOutDate: originalCheckOut,
          effectiveCheckIn: effectiveStart.toISOString(),
          effectiveCheckOut: effectiveEnd.toISOString(),
          days,
          amount: Math.round(amount * 100) / 100,
        });
      }
    }

    return details.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [invoice, company, workers, occupants, accommodationHistory, residences, contract, getHistoryByDateRange]);

  // Try to parse breakdown from notes if context data is not available
  const fallbackBreakdown = useMemo(() => {
    if (workerDetails.length > 0 || !invoice?.notes) return [];
    try {
      const parsed = JSON.parse(invoice.notes);
      if (Array.isArray(parsed)) {
        return parsed.map((w: any) => ({
          workerId: w.workerId || '',
          name: w.name || '',
          employeeId: '',
          idNumber: '',
          nationality: '',
          roomName: 'N/A',
          buildingName: '',
          floorName: '',
          checkInDate: invoice.startDate,
          checkOutDate: invoice.endDate,
          effectiveCheckIn: invoice.startDate,
          effectiveCheckOut: invoice.endDate,
          days: w.days || 0,
          amount: Number(w.amount) || 0,
        }));
      }
    } catch (e) {}
    return [];
  }, [invoice, workerDetails]);

  const displayDetailsUnsorted = workerDetails.length > 0 ? workerDetails : fallbackBreakdown;
  
  // Sort: 1) Workers still in residence first, 2) Checked-out workers at bottom, 3) Then by room number ascending
  const displayDetails = useMemo(() => {
    if (!invoice) return displayDetailsUnsorted;
    
    const invoiceEndDate = new Date(invoice.endDate);
    
    return [...displayDetailsUnsorted].sort((a, b) => {
      // Check if worker is still in residence (checkout date is null or after invoice end date)
      const aStillIn = !a.checkOutDate || new Date(a.checkOutDate) >= invoiceEndDate;
      const bStillIn = !b.checkOutDate || new Date(b.checkOutDate) >= invoiceEndDate;
      
      // Workers still in residence come first
      if (aStillIn && !bStillIn) return -1;
      if (!aStillIn && bStillIn) return 1;
      
      // Then sort by room number
      const extractNumber = (name: string) => {
        const match = name?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 999999;
      };
      return extractNumber(a.roomName) - extractNumber(b.roomName);
    });
  }, [displayDetailsUnsorted, invoice]);

  const handlePrint = () => window.print();

  const formatDate = (date: string | null, locale: 'ar' | 'en' = 'en') => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: locale === 'ar' ? arSA : enUS });
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested invoice could not be found.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const totalAmount = displayDetails.reduce((sum, w) => sum + w.amount, 0);
  const totalDays = displayDetails.reduce((sum, w) => sum + w.days, 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white print:min-h-0">
      {/* Print Styles */}
      <style jsx global>{`
        /* Force readable colors on screen (dark mode fix) */
        .invoice-content {
          color: #111827 !important;
        }
        .invoice-content * {
          color: inherit !important;
        }
        .invoice-content .text-gray-500 {
          color: #6b7280 !important;
        }
        .invoice-content .text-gray-600 {
          color: #4b5563 !important;
        }
        .invoice-content .text-gray-700 {
          color: #374151 !important;
        }
        .invoice-content .text-gray-900 {
          color: #111827 !important;
        }
        .invoice-content .text-green-700 {
          color: #15803d !important;
        }
        .invoice-content .text-blue-600 {
          color: #2563eb !important;
        }
        .invoice-content .text-blue-900 {
          color: #1e3a8a !important;
        }
        .invoice-content .bg-gray-100,
        .invoice-content .bg-gray-200 {
          background-color: #f3f4f6 !important;
        }
        .invoice-content .bg-gray-50 {
          background-color: #f9fafb !important;
        }
        .invoice-content .bg-blue-50 {
          background-color: #eff6ff !important;
        }
        .invoice-content .bg-green-50 {
          background-color: #f0fdf4 !important;
        }
        .invoice-content .border-gray-200,
        .invoice-content .border-gray-300 {
          border-color: #d1d5db !important;
        }
        
        @page {
          size: A4 portrait;
          margin: 5mm;
        }
        
        @media print {
          html, body {
            height: auto !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 10px !important;
            line-height: 1.2 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          /* Remove any dark mode backgrounds */
          .dark, [data-theme="dark"], body.dark {
            background: white !important;
          }
          
          /* Remove sidebar and layout elements */
          aside, nav, header:not(.print-header), footer {
            display: none !important;
          }
          
          /* Ensure main content fills the page */
          main, .main-content {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-page {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 3mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          
          /* Hide any extra content after invoice */
          .min-h-screen {
            min-height: auto !important;
            height: auto !important;
            background: white !important;
          }
          
          .print-header {
            padding-bottom: 3mm !important;
            margin-bottom: 3mm !important;
          }
          
          .print-header-logo {
            font-size: 18px !important;
            font-weight: 800 !important;
          }
          
          .print-header-title {
            font-size: 14px !important;
            font-weight: 700 !important;
          }
          
          .print-info-grid {
            font-size: 9px !important;
            gap: 2mm !important;
          }
          
          .print-info-label {
            font-size: 8px !important;
            color: #6b7280 !important;
          }
          
          .print-info-value {
            font-size: 10px !important;
            font-weight: 600 !important;
            color: #111827 !important;
          }
          
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8px !important;
          }
          
          .print-table thead th {
            background: #f3f4f6 !important;
            color: #111827 !important;
            font-weight: 700 !important;
            font-size: 7px !important;
            padding: 2px 3px !important;
            border: 0.5px solid #d1d5db !important;
            text-align: center !important;
            white-space: nowrap !important;
          }
          
          .print-table tbody td {
            padding: 1.5px 2px !important;
            border: 0.5px solid #e5e7eb !important;
            font-size: 7.5px !important;
            color: #111827 !important;
            vertical-align: middle !important;
          }
          
          .print-table tbody tr:nth-child(even) {
            background: #fafafa !important;
          }
          
          .print-table .text-right {
            text-align: right !important;
          }
          
          .print-table .text-center {
            text-align: center !important;
          }
          
          .print-summary {
            margin-top: 3mm !important;
            padding: 2mm 3mm !important;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            font-size: 9px !important;
          }
          
          .print-summary-title {
            font-size: 11px !important;
            font-weight: 700 !important;
          }
          
          .print-footer {
            margin-top: 4mm !important;
            padding-top: 3mm !important;
            border-top: 1px solid #e2e8f0 !important;
            font-size: 8px !important;
          }
          
          .print-signatures {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10mm !important;
            margin-top: 8mm !important;
          }
          
          .print-signature-box {
            text-align: center !important;
          }
          
          .print-signature-line {
            border-top: 1px solid #374151 !important;
            width: 50mm !important;
            margin: 8mm auto 2mm !important;
          }
          
          .print-signature-label {
            font-size: 8px !important;
            color: #6b7280 !important;
          }
        }
      `}</style>

      {/* Screen Toolbar */}
      <div className="no-print p-4 max-w-[210mm] mx-auto flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      {/* Printable Invoice */}
      <div className="invoice-content print-page max-w-[210mm] mx-auto bg-white shadow-xl p-6 m-4 print:m-0 print:shadow-none rounded-lg print:rounded-none">
        
        {/* Header */}
        <div className="print-header border-b-2 border-gray-800 pb-3 mb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="print-header-logo text-2xl font-bold text-gray-900">
                SACODECO HOUSING
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Worker Accommodation Management
              </div>
            </div>
            <div className="text-right">
              <div className="print-header-title text-xl font-bold text-gray-900">
                فاتورة تسكين عمالة
              </div>
              <div className="text-sm text-gray-600">
                WORKER ACCOMMODATION INVOICE
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-end">
            <div className="bg-gray-100 px-3 py-1.5 rounded text-sm">
              <span className="text-gray-500">Invoice #:</span>
              <span className="font-bold text-gray-900 ml-2 font-mono">{invoice.id.split('_').slice(-2).join('-')}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Generated</div>
              <div className="font-semibold text-gray-900">
                {formatDate(invoice.generatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Company & Residence Info */}
        <div className="print-info-grid grid grid-cols-2 gap-4 mb-3 pb-2 border-b border-gray-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
              <Building2 className="h-4 w-4" />
              <span>Company / الشركة</span>
            </div>
            <div className="print-info-value text-base font-bold text-gray-900">
              {company?.nameAr || company?.name || invoice.companyId}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
              <Building2 className="h-4 w-4" />
              <span>Residence / السكن</span>
            </div>
            <div className="print-info-value text-base font-bold text-gray-900">
              {residence?.name || invoice.residenceId}
            </div>
            {residence?.city && residence.city !== residence?.name && (
              <div className="text-xs text-gray-500">{residence.city}</div>
            )}
          </div>
        </div>

        {/* Billing Period Info */}
        <div className="print-info-grid grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-gray-200 text-center">
          <div className="bg-blue-50 p-1.5 rounded">
            <div className="print-info-label text-[10px] text-blue-600 uppercase">Billing Period</div>
            <div className="print-info-value text-sm font-bold text-blue-900">{invoice.month}</div>
          </div>
          <div className="bg-gray-50 p-1.5 rounded">
            <div className="print-info-label text-[10px] text-gray-600 uppercase">From</div>
            <div className="print-info-value text-sm font-bold">{formatDate(invoice.startDate)}</div>
          </div>
          <div className="bg-gray-50 p-1.5 rounded">
            <div className="print-info-label text-[10px] text-gray-600 uppercase">To</div>
            <div className="print-info-value text-sm font-bold">{formatDate(invoice.endDate)}</div>
          </div>
          <div className="bg-green-50 p-1.5 rounded">
            <div className="print-info-label text-[10px] text-green-600 uppercase">Rate/Day</div>
            <div className="print-info-value text-sm font-bold text-green-900">{(invoice.ratePerPerson / 30).toFixed(2)} SAR</div>
          </div>
        </div>

        {/* Workers Table */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
            <Users className="h-4 w-4" />
            <span>Worker Details / تفاصيل العمال ({displayDetails.length})</span>
          </div>
          
          <table className="print-table w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-center w-8">#</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">رقم الموظف</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right">الاسم / Name</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">الجنسية</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">الغرفة / Room</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">من / From</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">إلى / To</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center w-12">الأيام</th>
              </tr>
            </thead>
            <tbody>
              {displayDetails.map((worker, index) => (
                <tr key={worker.workerId} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">
                    {index + 1}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center font-mono text-xs">
                    {worker.employeeId || '—'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 font-medium text-left" dir="ltr">
                    {worker.name}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center text-xs">
                    {worker.nationality || '—'}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center text-xs">
                    {worker.roomName || '—'}
                    {worker.buildingName && (
                      <span className="text-gray-400 text-[10px] block">
                        {worker.buildingName}{worker.floorName ? ` / ${worker.floorName}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center text-xs">
                    {formatDate(worker.effectiveCheckIn)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center text-xs">
                    {/* Show empty if worker is still in residence (no checkout or checkout after invoice period) */}
                    {worker.checkOutDate && invoice && new Date(worker.checkOutDate) < new Date(invoice.endDate)
                      ? formatDate(worker.effectiveCheckOut)
                      : ''
                    }
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center font-semibold">
                    {worker.days}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td colSpan={7} className="border border-gray-300 px-2 py-2 text-right">
                  الإجمالي / Total
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center text-lg">
                  {totalDays}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary Box */}
        <div className="print-summary bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Number of Workers:</span> {displayDetails.length}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Total Person-Days:</span> {totalDays}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Daily Rate:</span> {(invoice.ratePerPerson / 30).toFixed(2)} SAR
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Total Amount Due</div>
              <div className="print-summary-title text-3xl font-bold text-green-700">
                {totalAmount.toFixed(2)} <span className="text-lg">SAR</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ريال سعودي
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="print-signatures grid grid-cols-3 gap-8 mt-8 pt-4 border-t border-gray-200">
          <div className="print-signature-box text-center">
            <div className="print-signature-line border-t border-gray-400 w-32 mx-auto mt-12 mb-2"></div>
            <div className="print-signature-label text-xs text-gray-500">
              Prepared By / المُعد
            </div>
          </div>
          <div className="print-signature-box text-center">
            <div className="print-signature-line border-t border-gray-400 w-32 mx-auto mt-12 mb-2"></div>
            <div className="print-signature-label text-xs text-gray-500">
              Reviewed By / المُراجع
            </div>
          </div>
          <div className="print-signature-box text-center">
            <div className="print-signature-line border-t border-gray-400 w-32 mx-auto mt-12 mb-2"></div>
            <div className="print-signature-label text-xs text-gray-500">
              Approved By / المُعتمد
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
