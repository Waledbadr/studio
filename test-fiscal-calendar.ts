import { getFiscalMonthPeriod } from './src/lib/fiscal-month-utils';

// Helper to format UTC dates
const formatUTC = (date: Date) => {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

console.log('السنة\tالشهر\tبداية الفترة\tنهاية الفترة\tعدد الأيام');
console.log('='.repeat(80));

// Generate for years 2025, 2026, 2027
for (const year of [2025, 2026, 2027]) {
  for (let month = 1; month <= 12; month++) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'short' });
    const period = getFiscalMonthPeriod(monthStr);
    
    const startFormatted = formatUTC(period.startDate);
    const endFormatted = formatUTC(period.endDate);
    
    console.log(`${year}\t${monthName} - ${String(month).padStart(2, '0')}\t${startFormatted}\t${endFormatted}\t${period.numberOfDays}`);
  }
  console.log('-'.repeat(80));
}

// Test specific months
console.log('\n\nاختبار تفصيلي:');
console.log('='.repeat(80));

const testMonths = [
  '2025-01', '2025-02', '2025-03', '2025-12',
  '2026-01', '2026-02', '2026-03'
];

testMonths.forEach(monthStr => {
  const period = getFiscalMonthPeriod(monthStr);
  console.log(`\n${monthStr}:`);
  console.log(`  البداية: ${formatUTC(period.startDate)}`);
  console.log(`  النهاية: ${formatUTC(period.endDate)}`);
  console.log(`  عدد الأيام: ${period.numberOfDays}`);
});
