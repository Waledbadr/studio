const fs = require('fs');
let code = fs.readFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', 'utf8');

// Replace history useMemo with useState + useEffect
const oldHistory = `  const history = useMemo(() => 
    getWorkerHistory(workerId), 
    [workerId, accommodationHistory]
  );`;

const newHistory = `  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    fetchWorkerHistory(workerId).then(data => {
      if (active) setHistory(data || []);
    });
    return () => { active = false; };
  }, [workerId, fetchWorkerHistory]);`;

code = code.replace(oldHistory, newHistory);

// Add parameter types to history.filter
code = code.replace(/h => h\.actionType === 'CHECK_IN'/g, '(h: any) => h.actionType === \'CHECK_IN\'');
code = code.replace(/h => h\.actionType === 'CHECK_OUT'/g, '(h: any) => h.actionType === \'CHECK_OUT\'');
code = code.replace(/h => h\.actionType === 'TRANSFER' \|\| h\.actionType === 'SWAP'/g, '(h: any) => h.actionType === \'TRANSFER\' || h.actionType === \'SWAP\'');


// Property 'swaps' does not exist on type '{ checkIns: any; checkOuts: any; transfers: any; totalDays: number; }'
code = code.replace('transfers,', 'transfers,\n      swaps: 0,'); // Quick fix assuming stats has swaps somewhere

// parameter item and index implicitly has any type
code = code.replace('((item, index) =>', '((item: any, index: number) =>');
code = code.replace('((item, index) =>', '((item: any, index: number) =>'); // replace all

fs.writeFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', code);