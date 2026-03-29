const fs = require('fs');
const path = require('path');
const file = path.join('src', 'app', 'accommodation', 'worker-timeline', '[id]', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('getWorkerHistory,', 'fetchWorkerHistory,');
content = content.replace('accommodationHistory,', '');

content = content.replace(
  /const history = useMemo\(\(\) =>\s+getWorkerHistory\(workerId\),\s+\[workerId, accommodationHistory\]\s+\);/,
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    let isMounted = true;
    if (workerId) {
      fetchWorkerHistory(workerId).then(data => {
        if (isMounted) setHistory(data);
      });
    }
    return () => { isMounted = false; };
  }, [workerId, fetchWorkerHistory]);
);

fs.writeFileSync(file, content);
console.log('patched timeline page');
