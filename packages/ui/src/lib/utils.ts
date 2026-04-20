import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize Arabic text: remove diacritics, tatweel, unify common variants
export function normalizeArabic(input: string): string {
  if (!input) return '';
  let s = input.normalize('NFKC');
  // Remove diacritics (harakat)
  s = s.replace(/[\u064B-\u065F\u0670\u0674\u06D6-\u06ED]/g, '');
  // Remove tatweel/kashida
  s = s.replace(/[\u0640]/g, '');
  // Normalize alef forms to ا
  s = s.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
  // Normalize ya/hamza seats
  s = s.replace(/[\u0649\u0626]/g, '\u064A');
  // Normalize taa marbuta to haa for loose matching (حنفية vs حنفيه)
  s = s.replace(/\u0629/g, '\u0647');
  // Normalize kaf/keheh
  s = s.replace(/[\u06A9]/g, '\u0643');
  // Remove non-letters/digits except spaces
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  // Collapse spaces and lowercase
  s = s.replace(/\s+/g, ' ').trim().toLowerCase();
  return s;
}

export function normalizeText(input: string): string {
  if (!input) return '';
  // Try Arabic normalization first; fallback to lowercase for non-Arabic
  const ar = normalizeArabic(input);
  if (ar) return ar;
  return String(input).toLowerCase();
}

export function includesNormalized(haystack: string, needle: string): boolean {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  return h.includes(n);
}
