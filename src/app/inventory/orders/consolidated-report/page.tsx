'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, LayoutGrid, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useUsers } from '@/context/users-context';

interface AggregatedItem {
    id: string;
    nameAr: string;
    nameEn: string;
    category: string;
    unit: string;
    totalQuantity: number;
    selectedVariant?: string; // التفصيل المختار من قاعدة البيانات
    note?: string; // ملاحظة الصنف
}

interface GroupedAggregatedItems {
    [category: string]: AggregatedItem[];
}

// استخراج ترجمات الفئات خارج المكون لمنع إعادة الإنشاء في كل رندر
const CATEGORY_TRANSLATIONS: { [key: string]: string } = {
    'CLEANING': 'التنظيف',
    'PLUMBING': 'السباكة',
    'ELECTRICAL': 'الكهرباء',
    'SLEEP KIT': 'أدوات النوم',
    'A/C': 'التكييف',
    'OFFICE': 'المكتب',
    'CAR MAINTENANCE': 'صيانة السيارات',
    'MAINTENANCE': 'الصيانة العامة',
    'KITCHEN': 'المطبخ',
    'BATHROOM': 'الحمام',
    'LAUNDRY': 'الغسيل',
    'SAFETY': 'السلامة',
    'TOOLS': 'الأدوات',
    'FURNITURE': 'الأثاث',
    'MEDICAL': 'المستلزمات الطبية',
    'FOOD': 'المواد الغذائية',
    'GARDEN': 'الحديقة',
    'PAINT': 'الدهان',
    'CONSTRUCTION': 'البناء والإنشاء',
    'HARDWARE': 'الأجهزة',
    'STATIONERY': 'القرطاسية',
    'TEXTILES': 'المنسوجات',
    'LIGHTING': 'الإضاءة',
    'SECURITY': 'الأمن',
    'COMMUNICATION': 'الاتصالات',
    'TRANSPORTATION': 'النقل',
    'STORAGE': 'التخزين',
    'DECORATION': 'الديكور',
    'UNCATEGORIZED': 'غير مصنف',
    'OTHERS': 'أخرى',
    'MISC': 'متنوعة',
    'GENERAL': 'عام'
};

