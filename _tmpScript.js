const fs = require('fs');
const path = 'd:/EstateCare/studio/src/app/timesheet/history/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add where to firestore imports
code = code.replace(
  /import \{ collection, query, orderBy, limit, onSnapshot \} from 'firebase\/firestore';/,
  \import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';\
);

// 2. Remove the old useEffect, getFiscalMonthString, availableMonths, and the old daysArray
code = code.replace(
  /  useEffect\(\(\) => \{[\s\S]+?  \}, \[filterMonth\]\);/s,
  \  // Calculate days in selected fiscal month using company standard
  const { startDate, endDate, daysArray } = useMemo(() => {
    if (!filterMonth) return { startDate: new Date(), endDate: new Date(), daysArray: [] };

    const period = getFiscalMonthPeriod(filterMonth);
    const start = period.startDate;
    const end = period.endDate;

    const days = [];
    const current = new Date(start);
    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      days.push(\\\\-\-\\\\);
      current.setDate(current.getDate() + 1);
    }

    return { startDate: start, endDate: end, daysArray: days };
  }, [filterMonth]);

  // Generate list of available fiscal months statically (last 24 months)
  const availableMonths = useMemo(() => {
    const months = [];
    let currentVar = new Date();
    currentVar.setDate(15);
    for (let i = 0; i < 24; i++) {
        const yy = currentVar.getFullYear();
        const mm = currentVar.getMonth() + 1;
        months.push(\\\\-\\\\);
        currentVar.setMonth(currentVar.getMonth() - 1);
    }
    if (!months.includes(defaultMonth)) months.unshift(defaultMonth);
    return Array.from(new Set(months)).sort().reverse();
  }, [defaultMonth]);

  useEffect(() => {
    setLoading(true);
    loadResidences();

    const empsUnsub = onSnapshot(collection(db, 'housingEmployees'), (snap) => {
      const emps = {};
      snap.forEach(d => {
        emps[d.data().employeeId] = { id: d.id, ...d.data() };
      });
      setEmployeesMap(emps);
    });

    const lq = query(collection(db, 'timesheetLeaves'), orderBy('createdAt', 'desc'), limit(1000));
    const leavesUnsub = onSnapshot(lq, (snap) => setLeaves(snap.docs.map(d => d.data())));

    let unsubscribe = () => {};

    if (daysArray.length > 0) {
      const dateStartStr = daysArray[0];
      const dateEndStr = daysArray[daysArray.length - 1];

      // Fetch only the records in the selected month interval to prevent limit truncations
      const q = query(
        collection(db, 'attendanceRecords'),
        where('date', '>=', dateStartStr),
        where('date', '<=', dateEndStr),
        orderBy('date', 'desc'),
        limit(15000)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecords(fetchedRecords);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching records:', error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      unsubscribe();
      empsUnsub();
      leavesUnsub();
    };
  }, [daysArray]);\
);

// 3. Remove getFiscalMonthString usage inside record processing since our query does it
code = code.replace(
  /      \/\/ Only include records for the selected fiscal month\n      const recordFiscalMonth = getFiscalMonthString\(record\.date\);\n      if \(recordFiscalMonth !== filterMonth\) return;/g,
  \      // Only include records that fall within the selected fiscal days array
      if (!daysArray.includes(record.date)) return;\
);

fs.writeFileSync(path, code);
console.log('Update Complete!');
