import { execSync } from 'child_process';
import fs from 'fs';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const accId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const token = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';

const query = "SELECT 'workers' as tbl, count(*) as cnt FROM workers UNION ALL SELECT 'residences', count(*) FROM residences UNION ALL SELECT 'occupants', count(*) FROM occupants UNION ALL SELECT 'accommodation_history', count(*) FROM accommodation_history UNION ALL SELECT 'companies', count(*) FROM companies UNION ALL SELECT 'contracts', count(*) FROM contracts UNION ALL SELECT 'invoices', count(*) FROM invoices UNION ALL SELECT 'transfer_requests', count(*) FROM transfer_requests UNION ALL SELECT 'notifications', count(*) FROM notifications UNION ALL SELECT 'assignments', count(*) FROM assignments UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs UNION ALL SELECT 'counters', count(*) FROM counters UNION ALL SELECT 'feedback', count(*) FROM feedback UNION ALL SELECT 'inventory', count(*) FROM inventory UNION ALL SELECT 'inventory_categories', count(*) FROM inventory_categories UNION ALL SELECT 'inventory_transactions', count(*) FROM inventory_transactions UNION ALL SELECT 'mivs', count(*) FROM mivs UNION ALL SELECT 'mrv_requests', count(*) FROM mrv_requests UNION ALL SELECT 'mrvs', count(*) FROM mrvs UNION ALL SELECT 'orders', count(*) FROM orders UNION ALL SELECT 'reconciliation_requests', count(*) FROM reconciliation_requests UNION ALL SELECT 'service_orders', count(*) FROM service_orders UNION ALL SELECT 'stock_reconciliations', count(*) FROM stock_reconciliations UNION ALL SELECT 'unique_users_emails', count(*) FROM unique_users_emails UNION ALL SELECT 'users', count(*) FROM users;";

try {
    const res = execSync(`npx wrangler d1 execute estatecare --command="${query.replace(/"/g, '""')}" --remote --yes`, {
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accId, CLOUDFLARE_API_TOKEN: token }
    });
    console.log(res.toString());
} catch (e) {
    console.error('Final Verification Failed:', e.message);
}
