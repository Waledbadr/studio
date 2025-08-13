import { normalizeText } from './utils';

// Centralized Arabic synonyms for item search. Extend as needed.
export const AR_SYNONYMS: Record<string, string[]> = {
  // Faucet
  'حنفية': ['صنبور', 'بزبوز', 'حنفيه', 'محبس'],
  // Paint
  'دهان': ['بوية', 'بويه', 'طلاء', 'صبغ', 'دهانات'],
};

export function buildNormalizedSynonyms(map: Record<string, string[]>) {
  const m = new Map<string, Set<string>>();
  for (const [canonical, arr] of Object.entries(map)) {
    const canonN = normalizeText(canonical);
    const set = new Set(arr.map(normalizeText));
    m.set(canonN, set);
  }
  return m as Map<string, Set<string>>;
}
