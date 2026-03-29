const fs = require('fs');
let code = fs.readFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', 'utf8');

code = code.replace(/const history = useMemo\(\(\) =>\s*getWorkerHistory\(workerId\),\s*\[workerId, accommodationHistory\]\s*\);/,
  `const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    fetchWorkerHistory(workerId).then(data => {
      if (active) setHistory(data || []);
    });
    return () => { active = false; };
  }, [workerId, fetchWorkerHistory]);`
);
fs.writeFileSync('src/app/accommodation/worker-timeline/[id]/page.tsx', code);