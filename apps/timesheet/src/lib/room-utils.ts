export function computeArea(length?: number, width?: number): number | undefined {
  if (typeof length === 'number' && typeof width === 'number' && !isNaN(length) && !isNaN(width)) {
    return length * width;
  }
  return undefined;
}

export function computeCapacity(area?: number): number | undefined {
  if (typeof area === 'number' && !isNaN(area)) {
    return Math.max(1, Math.floor(area / 4));
  }
  return undefined;
}

// Parse a spec like "5x4", "5×4", or a plain number string representing area
export function parseSpec(spec: string): { length?: number; width?: number; area?: number } {
  const s = spec.trim();
  const dimMatch = s.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)$/);
  if (dimMatch) {
    const l = Number(dimMatch[1]);
    const w = Number(dimMatch[2]);
    if (!isNaN(l) && !isNaN(w)) return { length: l, width: w, area: l * w };
  }
  const num = Number(s);
  if (!isNaN(num)) return { area: num };
  return {};
}
