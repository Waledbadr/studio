const fs = require('fs');
const path = 'd:/EstateCare/studio/src/lib/dictionaries.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('timesheet: {')) {
  // Add an empty timesheet and common object to 'en'
  content = content.replace(/export const en = \{/g, `export const en = {
  timesheet: {} as Record<string, string>,
  common: { search: 'Search' } as Record<string, string>,`);

  // Add an empty timesheet and common object to 'ar'
  content = content.replace(/export const ar = \{/g, `export const ar = {
  timesheet: {} as Record<string, string>,
  common: { search: 'بحث' } as Record<string, string>,`);
  fs.writeFileSync(path, content);
  console.log('Added missing dict keys.');
} else {
  console.log('Keys already exist.');
}
