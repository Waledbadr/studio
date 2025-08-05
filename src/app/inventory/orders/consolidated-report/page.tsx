'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders, type Order, type OrderItem } from '@/context/orders-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
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
}

interface GroupedAggregatedItems {
    [category: string]: AggregatedItem[];
}

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
            uniqueResidenceNames.add(order.residence);
            order.items.forEach(item => {
                const existing = itemMap.get(item.id);
                if (existing) {
                    existing.totalQuantity += item.quantity;
                } else {
                    itemMap.set(item.id, {
                        id: item.id,
                        nameAr: item.nameAr,
                        nameEn: item.nameEn,
                        category: item.category || 'Uncategorized',
                        unit: item.unit,
                        totalQuantity: item.quantity
                    });
                }
            });
        });

        const sortedItems = Array.from(itemMap.values()).sort((a,b) => a.nameAr.localeCompare(b.nameAr));
        
        const grouped = sortedItems.reduce((acc, item) => {
            const category = item.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as GroupedAggregatedItems);
        
        return { 
            groupedItems: grouped, 
            residenceNames: Array.from(uniqueResidenceNames),
            totalItems: sortedItems.length,
            totalCategories: Object.keys(grouped).length
        };
        
    }, [orders, loading, currentUser]);
    
    const handlePrint = () => {
        window.print();
    }
    
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
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
        <div className="space-y-6">
             <style jsx global>{`
                @page {
                    size: A4;
                    margin: 8mm;
                }
                @media print {
                  body {
                    -webkit-print-color-adjust: exact;
                    font-family: 'Arial', sans-serif !important;
                    font-size: 9px !important;
                    line-height: 1.2 !important;
                  }
                  .printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background-color: white !important;
                    color: black !important;
                  }
                   .no-print {
                       display: none !important;
                   }
                   
                   /* Header Section */
                   .report-header {
                       display: flex !important;
                       justify-content: space-between !important;
                       align-items: flex-start !important;
                       margin-bottom: 15px !important;
                       padding: 10px 15px !important;
                       border: 2px solid #000 !important;
                       border-radius: 8px !important;
                       background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
                   }
                   
                   .header-left {
                       flex: 1 !important;
                   }
                   
                   .main-title {
                       font-size: 20px !important;
                       font-weight: bold !important;
                       color: #000 !important;
                       margin-bottom: 3px !important;
                       text-transform: uppercase !important;
                       letter-spacing: 0.5px !important;
                   }
                   
                   .main-title-ar {
                       font-size: 16px !important;
                       font-weight: bold !important;
                       color: #333 !important;
                       margin-bottom: 8px !important;
                   }
                   
                   .header-right {
                       text-align: right !important;
                       border-left: 2px solid #007bff !important;
                       padding-left: 15px !important;
                   }
                   
                   .company-info {
                       font-size: 10px !important;
                       font-weight: bold !important;
                       margin-bottom: 2px !important;
                       color: #007bff !important;
                   }
                   
                   .report-date {
                       font-size: 9px !important;
                       color: #666 !important;
                       background-color: #fff3cd !important;
                       padding: 2px 6px !important;
                       border-radius: 3px !important;
                       border: 1px solid #ffeeba !important;
                   }
                   
                   /* Locations Tags */
                   .locations-section {
                       margin-bottom: 15px !important;
                       text-align: center !important;
                   }
                   
                   .locations-title {
                       font-size: 11px !important;
                       font-weight: bold !important;
                       margin-bottom: 5px !important;
                       color: #495057 !important;
                   }
                   
                   .locations-tags {
                       display: flex !important;
                       justify-content: center !important;
                       gap: 8px !important;
                       flex-wrap: wrap !important;
                   }
                   
                   .location-badge {
                       background: linear-gradient(135deg, #007bff, #0056b3) !important;
                       color: white !important;
                       padding: 4px 12px !important;
                       border-radius: 15px !important;
                       font-size: 9px !important;
                       font-weight: 600 !important;
                       box-shadow: 0 2px 4px rgba(0,123,255,0.3) !important;
                       border: 1px solid #0056b3 !important;
                   }
                   
                   /* Main Content Grid */
                   .content-grid {
                       display: grid !important;
                       grid-template-columns: repeat(3, 1fr) !important;
                       gap: 8px !important;
                       margin-bottom: 15px !important;
                   }
                   
                   .category-container {
                       border: 1.5px solid #343a40 !important;
                       border-radius: 6px !important;
                       overflow: hidden !important;
                       break-inside: avoid !important;
                       background-color: white !important;
                       box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                   }
                   
                   .category-header {
                       background: linear-gradient(135deg, #495057, #343a40) !important;
                       color: white !important;
                       padding: 6px 8px !important;
                       font-size: 10px !important;
                       font-weight: bold !important;
                       text-align: center !important;
                       text-transform: uppercase !important;
                       letter-spacing: 0.3px !important;
                   }
                   
                   .category-body {
                       padding: 0 !important;
                       max-height: 200px !important;
                       overflow: hidden !important;
                   }
                   
                   .item-row {
                       display: flex !important;
                       justify-content: space-between !important;
                       align-items: flex-start !important;
                       padding: 4px 6px !important;
                       border-bottom: 1px solid #e9ecef !important;
                       min-height: 24px !important;
                   }
                   
                   .item-row:last-child {
                       border-bottom: none !important;
                   }
                   
                   .item-row:nth-child(even) {
                       background-color: #f8f9fa !important;
                   }
                   
                   .item-info {
                       flex: 1 !important;
                       margin-right: 6px !important;
                   }
                   
                   .item-name-ar {
                       font-size: 8px !important;
                       font-weight: 600 !important;
                       color: #000 !important;
                       line-height: 1.2 !important;
                       margin-bottom: 1px !important;
                   }
                   
                   .item-name-en {
                       font-size: 7px !important;
                       color: #6c757d !important;
                       line-height: 1.1 !important;
                       font-style: italic !important;
                   }
                   
                   .item-quantity {
                       font-size: 11px !important;
                       font-weight: bold !important;
                       color: #007bff !important;
                       white-space: nowrap !important;
                       text-align: right !important;
                       min-width: 35px !important;
                   }
                   
                   .item-unit {
                       font-size: 7px !important;
                       color: #6c757d !important;
                       margin-left: 2px !important;
                       font-weight: normal !important;
                   }
                   
                   /* Summary Section */
                   .summary-section {
                       margin: 15px 0 !important;
                       padding: 8px 12px !important;
                       background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
                       border: 1px solid #2196f3 !important;
                       border-radius: 6px !important;
                   }
                   
                   .summary-title {
                       font-size: 10px !important;
                       font-weight: bold !important;
                       color: #1976d2 !important;
                       margin-bottom: 5px !important;
                   }
                   
                   .summary-grid {
                       display: grid !important;
                       grid-template-columns: repeat(4, 1fr) !important;
                       gap: 10px !important;
                   }
                   
                   .summary-item {
                       text-align: center !important;
                       padding: 4px !important;
                       background-color: white !important;
                       border-radius: 4px !important;
                       border: 1px solid #e0e0e0 !important;
                   }
                   
                   .summary-label {
                       font-size: 7px !important;
                       color: #666 !important;
                       margin-bottom: 2px !important;
                   }
                   
                   .summary-value {
                       font-size: 9px !important;
                       font-weight: bold !important;
                       color: #1976d2 !important;
                   }
                   
                   /* Footer Section */
                   .footer-section {
                       margin-top: 20px !important;
                       border-top: 2px solid #000 !important;
                       padding-top: 12px !important;
                   }
                   
                   .signatures-grid {
                       display: grid !important;
                       grid-template-columns: repeat(3, 1fr) !important;
                       gap: 25px !important;
                   }
                   
                   .signature-box {
                       text-align: center !important;
                       border: 1px solid #dee2e6 !important;
                       border-radius: 6px !important;
                       padding: 8px 6px !important;
                       background-color: #f8f9fa !important;
                   }
                   
                   .signature-title {
                       font-size: 9px !important;
                       font-weight: bold !important;
                       margin-bottom: 15px !important;
                       color: #495057 !important;
                   }
                   
                   .signature-line {
                       border-top: 1.5px solid #000 !important;
                       width: 80px !important;
                       margin: 0 auto 8px auto !important;
                   }
                   
                   .signature-labels {
                       font-size: 7px !important;
                       color: #6c757d !important;
                   }
                   
                   .signature-field {
                       margin-bottom: 3px !important;
                   }
                   
                   /* Print Optimization */
                   .page-break {
                       page-break-after: always !important;
                   }
                   
                   .no-break {
                       break-inside: avoid !important;
                   }
                }
            `}</style>
            
            <div className="flex items-center justify-between no-print mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requests
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    طباعة التقرير (Print Report)
                </Button>
            </div>

             <Card className="printable-area">
                {/* Enhanced Header */}
                <div className="report-header">
                    <div className="header-left">
                        <div className="main-title">Consolidated Pending Requests</div>
                        <div className="main-title-ar">الطلبات المجمعة المعلقة</div>
                    </div>
                    <div className="header-right">
                        <div className="company-info">Gypsum Factory</div>
                        <div className="company-info">New Logistics Hub</div>
                        <div className="company-info">Um Al-Salam</div>
                        <div className="report-date">
                            Report Date: {format(new Date(), 'MMMM do, yyyy')}
                        </div>
                    </div>
                </div>

                {/* Locations Section */}
                {residenceNames.length > 0 && (
                    <div className="locations-section">
                        <div className="locations-title">
                            المواقع المطلوبة • Requested Locations
                        </div>
                        <div className="locations-tags">
                            {residenceNames.map((name) => (
                                <span key={name} className="location-badge">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="summary-section">
                    <div className="summary-title">ملخص الطلب • Request Summary</div>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="summary-label">Total Categories</div>
                            <div className="summary-value">{totalCategories}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">Total Items</div>
                            <div className="summary-value">{totalItems}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">Locations</div>
                            <div className="summary-value">{residenceNames.length}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">Status</div>
                            <div className="summary-value">Pending</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <CardContent style={{ padding: '0' }}>
                    {Object.keys(groupedItems).length > 0 ? (
                        <div className="content-grid">
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <div key={category} className="category-container no-break">
                                    <div className="category-header">
                                        {category}
                                    </div>
                                    <div className="category-body">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="item-row">
                                                <div className="item-info">
                                                    <div className="item-name-ar">
                                                        {item.nameAr}
                                                    </div>
                                                    <div className="item-name-en">
                                                        {item.nameEn}
                                                    </div>
                                                </div>
                                                <div className="item-quantity">
                                                    {item.totalQuantity}
                                                    <span className="item-unit">{item.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            No pending material requests found.
                        </div>
                    )}
                </CardContent>

                {/* Enhanced Footer */}
                <div className="footer-section">
                    <div className="signatures-grid">
                        <div className="signature-box">
                            <div className="signature-title">طلب من • Requested By</div>
                            <div className="signature-line"></div>
                            <div className="signature-labels">
                                <div className="signature-field">Name: _______________</div>
                                <div className="signature-field">Position: ___________</div>
                                <div className="signature-field">Date: _____________</div>
                            </div>
                        </div>
                        <div className="signature-box">
                            <div className="signature-title">موافق من • Approved By</div>
                            <div className="signature-line"></div>
                            <div className="signature-labels">
                                <div className="signature-field">Name: _______________</div>
                                <div className="signature-field">Position: ___________</div>
                                <div className="signature-field">Date: _____________</div>
                            </div>
                        </div>
                        <div className="signature-box">
                            <div className="signature-title">تم الاستلام • Received By</div>
                            <div className="signature-line"></div>
                            <div className="signature-labels">
                                <div className="signature-field">Name: _______________</div>
                                <div className="signature-field">Position: ___________</div>
                                <div className="signature-field">Date: _____________</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
