const fs = require('fs');
const path = require('path');

const routes = [
    '/accommodation/invoices/[id]',
    '/accommodation/residences/[id]',
    '/accommodation/worker/[id]',
    '/accommodation/worker-timeline/[id]',
    '/api/accommodation/assign/csv',
    '/api/accommodation/assign',
    '/api/accommodation/import-csv',
    '/api/accommodation/reports/daily',
    '/api/accommodation/reports/monthly',
    '/api/accommodation/search',
    '/api/accommodation/transfer',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/auth/refresh',
    '/api/auth/register',
    '/api/auth/webauthn-challenge',
    '/api/auth/webauthn-verify',
    '/api/cache',
    '/api/config/firebase',
    '/api/config',
    '/api/d1',
    '/api/events/list',
    '/api/events',
    '/api/feedback/[id]',
    '/api/feedback',
    '/api/files/[...path]',
    '/api/health',
    '/api/inventory/fix-negative',
    '/api/inventory/mrvs',
    '/api/residences',
    '/api/seed-local-user',
    '/api/setup/reset-auth',
    '/api/translate-item',
    '/api/uploads/diagnostics',
    '/api/uploads/feedback',
    '/api/uploads/mrv-invoice',
    '/api/uploads/mrv',
    '/api/uploads/order-approval',
    '/api/workers/import',
    '/inventory/inventory-audit/[id]/complete',
    '/inventory/inventory-audit/[id]/execute',
    '/inventory/inventory-audit/[id]/reconcile',
    '/inventory/inventory-audit/[id]/review',
    '/inventory/inventory-audit/[id]',
    '/inventory/issue-history/[id]/edit',
    '/inventory/issue-history/[id]',
    '/inventory/orders/[id]/edit-plan',
    '/inventory/orders/[id]/edit',
    '/inventory/orders/[id]',
    '/inventory/receive/[id]',
    '/inventory/receive/approvals/[id]',
    '/inventory/receive/receipts/[id]/edit',
    '/inventory/receive/receipts/[id]',
    '/inventory/reports/reconciliations/[id]',
    '/inventory/service-orders/[id]'
];

const baseDir = path.join(process.cwd(), 'src', 'app');

routes.forEach(route => {
    const dirPath = path.join(baseDir, route);
    const extensions = ['page.tsx', 'page.ts', 'route.ts', 'route.tsx'];

    let found = false;
    for (const ext of extensions) {
        const filePath = path.join(dirPath, ext);
        if (fs.existsSync(filePath)) {
            updateFile(filePath);
            found = true;
            break;
        }
    }
    if (!found) {
        console.warn(`Could not find file for route: ${route}`);
    }
});

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // check if runtime exported
    if (content.includes('export const runtime')) {
        if (content.match(/export const runtime\s*=\s*['"]edge['"]/)) {
            console.log(`Already edge: ${filePath}`);
            return;
        }
        // replace nodejs or other with edge
        console.log(`Updating runtime to edge: ${filePath}`);
        content = content.replace(/export const runtime\s*=\s*['"][^'"]+['"]/, "export const runtime = 'edge'");
    } else {
        // append it
        console.log(`Adding runtime edge: ${filePath}`);
        content += "\n\nexport const runtime = 'edge';\n";
    }

    // Also comment out getAdminDb if it comes from firebase-admin and file is weird?
    // Actually checking imports is hard with regex, let's trust the build system 
    // after setting runtime=edge.

    fs.writeFileSync(filePath, content, 'utf8');
}
