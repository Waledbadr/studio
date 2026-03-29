const fs = require('fs');
let context = fs.readFileSync('src/app/accommodation/invoices/[id]/page.tsx', 'utf8');
context = context.replace('const { invoices, companies, getHistoryByDateRange, workers, occupants, residences, contracts } = useAccommodation();', 'const { invoices, companies, fetchHistoryByDateRange, workers, occupants, residences, contracts } = useAccommodation();');
context = context.replace(/const workerDetails = useMemo\(\(\): WorkerInvoiceDetail\[\] => {[\s\S]*?}, \[.([\n\s\S]*)?\l+?]\);/g, `M'd off by regex`);
fs.writeFileSync('deu2.js', context);