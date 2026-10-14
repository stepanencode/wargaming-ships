const ROMAN_TIERS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
};

export function formatTier(tier: number | null): string {
  if (tier === null) {
    return 'Unknown';
  }

  return ROMAN_TIERS[tier] ?? 'Unknown';
}
