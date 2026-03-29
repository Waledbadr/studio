const fs = require('fs');
const path = require('path');
const file = path.join('src', 'app', 'accommodation', 'timeline-reports', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace('getHistoryByDateRange,', 'fetchHistoryByDateRange,');
content = content.replace(
  /const filteredHistory = useMemo\(\(\) => \{.+?return history;\r?\n  \}, \[startDate, endDate, actionTypeFilter, residenceFilter, accommodationHistory\]\);/s,
  const [filteredHistory, setFilteredHistory] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        let history = await fetchHistoryByDateRange(
          startDate + 'T00:00:00.000Z',
          endDate + 'T23:59:59.999Z'
        );

        if (actionTypeFilter !== 'ALL') {
          history = history.filter(h => h.actionType === actionTypeFilter);
        }

        if (residenceFilter !== 'ALL') {
          history = history.filter(h =>
            h.residenceId === residenceFilter ||
            h.fromResidenceId === residenceFilter ||
            h.toResidenceId === residenceFilter
          );
        }

        if (isMounted) setFilteredHistory(history);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [startDate, endDate, actionTypeFilter, residenceFilter, fetchHistoryByDateRange]);
);
fs.writeFileSync(file, content);
console.log('patched');
