const fs = require('fs');
let code = fs.readFileSync('src/app/accommodation/invoices/[id]/page.tsx', 'utf8');

let startIndex = code.indexOf('const workerDetails = useMemo((): WorkerInvoiceDetail[] => {');
let endStr = '}, [invoice, company, workers, occupants, accommodationHistory, residences, contract, getHistoryByDateRange]);';
let endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  let inner = code.substring(startIndex, endIndex);
  
  // replace the first line
  inner = inner.replace('const workerDetails = useMemo((): WorkerInvoiceDetail[] => {', 
    'const [workerDetails, setWorkerDetails] = useState<WorkerInvoiceDetail[]>([]);\n\n  useEffect(() => {\n    let active = true;\n    const fetchDetails = async () => {');
  
  // replace the history call
  inner = inner.replace('const periodHistory = getHistoryByDateRange(invoice.startDate, invoice.endDate);',
    'const periodHistory = await fetchHistoryByDateRange(invoice.startDate, invoice.endDate);');

  // replace the return details;
  inner = inner.replace(/return details;\s*$/, 'if (active) setWorkerDetails(details);\n    };\n    fetchDetails();\n    return () => { active = false; };');
  
  let newFull = code.substring(0, startIndex) + inner + '  }, [invoice, company, workers, occupants, residences, contract, fetchHistoryByDateRange]);' + code.substring(endIndex + endStr.length);
  
  if (!newFull.includes('useState')) {
    newFull = newFull.replace('import { useEffect, useMemo', 'import { useEffect, useMemo, useState');
  }
  
  // Also fix the const { invoices, companies, getHistoryByDateRange... } = useAccommodation();
  newFull = newFull.replace(
    'const { invoices, companies, getHistoryByDateRange, workers, occupants, residences, contracts } = useAccommodation();',
    'const { invoices, companies, fetchHistoryByDateRange, workers, occupants, residences, contracts } = useAccommodation();'
  );
  
  fs.writeFileSync('src/app/accommodation/invoices/[id]/page.tsx', newFull);
  console.log("Success");
} else {
  console.log("Not found", startIndex, endIndex);
}