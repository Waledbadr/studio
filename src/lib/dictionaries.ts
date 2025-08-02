
const en = {
    // General
    viewAll: 'View All',
    location: 'Location',
    status: 'Status',
    orderId: 'Order ID',
    mivId: 'MIV ID',
    date: 'Date',
    loading: 'Loading...',

    // Header
    changeLanguage: 'Change Language',
    notifications: 'Notifications',
    myAccount: 'My Account',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',

    // Sidebar
    sidebar: {
        // Main Section
        main: 'Main',
        dashboard: 'Dashboard',
        maintenance: 'Maintenance',
        
        // Stock Management Section
        stockManagement: 'Stock Management',
        inventory: 'Inventory',
        stockReconciliation: 'Stock Reconciliation',
        depreciation: 'Depreciation',
        stockTransfer: 'Stock Transfer',
        
        // Material Movement Section
        materialMovement: 'Material Movement',
        materialRequests: 'Material Requests',
        receiveMaterials: 'Receive Materials',
        issueMaterials: 'Issue Materials',
        
        // Reports Section
        reports: 'Reports',
        stockMovementReport: 'Stock Movement Report',
        lifespanReport: 'Lifespan Report',
        
        // Settings Section
        settings: 'Settings',
        residences: 'Residences',
        users: 'Users',
        aiTools: 'AI Tools',
        setup: 'Setup',
        
        // Legacy items
        stockTransferHistory: 'Transfer History'
    },

    // Dashboard Page
    dashboard: {
        totalRequests: 'Total Requests',
        totalMaintenanceRequests: 'Total maintenance requests',
        pending: 'Pending',
        requestsNeedAttention: 'Requests that need attention',
        completed: 'Completed',
        completedRequests: 'Completed requests',
        recentMaintenance: 'Recent Maintenance',
        noMaintenanceRequestsFound: 'No maintenance requests found.',
        recentMaterialRequests: 'Recent Material Requests',
        noMaterialRequestsFound: 'No material requests found.',
        recentReceipts: 'Recent Receipts',
        noRecentReceiptsFound: 'No recent receipts found.',
        recentIssues: 'Recent Issues',
        noRecentIssuesFound: 'No recent issues found.',
    },
};

const ar: typeof en = {
    // General
    viewAll: 'عرض الكل',
    location: 'الموقع',
    status: 'الحالة',
    orderId: 'رقم الطلب',
    mivId: 'رقم المذكرة',
    date: 'التاريخ',
    loading: 'جار التحميل...',

    // Header
    changeLanguage: 'تغيير اللغة',
    notifications: 'الإشعارات',
    myAccount: 'حسابي',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',

    // Sidebar
    sidebar: {
        // Main Section
        main: 'الرئيسي',
        dashboard: 'الرئيسية',
        maintenance: 'الصيانة',
        
        // Stock Management Section
        stockManagement: 'إدارة المخزون',
        inventory: 'المخزون',
        stockReconciliation: 'تسوية المخزون',
        depreciation: 'الإهلاك',
        stockTransfer: 'تحويل مخزني',
        
        // Material Movement Section
        materialMovement: 'حركة المواد',
        materialRequests: 'طلبات المواد',
        receiveMaterials: 'استلام المواد',
        issueMaterials: 'صرف المواد',
        
        // Reports Section
        reports: 'التقارير',
        stockMovementReport: 'تقرير حركة المخزون',
        lifespanReport: 'تقرير العمر الافتراضي',
        
        // Settings Section
        settings: 'الإعدادات',
        residences: 'المجمعات السكنية',
        users: 'المستخدمون',
        aiTools: 'أدوات الذكاء الاصطناعي',
        setup: 'الإعدادات',
        
        // Legacy items
        stockTransferHistory: 'سجل التحويلات'
    },

    // Dashboard Page
    dashboard: {
        totalRequests: 'إجمالي الطلبات',
        totalMaintenanceRequests: 'إجمالي طلبات الصيانة',
        pending: 'قيد الانتظار',
        requestsNeedAttention: 'طلبات تحتاج إلى متابعة',
        completed: 'مكتملة',
        completedRequests: 'الطلبات المكتملة',
        recentMaintenance: 'صيانة حديثة',
        noMaintenanceRequestsFound: 'لم يتم العثور على طلبات صيانة.',
        recentMaterialRequests: 'طلبات مواد حديثة',
        noMaterialRequestsFound: 'لم يتم العثور على طلبات مواد.',
        recentReceipts: 'استلامات حديثة',
        noRecentReceiptsFound: 'لم يتم العثور على استلامات حديثة.',
        recentIssues: 'مذكرات صرف حديثة',
        noRecentIssuesFound: 'لم يتم العثور على مذكرات صرف حديثة.',
    },
};

export const dictionaries = { en, ar };
export type Dictionary = typeof en;
