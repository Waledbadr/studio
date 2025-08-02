
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

export const dictionaries = { en };
export type Dictionary = typeof en;
