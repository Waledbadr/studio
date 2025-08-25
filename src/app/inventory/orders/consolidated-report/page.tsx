'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    const { orders, loading, loadOrders } = useOrders();
    const { currentUser } = useUsers();
    
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const { groupedItems, residenceNames, totalItems, totalCategories } = useMemo(() => {
        if (loading || !currentUser || currentUser.role !== 'Admin') {
            return { groupedItems: {}, residenceNames: [], totalItems: 0, totalCategories: 0 };
        }

        const pendingOrders = orders.filter(o => o.status === 'Pending');
        const itemMap = new Map<string, AggregatedItem>();
        const uniqueResidenceNames = new Set<string>();

        pendingOrders.forEach(order => {
            if (order?.residence) uniqueResidenceNames.add(order.residence);
            order.items?.forEach(item => {
                if (!item) return;
                const selectedVariant = item.id && item.id.includes('-') ? item.id.split('-').slice(1).join('-') : undefined;
                const cleanNameAr = (item.nameAr || '').includes(' - ') ? item.nameAr.split(' - ')[0] : (item.nameAr || '');
                const cleanNameEn = (item.nameEn || '').includes(' - ') ? item.nameEn.split(' - ')[0] : (item.nameEn || '');
                const note = item.notes?.trim();
                // دمج الـ note في المفتاح لضمان عدم دمج أصناف ذات ملاحظات مختلفة
                const keyBase = item.id || `${cleanNameEn}-${cleanNameAr}`;
                const key = note ? `${keyBase}__note:${note}` : keyBase;
                const existing = itemMap.get(key);
                if (existing) {
                    existing.totalQuantity += item.quantity || 0;
                } else {
                    itemMap.set(key, {
                        id: key,
                        nameAr: cleanNameAr || cleanNameEn || 'صنف بدون اسم',
                        nameEn: cleanNameEn || cleanNameAr || 'Unnamed Item',
                        category: (item.category || 'Uncategorized') || 'Uncategorized',
                        unit: item.unit || '',
                        totalQuantity: item.quantity || 0,
                        selectedVariant,
                        note
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
            totalCategories: Object.keys(grouped).length
        };
        
    }, [orders, loading, currentUser]);

    // أعيدت التسمية لتفادي الالتباس (ليست دالة إنما بيانات)
    const layoutData = useMemo(() => {
        const entries = Object.entries(groupedItems || {});
        const categoriesData = entries.map(([category, items]) => ({
            category,
            items,
            itemCount: items.length
        }));
        
        if (categoriesData.length === 0) {
            return { layoutConfig: [], gridColumns: 3, gridRows: 2, totalItems: 0, averageItems: 0 } as const;
        }
        
        categoriesData.sort((a, b) => b.itemCount - a.itemCount);
        
        let gridColumns = 3;
        let gridRows = Math.ceil(categoriesData.length / 3);
        if (categoriesData.length <= 2) {
            gridColumns = 2;
        } else if (categoriesData.length <= 4) {
            gridColumns = 2; gridRows = 2;
        } else if (categoriesData.length <= 6) {
            gridColumns = 3; gridRows = 2;
        } else if (categoriesData.length <= 9) {
            gridColumns = 3; gridRows = 3;
        } else { gridColumns = 4; gridRows = Math.ceil(categoriesData.length / 4); }
        
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
                    margin: 3mm;
                }
                
                @media print {
                    .no-print { 
                        display: none !important; 
                    }
                    
                    body { 
                        font-size: 8px !important;
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
                        padding: 6px !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }

                    /* Use multi-column layout on print to better utilize vertical whitespace */
                    .elegant-grid {
                        display: block !important;
                        column-count: 2;
                        column-gap: 8px !important;
                        column-fill: balance;
                        margin: 0 !important;
                    }

                    /* Allow cards to break across pages/columns and avoid clipping */
                    .report-card {
                        display: inline-block;
                        width: 100%;
                        break-inside: auto !important;
                        page-break-inside: auto !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border-radius: 6px !important;
                    }

                    /* Keep header with the first row, but allow long cards to split */
                    .report-card-header {
                        break-after: avoid !important;
                        position: static !important;
                        box-shadow: none !important;
                    }

                    /* Ensure full item list prints */
                    .report-card-body {
                        max-height: none !important;
                        overflow: visible !important;
                        padding: 4px 6px !important;
                    }

                    /* Avoid breaking inside a single row visually */
                    .row-item {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    
                    /* تصغير أحجام الخطوط للطباعة */
                    div[style*="fontSize: '20px'"] {
                        font-size: 11px !important;
                    }
                    
                    div[style*="fontSize: '16px'"] {
                        font-size: 9px !important;
                    }
                    
                    div[style*="fontSize: '14px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '13px'"] {
                        font-size: 8px !important;
                    }
                    
                    div[style*="fontSize: '12px'"] {
                        font-size: 7px !important;
                    }
                    
                    div[style*="fontSize: '11px'"] {
                        font-size: 6px !important;
                    }
                    
                    div[style*="fontSize: '10px'"] {
                        font-size: 6px !important;
                    }
                    
                    div[style*="fontSize: '9px'"] {
                        font-size: 5px !important;
                    }
                    
                    div[style*="fontSize: '8px'"] {
                        font-size: 5px !important;
                    }
                    
                    /* تصغير المسافات */
                    div[style*="marginBottom: '20px'"] {
                        margin-bottom: 8px !important;
                    }
                    
                    div[style*="margin: '15px 0'"] {
                        margin: 6px 0 !important;
                    }
                    
                    div[style*="padding: '15px 20px'"] {
                        padding: 4px 8px !important;
                    }
                    
                    div[style*="padding: '8px 12px'"] {
                        padding: 3px 5px !important;
                    }
                    
                    div[style*="padding: '6px 10px'"] {
                        padding: 2px 4px !important;
                    }
                    
                    div[style*="gap: '12px'"] {
                        gap: 3px !important;
                    }
                    
                    div[style*="gap: '8px'"] {
                        gap: 2px !important;
                    }
                    
                    div[style*="gap: '30px'"] {
                        gap: 8px !important;
                    }
                    
                    /* إزالة جميع القيود على الارتفاع لضمان عرض جميع الأصناف - إبقاء دعم selector القديم احتياطياً */
                    div[style*="maxHeight"] {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    div[style*="overflowY: 'auto'"] {
                        overflow: visible !important;
                        max-height: none !important;
                    }
                    .elegant-grid > div {
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    
                    /* تحسين العناوين جنباً إلى جنب للطباعة */
                    div[style*="gap: '8px'"] {
                        gap: 4px !important;
                    }
                    div[style*="padding: '8px 12px'"] {
                        padding: 4px 6px !important;
                    }
                    
                    div[style*="minHeight: '40px'"] {
                        min-height: 24px !important;
                    }
                    
                    div[style*="marginBottom: '1px'"] {
                        margin-bottom: 0px !important;
                    }
                    
                    div[style*="padding: '4px 8px'"] {
                        padding: 2px 4px !important;
                    }
                    
                    div[style*="borderRadius: '12px'"] {
                        border-radius: 6px !important;
                    }
                    
                    div[style*="padding: '6px'"] {
                        padding: 3px !important;
                    }
                    
                    div[style*="padding: '6px 10px'"] {
                        padding: 3px 5px !important;
                    }
                    
                    div[style*="marginBottom: '3px'"] {
                        margin-bottom: 1px !important;
                    }
                    
                    div[style*="borderRadius: '4px'"] {
                        border-radius: 2px !important;
                    }
                    
                    div[style*="marginBottom: '1px'"] {
                        margin-bottom: 0px !important;
                    }
                    
                    /* تقليل حجم النص المحدث للطباعة */
                    div[style*="fontSize: '11px'"] {
                        font-size: 6px !important;
                    }
                    
                    div[style*="fontSize: '9px'"] {
                        font-size: 5px !important;
                    }
                    
                    div[style*="fontSize: '13px'"] {
                        font-size: 7px !important;
                    }
                    
                    div[style*="fontSize: '8px'"] {
                        font-size: 4px !important;
                    }
                    
                    /* تحسين ارتفاع الصفوف */
                    div[style*="minHeight: '28px'"] {
                        min-height: 18px !important;
                    }
                    
                    /* تحسين المسافات الداخلية للعناصر */
                    div[style*="marginTop: '25px'"] {
                        margin-top: 15px !important;
                    }
                    
                    div[style*="paddingTop: '15px'"] {
                        padding-top: 8px !important;
                    }
                    
                    /* الحفاظ على حجم خط التوقيعات قابل للقراءة */
                    div[style*="fontSize: '11px'"][style*="fontWeight: 'bold'"] {
                        font-size: 8px !important;
                        font-weight: bold !important;
                    }
                    
                    div[style*="fontSize: '9px'"][style*="color: '#6c757d'"] {
                        font-size: 7px !important;
                    }
                    
                    /* ضمان ظهور أقسام التوقيعات */
                    div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 15px !important;
                    }
                    
                    div[style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 80px !important;
                    }
                    
                    /* منع إخفاء التوقيعات في الطباعة */
                    div[style*="textAlign: 'center'"][style*="border: '1px solid #dee2e6'"] {
                        display: block !important;
                        visibility: visible !important;
                        page-break-inside: avoid !important;
                        margin-bottom: 0 !important;
                    }
                    
                    /* ضمان ظهور footer والتوقيعات */
                    div[style*="marginTop: '25px'"][style*="borderTop: '2px solid #000'"] {
                        display: block !important;
                        visibility: visible !important;
                        page-break-inside: avoid !important;
                        margin-top: 10px !important;
                        padding-top: 5px !important;
                        border-top: 1px solid #000 !important;
                    }
                    
                    /* التأكد من ظهور grid التوقيعات */
                    div[style*="display: 'grid'"][style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 10px !important;
                        margin-top: 5px !important;
                    }
                    
                    /* ضمان وضوح نص التوقيعات */
                    div[style*="طلب من"], 
                    div[style*="موافق من"], 
                    div[style*="تم الاستلام"],
                    div[style*="Requested By"],
                    div[style*="Approved By"],
                    div[style*="Received By"] {
                        font-size: 7px !important;
                        font-weight: bold !important;
                        color: #000 !important;
                    }
                    
                    /* التأكد من ظهور خطوط التوقيع */
                    div[style*="width: '100px'"][style*="borderTop: '2px solid #000'"] {
                        border-top: 1px solid #000 !important;
                        width: 60px !important;
                        margin: 5px auto !important;
                    }
                    
                    /* ضمان ظهور حقول Name, Position, Date */
                    div[style*="Name: _______________"],
                    div[style*="Position: ___________"],
                    div[style*="Date: _____________"] {
                        font-size: 6px !important;
                        color: #333 !important;
                        margin-bottom: 2px !important;
                    }
                }
                
                /* استجابة أنيقة للشاشات المختلفة */
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
                    
                    div[style*="gridColumn"] {
                        grid-column: span 1 !important;
                    }
                    
                    div[style*="gridRow"] {
                        grid-row: span 1 !important;
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
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.push('/inventory/orders/consolidated-report-mr')}
                            title="عرض التقرير العادي (MR-style)"
                        >
                            <List className="mr-2 h-4 w-4" />
                            التقرير العادي
                        </Button>
                        <Button onClick={handlePrint} title="طباعة التقرير الشبكي">
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة الشبكي
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
                            padding: '15px 20px',
                            border: '2px solid #000',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Consolidated Pending Requests
                            </div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#333',
                                marginBottom: '8px'
                            }}>
                                الطلبات المجمعة المعلقة
                            </div>
                        </div>
                        <div style={{
                            textAlign: 'right',
                            borderLeft: '2px solid #007bff',
                            paddingLeft: '15px'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#007bff',
                                backgroundColor: '#fff3cd',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '2px solid #ffeeba',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                Report Date: {format(new Date(), 'MMMM do, yyyy')}
                            </div>
                        </div>
                    </div>

                    {/* Locations Section */}
                    {residenceNames.length > 0 && (
                        <div style={{
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                color: '#495057'
                            }}>
                                المواقع المطلوبة • Requested Locations
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                {residenceNames.map((name) => (
                                    <span key={name} style={{
                                        background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                        color: 'white',
                                        padding: '6px 14px',
                                        borderRadius: '15px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                                        border: '1px solid #0056b3'
                                    }}>
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Stats - Simplified */}
                    <div style={{
                        margin: '15px 0',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        border: '1px solid #2196f3',
                        borderRadius: '6px'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#1976d2',
                            marginBottom: '6px'
                        }}>ملخص الطلب • Request Summary</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                            gap: '6px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Total Categories</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{totalCategories}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Total Items</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{totalItems}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Locations</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>{residenceNames.length}</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '4px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    fontSize: '8px',
                                    color: '#666',
                                    marginBottom: '2px'
                                }}>Status</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}>Pending</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Elegant Design */}
                    <div style={{ padding: '0' }}>
                        {layoutData.layoutConfig.length > 0 ? (
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
                                            background: 'linear-gradient(135deg, #495057 0%, #343a40 100%)', // لون موحد رمادي أنيق
                                            color: 'white',
                                            padding: '8px 12px', // زيادة قليلة للمساحة للنصين
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
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    direction: 'ltr'
                                                }}>
                                                    {cardConfig.category}
                                                </div>
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: 'white',
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
                                            {cardConfig.items.map((item: any, index: number) => {
                                                return (
                                                    <div key={item.id} className="row-item" style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 10px',
                                                        marginBottom: index === cardConfig.items.length - 1 ? '0' : '3px',
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
                                                                    fontSize: '11px',
                                                                    fontWeight: '600',
                                                                    color: '#2c3e50',
                                                                    lineHeight: '1.2',
                                                                    marginBottom: '1px'
                                                                }}>
                                                                    {item.nameAr}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '9px',
                                                                    color: '#7f8c8d',
                                                                    lineHeight: '1.1'
                                                                }}>
                                                                    {item.nameEn}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* التفاصيل على اليمين من اسم الصنف */}
                                                            {item.selectedVariant && (
                                                                <div style={{
                                                                    flex: 0,
                                                                    minWidth: 'auto'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: '9px',
                                                                        fontWeight: '500',
                                                                        color: '#8e44ad',
                                                                        backgroundColor: '#f8f9ff',
                                                                        padding: '2px 5px',
                                                                        borderRadius: '3px',
                                                                        border: '1px solid #e8e1ff',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        {item.selectedVariant}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {item.note && (
                                                                <div style={{
                                                                    flex: 0,
                                                                    minWidth: 'auto'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: '9px',
                                                                        fontWeight: '500',
                                                                        color: '#0d6efd',
                                                                        backgroundColor: '#eef6ff',
                                                                        padding: '2px 5px',
                                                                        borderRadius: '3px',
                                                                        border: '1px solid #b6daff',
                                                                        whiteSpace: 'nowrap',
                                                                        maxWidth: '120px',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis'
                                                                    }} title={item.note}>
                                                                        {item.note}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* الكمية والوحدة على اليمين */}
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            minWidth: '45px'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '13px',
                                                                fontWeight: 'bold',
                                                                color: '#2980b9'
                                                            }}>
                                                                {item.totalQuantity}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '8px',
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
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '60px 20px', 
                                color: '#6c757d', 
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                <div style={{ marginBottom: '8px', fontSize: '18px' }}>📋</div>
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
                                }}>طلب من • Requested By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ marginBottom: '4px' }}>Name: _______________</div>
                                    <div style={{ marginBottom: '4px' }}>Position: ___________</div>
                                    <div style={{ marginBottom: '4px' }}>Date: _____________</div>
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
                                }}>موافق من • Approved By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ marginBottom: '4px' }}>Name: _______________</div>
                                    <div style={{ marginBottom: '4px' }}>Position: ___________</div>
                                    <div style={{ marginBottom: '4px' }}>Date: _____________</div>
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
                                }}>تم الاستلام • Received By</div>
                                <div style={{
                                    borderTop: '2px solid #000',
                                    width: '100px',
                                    margin: '0 auto 10px auto'
                                }}></div>
                                <div style={{
                                    fontSize: '9px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ marginBottom: '4px' }}>Name: _______________</div>
                                    <div style={{ marginBottom: '4px' }}>Position: ___________</div>
                                    <div style={{ marginBottom: '4px' }}>Date: _____________</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
