import { describe, expect, it } from 'vitest';

import { formatTier } from './formatTier';

describe('formatTier', () => {
  it('formats supported tiers as Roman numerals', () => {
    expect(formatTier(1)).toBe('I');
    expect(formatTier(5)).toBe('V');
    expect(formatTier(10)).toBe('X');
    expect(formatTier(11)).toBe('XI');
  });

  it('returns Unknown for null', () => {
    expect(formatTier(null)).toBe('Unknown');
  });

  it('returns Unknown for unsupported tier values', () => {
    expect(formatTier(0)).toBe('Unknown');
    expect(formatTier(12)).toBe('Unknown');
  });
});
