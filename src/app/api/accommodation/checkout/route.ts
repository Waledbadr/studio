import { NextResponse } from "next/server";
import { getAdminDb } from '@/lib/firebase-admin';
import { 
  validateCheckOutDate, 
  isDateRangeInvoiced,
  isMonthInvoiced,
  getValidationErrorMessage,
  type InvoiceRecord 
} from '@/lib/accommodation-date-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Accommodation Checkout API
 * 
 * Validates and processes worker checkout operations with:
 * - Future date prevention
 * - Invoiced period protection
 * - Bilingual error messages
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      workerId, 
      workerIds, 
      residenceId, 
      roomId, 
      checkOutDate,
      checkoutType,
      transferCity,
      performedBy 
    } = body || {};
    
    // Validate required parameters
    if ((!workerId && !Array.isArray(workerIds)) || !performedBy) {
      return NextResponse.json({ 
        ok: false, 
        error: 'missing-params',
        errorAr: 'معاملات مفقودة',
        errorEn: 'Missing required parameters'
      }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Firebase Admin not configured',
        errorAr: 'خطأ في إعداد قاعدة البيانات',
        errorEn: 'Database configuration error'
      }, { status: 500 });
    }

    try {
      const checkoutDateToUse = checkOutDate || new Date().toISOString();
      
      // 1. Validate checkout date is not in the future
      const dateValidation = validateCheckOutDate(new Date(checkoutDateToUse));
      if (!dateValidation.isValid) {
        return NextResponse.json({ 
          ok: false, 
          error: dateValidation.errorCode,
          errorAr: dateValidation.errorAr,
          errorEn: dateValidation.errorEn
        }, { status: 400 });
      }

      const toCheckOut = Array.isArray(workerIds) ? workerIds : [workerId];
      const results: Record<string, { success: boolean; error?: string; errorAr?: string; errorEn?: string }> = {};
      
      // Fetch all occupants from Firestore
      const occupantsSnapshot = await adminDb.collection('occupants')
        .where('until', '==', null)
        .get();
      
      const activeOccupants = occupantsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ref: doc.ref,
        ...doc.data()
      }));

      // Fetch all invoices to check for invoiced periods
      const invoicesSnapshot = await adminDb.collection('invoices').get();
      const invoices: InvoiceRecord[] = invoicesSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        const monthParts = data.month ? data.month.split('-') : [new Date().getFullYear().toString(), '1'];
        
        return {
          id: doc.id,
          month: parseInt(monthParts[1]) - 1, // Convert to 0-indexed
          year: parseInt(monthParts[0]),
          residenceId: data.residenceId,
          status: data.status === 'Draft' ? 'draft' : 
                  data.status === 'Paid' ? 'paid' : 
                  data.status === 'Cancelled' ? 'cancelled' : 'issued',
          createdAt: data.generatedAt ? new Date(data.generatedAt) : new Date()
        };
      });

      // Process each worker
      for (const wid of toCheckOut) {
        try {
          // Find active occupancy for this worker
          const occupant = activeOccupants.find((o: any) => 
            o.workerId === wid &&
            (!residenceId || o.residenceId === residenceId) &&
            (!roomId || o.roomId === roomId)
          );

          if (!occupant) {
            results[wid] = { 
              success: false, 
              error: 'occupant-not-found',
              errorAr: 'العامل غير موجود في سجلات الإقامة الحالية',
              errorEn: 'Worker not found in current accommodation records'
            };
            continue;
          }

          const checkInDate = occupant.since;
          const workerResidenceId = occupant.residenceId;

          // 2. Check if the checkout month has been invoiced
          const checkoutDate = new Date(checkoutDateToUse);
          const checkoutMonth = checkoutDate.getMonth();
          const checkoutYear = checkoutDate.getFullYear();
          
          const isInvoiced = isMonthInvoiced(
            checkoutMonth,
            checkoutYear,
            workerResidenceId,
            invoices
          );

          if (isInvoiced) {
            const monthName = new Date(checkoutYear, checkoutMonth).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
            results[wid] = {
              success: false,
              error: 'MONTH_ALREADY_INVOICED',
              errorAr: `تم إصدار فاتورة لشهر ${monthName} ولا يمكن التعديل`,
              errorEn: `Invoice has been issued for ${new Date(checkoutYear, checkoutMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} and cannot be modified`
            };
            continue;
          }

          // All validations passed - perform checkout
          const updatePayload: any = {
            until: checkoutDateToUse,
            checkOutBy: performedBy,
            updatedAt: new Date().toISOString()
          };

          if (checkoutType) updatePayload.checkoutType = checkoutType;
          if (transferCity) updatePayload.transferCity = transferCity;

          await occupant.ref.update(updatePayload);

          // Update worker status based on checkout type
          if (checkoutType) {
            const workerUpdate: any = { updatedAt: new Date().toISOString() };
            
            if (checkoutType === 'Transfer') {
              workerUpdate.status = 'Transferring';
              if (transferCity) workerUpdate.transferDestination = transferCity;
            } else if (checkoutType === 'Exit') {
              workerUpdate.status = 'Exit';
            } else if (checkoutType === 'Vacation') {
              workerUpdate.status = 'Vacation';
            } else {
              workerUpdate.status = 'Active';
            }

            await adminDb.collection('workers').doc(wid).update(workerUpdate);
          }

          results[wid] = { success: true };

        } catch (error) {
          console.error(`Checkout error for worker ${wid}:`, error);
          results[wid] = {
            success: false,
            error: 'checkout-failed',
            errorAr: 'فشل في تسجيل الخروج',
            errorEn: 'Checkout operation failed'
          };
        }
      }

      // Calculate summary
      const successCount = Object.values(results).filter(r => r.success).length;
      const failCount = toCheckOut.length - successCount;

      return NextResponse.json({ 
        ok: successCount > 0, 
        results,
        summary: {
          total: toCheckOut.length,
          success: successCount,
          failed: failCount
        }
      });

    } catch (e) {
      console.error('checkout route error', e);
      return NextResponse.json({ 
        ok: false, 
        error: String(e),
        errorAr: 'خطأ في معالجة الطلب',
        errorEn: 'Error processing request'
      }, { status: 500 });
    }
  } catch (e) {
    console.error('checkout API error', e);
    return NextResponse.json({ 
      ok: false, 
      error: (e as any).message || 'error',
      errorAr: 'خطأ غير متوقع',
      errorEn: 'Unexpected error'
    }, { status: 500 });
  }
}
