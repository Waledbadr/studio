const fs = require('fs');
let code = fs.readFileSync('src/app/accommodation/invoices/[id]/page.tsx', 'utf8');

// 1. replace getHistoryByDateRange from useAccommodation
code = code.replace(
  'const { invoices, companies, getHistoryByDateRange, workers, occupants, residences, contracts } = useAccommodation();',
  'const { invoices, companies, fetchHistoryByDateRange, workers, occupants, residences, contracts } = useAccommodation();'
);

// 2. replace getHistoryByDateRange from getHistoryByDateRange(invoice.startDate, invoice.endDate)
code = code.replace(
  /const workerDetails = useMemo\(\(\): WorkerInvoiceDetail\[\] => \{([\s\S]*?)return details;\s*\}, \[.*?\]\);/m,
  (match, inner) => {
    let replacedInner = inner.replace('const periodHistory = getHistoryByDateRange(invoice.startDate, invoice.endDate);', 
      'const periodHistory = await fetchHistoryByDateRange(invoice.startDate, invoice.endDate);');
    return `const [workerDetails, setWorkerDetails] = useState<WorkerInvoiceDetail[]>([]);
  
  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
    ${replacedInner}
      if (active) {
        setWorkerDetails(details);
      }
    };
    fetchDetails();
    return () => { active = false; };
  }, [invoice, company, workers, occupants, residences, contract, fetchHistoryByDateRange]);`
  }
);

if (!code.includes('useState')) {
  code = code.replace('import { useEffect, useMemo', 'import { useEffect, useMemo, useState');
}

fs.writeFileSync('src/app/accommodation/invoices/[id]/page.tsx', code);