export default function ConsolidatedReportPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { orders, loading, loadOrders, updateOrderStatus } = useOrders();
    const { currentUser } = useUsers();
    const [showIndividualOrders, setShowIndividualOrders] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    
    // Get view mode from URL params, default to 'grid'
    const initialViewMode = searchParams?.get('view') === 'list' ? 'list' : 'grid';
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
    
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Helper to normalize items possibly stored as object maps into arrays
    const normalizeItems = (items: any): any[] => Array.isArray(items) ? items : (items && typeof items === 'object' ? Object.values(items) : []);

    const { groupedItems, residenceNames, totalItems, totalCategories, pendingOrders } = useMemo(() => {
        if (loading || !currentUser || currentUser.role !== 'Admin') {
            return { groupedItems: {}, residenceNames: [], totalItems: 0, totalCategories: 0, pendingOrders: [] };
        }

        const pendingOrders = orders.filter(o => o.status === 'Pending');
        const itemMap = new Map<string, AggregatedItem>();
        const uniqueResidenceNames = new Set<string>();

    // (local helpers already defined above)

        pendingOrders.forEach(order => {
            if (order?.residence) uniqueResidenceNames.add(order.residence);
            normalizeItems(order.items)?.forEach((item: any) => {
                if (!item) return;
                
                // تنظيف الأسماء وإزالة التفاصيل بطريقة مباشرة
                const cleanNameAr = (item.nameAr || '').includes(' - ') ? 
                    item.nameAr.split(' - ')[0] : (item.nameAr || '');
                const cleanNameEn = (item.nameEn || '').includes(' - ') ? 
                    item.nameEn.split(' - ')[0] : (item.nameEn || '');
                const category = (item.category || 'Uncategorized').trim();
                
                // مفتاح بسيط للدمج: اسم + فئة فقط
                const key = `${cleanNameAr}-${cleanNameEn}-${category}`.toLowerCase();

                const existing = itemMap.get(key);
                if (existing) {
                    // دمج الكميات
                    existing.totalQuantity += item.quantity || 0;
                } else {
                    // إنشاء صنف جديد
                    itemMap.set(key, {
                        id: key,
                        nameAr: cleanNameAr || 'صنف بدون اسم',
                        nameEn: cleanNameEn || 'Unnamed Item',
                        category: category,
                        unit: item.unit || '',
                        totalQuantity: item.quantity || 0,
                        selectedVariant: undefined,
                        note: undefined
                    });
                }
            });
        });

        const sortedItems = Array.from(itemMap.values()).sort((a,b) => {
            const aKey = (a.nameAr || a.nameEn || '').toString();
            const bKey = (b.nameAr || b.nameEn || '').toString();
            return aKey.localeCompare(bKey, 'ar');
        });
        
        const grouped = sortedItems.reduce((acc, item) => {
            const category = (item.category || 'Uncategorized').trim();
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {} as GroupedAggregatedItems);
        
        const sortedGrouped = Object.entries(grouped)
            .sort(([,aItems], [,bItems]) => bItems.length - aItems.length)
            .reduce((acc, [category, items]) => { acc[category] = items; return acc; }, {} as GroupedAggregatedItems);
        
        return { 
            groupedItems: sortedGrouped, 
            residenceNames: Array.from(uniqueResidenceNames),
            totalItems: sortedItems.length,
            totalCategories: Object.keys(grouped).length,
            pendingOrders: pendingOrders
        };
        
    }, [orders, loading, currentUser]);

    // أعيدت التسمية لتفادي الالتباس (ليست دالة إنما بيانات)
    const layoutData = useMemo(() => {
        const entries = Object.entries(groupedItems || {});
        const categoriesData = entries.map(([category, items]) => ({
            category,
            items: items as AggregatedItem[],
            itemCount: (items as AggregatedItem[]).length
        }));
        
        if (categoriesData.length === 0) {
            return { layoutConfig: [], gridColumns: 3, gridRows: 1, totalItems: 0, averageItems: 0 } as const;
        }
        
        // Sort by item count (largest first) for better space utilization
        categoriesData.sort((a, b) => b.itemCount - a.itemCount);
        
        // Always use 3 columns for optimal space utilization
        const gridColumns = 3;
        const gridRows = Math.ceil(categoriesData.length / 3);
        
        const totalItemCount = categoriesData.reduce((sum, cat) => sum + cat.itemCount, 0);
        const averageItems = totalItemCount / categoriesData.length || 0;
        
        const layoutConfig = categoriesData.map(catData => {
            let cardType: string = 'normal';
            let heightMultiplier = 1;
            if (catData.itemCount > averageItems * 2.5) { cardType = 'extra-large'; heightMultiplier = 3; }
            else if (catData.itemCount > averageItems * 1.8) { cardType = 'large'; heightMultiplier = 2; }
            else if (catData.itemCount > averageItems * 1.3) { cardType = 'medium-large'; heightMultiplier = 1.5; }
            else if (catData.itemCount < averageItems * 0.7) { cardType = 'small'; heightMultiplier = 0.8; }
            return {
                ...catData,
                cardType,
                heightMultiplier,
                widthMultiplier: 1,
                gridColumn: 'span 1',
                gridRow: heightMultiplier >= 3 ? 'span 3' : heightMultiplier >= 2 ? 'span 2' : heightMultiplier >= 1.5 ? 'span 2' : 'span 1'
            };
        });
        
        return { layoutConfig, gridColumns, gridRows, totalItems: totalItemCount, averageItems: Math.round(averageItems) } as const;
    }, [groupedItems]);

    // دالة ترجمة أسماء الفئات إلى العربية (تستخدم خريطة جاهزة)
    const getCategoryNameAr = (categoryEn: string): string => {
        if (!categoryEn) return 'غير مصنف';
        const upperCategory = categoryEn.toUpperCase().trim();
        if (CATEGORY_TRANSLATIONS[upperCategory]) return CATEGORY_TRANSLATIONS[upperCategory];
        for (const [eng, ar] of Object.entries(CATEGORY_TRANSLATIONS)) {
            if (upperCategory.includes(eng) || eng.includes(upperCategory)) return ar;
        }
        return categoryEn;
    };

    const handlePrint = () => {
        window.print();
    }

    const handleBulkApproval = async () => {
        if (!currentUser || !pendingOrders.length) return;
        
        const confirmMessage = `هل أنت متأكد من الموافقة على جميع الطلبات المعلقة؟\n\nسيتم الموافقة على ${pendingOrders.length} طلب.\n\nAre you sure you want to approve all pending orders?\n\n${pendingOrders.length} orders will be approved.`;
        
        if (!window.confirm(confirmMessage)) return;

        setIsApproving(true);
        try {
            // Approve orders one by one to maintain audit trail
            for (const order of pendingOrders) {
                await updateOrderStatus(order.id, 'Approved', currentUser.id);
            }
            
            // Redirect to orders page after successful bulk approval
            router.push('/inventory/orders');
        } catch (error) {
            console.error('Error in bulk approval:', error);
            // Individual errors are handled by updateOrderStatus
        } finally {
            setIsApproving(false);
        }
    }

    // Format order ID helper
    const formatOrderId = (id: string) => {
        if (!id) return id;
        if (id.startsWith('MR-')) return id;
        const m = id.match(/^(\d{2})-(\d{2})-(\d{3})$/);
        if (m) return `MR-${m[1]}${m[2]}-${m[3]}`;
        return id;
    };

    // Split name detail helper for individual orders
    const splitNameDetail = (name?: string): { base: string; detail: string } => {
        const raw = (name || '').trim();
        if (!raw) return { base: '', detail: '' };
        
        // Split by common separators: " - ", " | ", " / "
        let parts: string[] = [];
        if (raw.includes(' - ')) {
            parts = raw.split(' - ');
        } else if (raw.includes(' | ')) {
            parts = raw.split(' | ');
        } else if (raw.includes(' / ')) {
            parts = raw.split(' / ');
        } else {
            return { base: raw, detail: '' };
        }
        
        if (parts.length <= 1) return { base: raw, detail: '' };
        return { base: parts[0].trim(), detail: parts.slice(1).join(' - ').trim() };
    };

    // Handle view mode change
    const handleViewModeChange = () => {
        const newMode = viewMode === 'grid' ? 'list' : 'grid';
        setViewMode(newMode);
        // Update URL without page reload
        const url = new URL(window.location.href);
        if (newMode === 'list') {
            url.searchParams.set('view', 'list');
        } else {
            url.searchParams.delete('view');
        }
        window.history.pushState({}, '', url.toString());
    };
    
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="border rounded-lg p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (currentUser?.role !== 'Admin') {
         return (
            <div className="text-center py-10">
                <p className="text-xl text-muted-foreground">Access Denied.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @page {
                    size: A4;
                    margin: 5mm;
                }
                
                @media print {
                    .no-print { 
                        display: none !important; 
                    }
                    
                    body { 
                        font-size: 10px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    .space-y-6 {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .bg-white {
                        margin: 0 !important;
                        padding: 8px !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }

                    /* Simplified grid layout for printing */
                    .elegant-grid {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 6px !important;
                        margin: 0 !important;
                    }

                    /* Ensure cards fit properly in 3-column layout */
                    .report-card {
                        display: block !important;
                        width: 100% !important;
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border-radius: 4px !important;
                        margin-bottom: 8px !important;
                    }

                    /* Keep header with the card */
                    .report-card-header {
                        break-after: avoid !important;
                        position: static !important;
                        box-shadow: none !important;
                        padding: 4px 6px !important;
                        font-size: 9px !important;
                        min-height: 32px !important;
                    }

                    /* Ensure full item list prints */
                    .report-card-body {
                        max-height: none !important;
                        overflow: visible !important;
                        padding: 4px !important;
                    }

                    /* Avoid breaking inside a single row */
                    .row-item {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        padding: 3px 4px !important;
                        margin-bottom: 2px !important;
                        font-size: 8px !important;
                    }
                    
                    /* Typography adjustments for print */
                    div[style*="fontSize: '20px'"] {
                        font-size: 12px !important;
                    }
                    
                    div[style*="fontSize: '16px'"] {
                        font-size: 10px !important;
                    }
                    
                    div[style*="fontSize: '14px'"] {
                        font-size: 9px !important;
                    }
                    
                    div[style*="fontSize: '13px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '12px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '11px'"] {
                        font-size: 7px !important;
                    }
                    
                    /* Spacing adjustments */
                    div[style*="marginBottom: '20px'"] {
                        margin-bottom: 8px !important;
                    }
                    
                    div[style*="padding: '15px 20px'"] {
                        padding: 6px 10px !important;
                    }
                    
                    div[style*="padding: '8px 12px'"] {
                        padding: 4px 6px !important;
                    }
                    
                    div[style*="gap: '12px'"] {
                        gap: 4px !important;
                    }
                    
                    div[style*="gap: '30px'"] {
                        gap: 10px !important;
                    }
                    
                    /* Remove height restrictions */
                    div[style*="maxHeight"] {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    
                    /* Header adjustments */
                    div[style*="marginBottom: '1px'"] {
                        margin-bottom: 0px !important;
                    }
                    
                    div[style*="padding: '4px 8px'"] {
                        padding: 2px 4px !important;
                    }
                    
                    /* Footer and signatures */
                    div[style*="marginTop: '25px'"] {
                        margin-top: 15px !important;
                        padding-top: 8px !important;
                        border-top: 1px solid #000 !important;
                    }
                    
                    div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 15px !important;
                    }
                    
                    div[style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 80px !important;
                    }
                    
                    div[style*="fontSize: '11px'"][style*="fontWeight: 'bold'"] {
                        font-size: 8px !important;
                        font-weight: bold !important;
                    }
                    
                    div[style*="fontSize: '9px'"][style*="color: '#6c757d'"] {
                        font-size: 7px !important;
                    }
                    
                    /* Signature text */
                    div[style*="طلب من"], 
                    div[style*="موافق من"], 
                    div[style*="تم الاستلام"],
                    div[style*="Requested By"],
                    div[style*="Approved By"],
                    div[style*="Received By"] {
                        font-size: 8px !important;
                        font-weight: bold !important;
                        color: #000 !important;
                    }
                    
                    div[style*="width: '100px'"][style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 60px !important;
                        margin: 5px auto !important;
                    }
                    }

                    /* List View (Table) Print Styles */
                    .print-compact-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    
                    .print-compact-table thead th {
                        font-weight: 800 !important;
                        font-size: 10px !important;
                        padding: 4px 6px !important;
                        background: ##dadada !important;
                        border-bottom: 1px solid #9ca3af !important;
                        color: #000 !important;
                        white-space: nowrap !important;
                    }
                    
                    .print-compact-table tbody td {
                        font-size: 12px !important;
                        padding: 2px 6px !important; /* tighter rows */
                        line-height: 1.2 !important;  /* reduce vertical height */
                        border-top: 1px solid #d1d5db !important;
                        vertical-align: middle !important;
                        color: #000 !important;
                    }
                    
                    .print-compact-table tbody td:first-child {
                        font-weight: 700 !important;
                        color: #000 !important;
                    }
                    
                    .print-compact-table .category-row td {
                        padding-top: 2px !important;
                        padding-bottom: 2px !important; /* tighter category row */
                        background: #f3f4f6 !important;
                        color: #000 !important;
                        font-weight: 800 !important;
                        font-size: 11px !important;
                        border-top: 1px solid #9ca3af !important;
                        border-bottom: 1px solid #9ca3af !important;
                    }

                    /* Individual Orders Print Styles */
                    .individual-order-page {
                        break-before: page !important;
                        page-break-before: always !important;
                    }
                    
                    .order-header {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }
                    
                    .residence-header {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                        margin-bottom: 15px !important;
                    }

                    /* Notes bidi handling for individual orders */
                    .notes-cell { 
                        direction: rtl !important; 
                        text-align: left !important; 
                        unicode-bidi: isolate !important; 
                    }
                    
                    .notes-cell .bidi-notes { 
                        direction: rtl !important; 
                        unicode-bidi: plaintext !important; 
                    }
                    
                    .print-notes {
                        max-width: 220px !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                        color: #111 !important;
                        direction: rtl !important;
                        text-align: left !important;
                        unicode-bidi: isolate !important;
                    }

                    /* iPhone-style toggle switch animations */
                    .toggle-switch {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                    
                    .toggle-switch:hover {
                        transform: scale(1.05) !important;
                    }
                    
                    .toggle-switch:active {
                        transform: scale(0.95) !important;
                    }
                }
                
                /* Web view responsive adjustments */
                @media screen and (max-width: 1200px) {
                    .elegant-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                }
                
                @media screen and (max-width: 1024px) {
                    .elegant-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 12px !important;
                    }
                }
                
                @media screen and (max-width: 768px) {
                    .elegant-grid {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    
                    .bg-white {
                        padding: 12px !important;
                        font-size: 12px !important;
                    }
                }
                `
            }} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between no-print mb-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Requests
                    </Button>
                    <div className="flex items-center gap-2">
                        {pendingOrders.length > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowIndividualOrders(!showIndividualOrders)}
                                    title="إضافة/إزالة الطلبات الفردية مع التقرير المجمع"
                                >
                                    <LayoutGrid className="mr-2 h-4 w-4" />
                                    {showIndividualOrders ? 'إخفاء الطلبات الفردية' : 'إظهار الطلبات الفردية'}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleBulkApproval}
                                    disabled={isApproving}
                                    title="الموافقة على جميع الطلبات المعلقة دفعة واحدة"
                                >
                                    {isApproving ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الموافقة...</>
                                    ) : (
                                        <>موافقة جماعية ({pendingOrders.length})</>
                                    )}
                                </Button>
                            </>
                        )}
                        
                        {/* iPhone-style Toggle Switch */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                color: viewMode === 'grid' ? '#007bff' : '#6c757d'
                            }}>شبكي</span>
                            
                            <div 
                                onClick={handleViewModeChange}
                                className="toggle-switch"
                                style={{
                                    width: '48px',
                                    height: '24px',
                                    backgroundColor: viewMode === 'list' ? '#007bff' : '#e9ecef',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    border: '2px solid transparent',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                                }}
                                title="التبديل بين العرض الشبكي والعرض العادي"
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '1px',
                                    left: viewMode === 'list' ? '27px' : '1px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {viewMode === 'grid' ? (
                                        <LayoutGrid style={{ width: '10px', height: '10px', color: '#007bff' }} />
                                    ) : (
                                        <List style={{ width: '10px', height: '10px', color: '#007bff' }} />
                                    )}
                                </div>
                            </div>
                            
                            <span style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                color: viewMode === 'list' ? '#007bff' : '#6c757d'
                            }}>عادي</span>
                        </div>
                        
                        <Button onClick={handlePrint} title={`طباعة التقرير ${viewMode === 'grid' ? 'الشبكي' : 'العادي'}`}>
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة
                        </Button>
                    </div>
                </div>

                <div 
                    className="bg-white p-6 rounded-lg border shadow-sm" 
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.4'
                    }}
                >
                    {/* Enhanced Header */}
                    <div 
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '20px',
                            padding: '12px 16px',
                            border: '2px solid #000',
                            borderRadius: '8px',
                            background: '#f8f9fa'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '15px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: '#000',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Consolidated Pending Requests
                                    </div>
                                </div>
                                <div style={{
                                    textAlign: 'right'
                                }}>
                                    {/* Date - Made bigger */}
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#007bff',
                                        backgroundColor: '#fff3cd',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ffeeba',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {format(new Date(), 'MMM do, yyyy')}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Locations and Order IDs with frames - Full width */}
                            {residenceNames.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    {residenceNames.map((name) => {
                                        const residenceOrders = pendingOrders.filter(order => order.residence === name);
                                        return (
                                            <div key={name} style={{
                                                background: '#f8f9fa',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                padding: '4px 6px',
                                                textAlign: 'center',
                                                minWidth: '70px',
                                                maxWidth: '120px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center'
                                            }}>
                                                <div style={{
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    color: '#1976d2',
                                                    lineHeight: '1.2',
                                                    marginBottom: '2px'
                                                }}>
                                                    {name}
                                                </div>
                                                <div style={{
                                                    fontSize: '8px',
                                                    color: '#000',
                                                    lineHeight: '1.1'
                                                }}>
                                                    {residenceOrders.map(order => formatOrderId(order.id)).join(', ')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content - Conditional Display */}
                    <div style={{ padding: '0' }}>
                        {layoutData.layoutConfig.length > 0 ? (
                            viewMode === 'grid' ? (
                                /* Grid View (Original Elegant Design) */
                                <div 
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${layoutData.gridColumns}, 1fr)`,
                                        gap: '16px',
                                        marginBottom: '20px',
                                        gridAutoRows: 'minmax(200px, auto)'
                                    }}
                                    className="elegant-grid"
                                >
                                {layoutData.layoutConfig.map((cardConfig) => (
                                    <div 
                                        key={cardConfig.category} 
                                        className="report-card"
                                        style={{
                                            border: '1px solid #dee2e6',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            gridColumn: cardConfig.gridColumn,
                                            gridRow: cardConfig.gridRow,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {/* Card Header - Bilingual & Elegant */}
                                        <div className="report-card-header" style={{
                                            background: '#f8f9fa',
                                            borderBottom: '2px solid #dee2e6',
                                            color: '#495057',
                                            padding: '10px 15px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            letterSpacing: '0.2px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            minHeight: '40px' // زيادة قليلة للاستيعاب
                                        }}>
                                            {/* Category Names - Equal Formatting */}
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#4a5568',
                                                    direction: 'ltr'
                                                }}>
                                                    {cardConfig.category}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#4a5568',
                                                    direction: 'rtl'
                                                }}>
                                                    {getCategoryNameAr(cardConfig.category)}
                                                </div>
                                            </div>
                                            
                                            {/* Items Count Badge */}
                                            <div style={{
                                                fontSize: '10px',
                                                fontWeight: '600',
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                minWidth: '35px',
                                                textAlign: 'center',
                                                border: '1px solid rgba(255,255,255,0.2)'
                                            }}>
                                                {cardConfig.itemCount}
                                            </div>
                                        </div>
                                        
                                        {/* Card Content - Optimized for Height */}
                                        <div className="report-card-body" style={{
                                            padding: '6px', // تقليل المسافة الداخلية
                                            maxHeight: cardConfig.cardType === 'extra-large' ? '500px' : // زيادة الارتفاع للكروت الضخمة
                                                      cardConfig.cardType === 'large' ? '400px' : // زيادة للكروت الكبيرة
                                                      cardConfig.cardType === 'medium-large' ? '300px' :
                                                      '250px',
                                            overflowY: 'auto'
                                        }}>
                                            {(cardConfig.items as AggregatedItem[]).map((item: AggregatedItem, index: number) => {
                                                return (
                                                    <div key={item.id} className="row-item" style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 10px',
                                                        marginBottom: index === (cardConfig.items as AggregatedItem[]).length - 1 ? '0' : '3px',
                                                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                                                        borderRadius: '4px',
                                                        border: '1px solid #f1f3f4'
                                                    }}>
                                                        {/* اسم الصنف والتفاصيل */}
                                                        <div style={{ 
                                                            flex: 1, 
                                                            marginRight: '10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between'
                                                        }}>
                                                            {/* اسم الصنف - يحتفظ بعرضه الأصلي */}
                                                            <div style={{ flex: 1, marginRight: '8px' }}>
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#2c3e50',
                                                                    lineHeight: '1.3',
                                                                    marginBottom: '2px'
                                                                }}>
                                                                    {(() => {
                                                                        const ar = splitNameDetail(item.nameAr);
                                                                        return ar.base || item.nameAr;
                                                                    })()}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: '#7f8c8d',
                                                                    lineHeight: '1.2'
                                                                }}>
                                                                    {(() => {
                                                                        const en = splitNameDetail(item.nameEn);
                                                                        return en.base || item.nameEn;
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* الكمية والوحدة على اليمين */}
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            minWidth: '45px'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                color: '#2980b9'
                                                            }}>
                                                                {item.totalQuantity}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: '#95a5a6',
                                                                textAlign: 'center'
                                                            }}>
                                                                {item.unit}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                /* List View (Table Format like MR page) */
                                <div style={{ 
                                    marginBottom: '25px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '14px',
                                        backgroundColor: '#ffffff'
                                    }} className="print-compact-table">
                                        <thead>
                                            <tr style={{ 
                                                background: '#f8f9fa',
                                                color: '#212529',
                                                borderBottom: '2px solid #dee2e6'
                                            }}>
                                                <th style={{
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    padding: '16px 20px',
                                                    textAlign: 'left',
                                                    width: '55%',
                                                    letterSpacing: '0.5px',
                                                    textTransform: 'uppercase'
                                                }}>Item</th>
                                                <th style={{
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    padding: '16px 20px',
                                                    textAlign: 'center',
                                                    width: '20%',
                                                    letterSpacing: '0.5px',
                                                    textTransform: 'uppercase'
                                                }}>Unit</th>
                                                <th style={{
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    padding: '16px 20px',
                                                    textAlign: 'center',
                                                    width: '25%',
                                                    letterSpacing: '0.5px',
                                                    textTransform: 'uppercase'
                                                }}>Total Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {layoutData.layoutConfig.map((cardConfig) => (
                                                <React.Fragment key={cardConfig.category}>
                                                    <tr className="category-row" style={{
                                                        background: '#f8f9fa',
                                                        borderLeft: '4px solid #667eea'
                                                    }}>
                                                        <td colSpan={3} style={{
                                                            padding: '8px 14px',
                                                            color: '#495057',
                                                            fontWeight: '700',
                                                            textTransform: 'capitalize',
                                                            fontSize: '13px',
                                                            borderBottom: '2px solid #dee2e6',
                                                            position: 'relative'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}>
                                                                <span style={{ fontSize: '14px', fontWeight: '700' }}>
                                                                    {getCategoryNameAr(cardConfig.category)} • {cardConfig.category}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {(cardConfig.items as AggregatedItem[]).map((item: AggregatedItem) => (
                                                        <tr key={item.id} style={{
                                                            transition: 'all 0.2s ease'
                                                        }}>
                                                            <td style={{
                                                                padding: '8px 16px',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                fontWeight: '500',
                                                                fontSize: '12px',
                                                                color: '#2d3748',
                                                                lineHeight: '1.35'
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px'
                                                                }}>
                                                                    <div>
                                                                        {(() => {
                                                                            const ar = splitNameDetail(item.nameAr);
                                                                            const en = splitNameDetail(item.nameEn);
                                                                            return `${en.base || item.nameEn} | ${ar.base || item.nameAr}`;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{
                                                                padding: '8px 16px',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                textAlign: 'center',
                                                                fontSize: '12px',
                                                                color: '#4a5568',
                                                                fontWeight: '500'
                                                            }}>
                                                                <span style={{
                                                                    backgroundColor: '#e2e8f0',
                                                                    padding: '3px 6px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '600',
                                                                    color: '#2d3748'
                                                                }}>
                                                                    {item.unit}
                                                                </span>
                                                            </td>
                                                            <td style={{
                                                                padding: '8px 16px',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                textAlign: 'center',
                                                                fontWeight: 'bold',
                                                                fontSize: '12px'
                                                            }}>
                                                                <div style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    backgroundColor: '#f8f9fa',
                                                                    color: '#212529',
                                                                    padding: '4px 8px',
                                                                    border: '1px solid #dee2e6',
                                                                    borderRadius: '4px',
                                                                    fontWeight: '700',
                                                                    minWidth: '44px'
                                                                }}>
                                                                    {item.totalQuantity}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '60px 20px', 
                                color: '#6c757d', 
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                No pending material requests found.
                            </div>
                        )}
                    </div>

                    {/* Enhanced Footer */}
                    <div style={{
                        marginTop: '25px',
                        borderTop: '2px solid #000',
                        paddingTop: '15px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '30px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px',
                                    color: '#495057'
                                }}>Requested By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px',
                                    color: '#495057'
                                }}>Approved By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '20px',
                                    color: '#495057'
                                }}>Received By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Individual Orders Section - Each residence on separate page */}
                {showIndividualOrders && pendingOrders.length > 0 && (
                    <div style={{ pageBreakBefore: 'always' }}>
                        {/* Group orders by residence */}
                        {residenceNames.map((residenceName, residenceIndex) => {
                            const residenceOrders = pendingOrders.filter(order => order.residence === residenceName);
                            
                            if (residenceOrders.length === 0) return null;

                            return (
                                <div key={residenceName} style={{
                                    pageBreakBefore: residenceIndex > 0 ? 'always' : 'auto',
                                    marginBottom: '40px'
                                }}>
                                    {/* Residence Header */}
                                    <div style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: '#f8f9fa',
                                        border: '2px solid #dee2e6',
                                        borderRadius: '8px'
                                    }}>
                                        Material Requests for {residenceName}
                                        <br />
                                        <span style={{ fontSize: '14px', color: '#666' }}>
                                            طلبات المواد لسكن {residenceName}
                                        </span>
                                    </div>

                                    {/* Individual Orders for this Residence */}
                                    {residenceOrders.map((order, orderIndex) => {
                                        // Normalize items to an array (handles legacy object shape or undefined)
                                        const orderItemsArr = normalizeItems(order.items);
                                        // Group items by category for each order
                                        const groupedOrderItems = orderItemsArr.reduce((acc, item) => {
                                            const category = item.category || 'Uncategorized';
                                            if (!acc[category]) acc[category] = [];
                                            acc[category].push(item);
                                            return acc;
                                        }, {} as Record<string, typeof orderItemsArr>);

                                        return (
                                            <div key={order.id} style={{
                                                marginBottom: '30px',
                                                pageBreakInside: 'avoid',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '8px',
                                                backgroundColor: 'white'
                                            }}>
                                                {/* Order Header - Same as individual order format */}
                                                <div style={{
                                                    borderBottom: '2px solid #000',
                                                    padding: '15px 20px'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start'
                                                    }}>
                                                        <div>
                                                            <div style={{
                                                                fontSize: '22px',
                                                                fontWeight: '800',
                                                                marginBottom: '2px',
                                                                color: '#000'
                                                            }}>
                                                                Materials Request
                                                            </div>
                                                            <div style={{
                                                                fontSize: '16px',
                                                                fontWeight: '700',
                                                                color: '#1f2937'
                                                            }}>
                                                                ID: #{formatOrderId(order.id)}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{
                                                                fontSize: '22px',
                                                                fontWeight: '800',
                                                                marginBottom: '4px'
                                                            }}>
                                                                {order.residence}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '14px',
                                                                color: '#1f2937'
                                                            }}>
                                                                {format(order.date.toDate(), 'PPP')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Order Content - Same table format as individual order */}
                                                <div style={{ padding: '20px' }}>
                                                    <table style={{
                                                        width: '100%',
                                                        borderCollapse: 'collapse'
                                                    }} className="print-compact-table">
                                                        <thead>
                                                            <tr>
                                                                <th style={{
                                                                    fontWeight: '700',
                                                                    fontSize: '10px',
                                                                    padding: '4px 6px',
                                                                    background: '#f2f3f5',
                                                                    borderBottom: '1px solid #e2e8f0',
                                                                    color: '#111',
                                                                    textAlign: 'left'
                                                                }}>Item Name</th>
                                                                <th style={{
                                                                    fontWeight: '700',
                                                                    fontSize: '10px',
                                                                    padding: '4px 6px',
                                                                    background: '#f2f3f5',
                                                                    borderBottom: '1px solid #e2e8f0',
                                                                    color: '#111',
                                                                    textAlign: 'left',
                                                                    width: '220px'
                                                                }}>Notes</th>
                                                                <th style={{
                                                                    fontWeight: '700',
                                                                    fontSize: '10px',
                                                                    padding: '4px 6px',
                                                                    background: '#f2f3f5',
                                                                    borderBottom: '1px solid #e2e8f0',
                                                                    color: '#111',
                                                                    textAlign: 'center'
                                                                }}>Unit</th>
                                                                <th style={{
                                                                    fontWeight: '700',
                                                                    fontSize: '10px',
                                                                    padding: '4px 6px',
                                                                    background: '#f2f3f5',
                                                                    borderBottom: '1px solid #e2e8f0',
                                                                    color: '#111',
                                                                    textAlign: 'right'
                                                                }}>Qty</th>
                                                                <th style={{
                                                                    fontWeight: '700',
                                                                    fontSize: '10px',
                                                                    padding: '4px 6px',
                                                                    background: '#f2f3f5',
                                                                    borderBottom: '1px solid #e2e8f0',
                                                                    color: '#111',
                                                                    textAlign: 'center'
                                                                }}>Stock</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(groupedOrderItems).map(([category, items]) => (
                                                                <React.Fragment key={category}>
                                                                    <tr>
                                                                        <td colSpan={5} style={{
                                                                            fontWeight: '700',
                                                                            color: '#0f766e',
                                                                            backgroundColor: '#fafafa',
                                                                            padding: '4px 6px',
                                                                            borderTop: '1px solid #e2e8f0',
                                                                            borderBottom: '1px solid #e2e8f0',
                                                                            textTransform: 'capitalize'
                                                                        }}>
                                                                            {category}
                                                                        </td>
                                                                    </tr>
                                                                    {(items as any[]).map((item: any) => {
                                                                        const ar = splitNameDetail(item.nameAr);
                                                                        const en = splitNameDetail(item.nameEn);
                                                                        const detail = ar.detail || en.detail || '';
                                                                        const notes = (() => {
                                                                            const baseNotes = (item.notes || '').trim();
                                                                            if (detail && baseNotes) return `${baseNotes}  ${detail}`;
                                                                            if (detail) return detail;
                                                                            return baseNotes || '-';
                                                                        })();
                                                                        
                                                                        return (
                                                                            <tr key={item.id}>
                                                                                <td style={{
                                                                                    fontSize: '10px',
                                                                                    padding: '3px 6px',
                                                                                    borderTop: '1px solid #f1f5f9',
                                                                                    fontWeight: '500'
                                                                                }}>
                                                                                    {en.base || item.nameEn} | {ar.base || item.nameAr}
                                                                                </td>
                                                                                <td style={{
                                                                                    fontSize: '10px',
                                                                                    padding: '3px 6px',
                                                                                    borderTop: '1px solid #f1f5f9',
                                                                                    direction: 'rtl',
                                                                                    textAlign: 'left',
                                                                                    maxWidth: '220px',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                    whiteSpace: 'nowrap'
                                                                                }} className="notes-cell print-notes">
                                                                                    <span className="bidi-notes">{notes}</span>
                                                                                </td>
                                                                                <td style={{
                                                                                    fontSize: '10px',
                                                                                    padding: '3px 6px',
                                                                                    borderTop: '1px solid #f1f5f9',
                                                                                    textAlign: 'center'
                                                                                }}>
                                                                                    {item.unit}
                                                                                </td>
                                                                                <td style={{
                                                                                    fontSize: '10px',
                                                                                    padding: '3px 6px',
                                                                                    borderTop: '1px solid #f1f5f9',
                                                                                    textAlign: 'right',
                                                                                    fontWeight: 'bold'
                                                                                }}>
                                                                                    {item.quantity}
                                                                                </td>
                                                                                <td style={{
                                                                                    fontSize: '10px',
                                                                                    padding: '3px 6px',
                                                                                    borderTop: '1px solid #f1f5f9',
                                                                                    textAlign: 'center'
                                                                                }}>
                                                                                    -
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>

                                                    {/* Order Total */}
                                                    <div style={{
                                                        marginTop: '6px',
                                                        paddingTop: '4px',
                                                        borderTop: '1px solid #e5e7eb',
                                                        textAlign: 'right',
                                                        fontWeight: 'bold',
                                                        fontSize: '11px',
                                                        paddingRight: '4px'
                                                    }}>
                                                        Total Items: {order.items.length}
                                                    </div>
                                                </div>

                                                {/* Order Signatures - Same as individual order */}
                                                <div style={{
                                                    marginTop: '8px',
                                                    paddingTop: '4px',
                                                    borderTop: '1px solid #e5e7eb',
                                                    padding: '10px 20px'
                                                }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '10px',
                                                                color: '#6c757d',
                                                                marginBottom: '20px'
                                                            }}>
                                                                Requested By:
                                                            </div>
                                                            <div style={{
                                                                borderTop: '2px solid #000',
                                                                width: '120px',
                                                                margin: '0 auto 10px auto'
                                                            }}></div>
                                                        </div>
                                                        <div style={{
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '10px',
                                                                color: '#6c757d',
                                                                marginBottom: '20px'
                                                            }}>
                                                                Approved By:
                                                            </div>
                                                            <div style={{
                                                                borderTop: '2px solid #000',
                                                                width: '120px',
                                                                margin: '0 auto 10px auto'
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    )
}
