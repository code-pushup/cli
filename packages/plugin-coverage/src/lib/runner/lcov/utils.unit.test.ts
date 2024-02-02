import { describe, expect, it } from 'vitest';
import { calculateCoverage, mergeConsecutiveNumbers } from './utils';

describe('calculateCoverage', () => {
  it('should calculate coverage for one type of report', () => {
    expect(calculateCoverage(1, 2)).toBe(0.5);
  });

  it('should calculate zero coverage when no entity was covered', () => {
    expect(calculateCoverage(0, 25)).toBe(0);
  });

  it('should calculate zero coverage when no entity was covered or found', () => {
    expect(calculateCoverage(0, 0)).toBe(0);
  });
});

describe('mergeConsecutiveNumbers', () => {
  it('should leave non-consecutive numbers separate', () => {
    expect(mergeConsecutiveNumbers([1, 4, 6])).toEqual([
      { start: 1 },
      { start: 4 },
      { start: 6 },
    ]);
  });

  it('should merge consecutive numbers', () => {
    expect(mergeConsecutiveNumbers([1, 3, 4, 5, 6, 8, 9])).toEqual([
      { start: 1 },
      { start: 3, end: 6 },
      { start: 8, end: 9 },
    ]);
  });

  it('should handle unsorted arrays', () => {
    expect(mergeConsecutiveNumbers([1, 6, 4, 3, 7])).toEqual([
      { start: 1 },
      { start: 3, end: 4 },
      { start: 6, end: 7 },
    ]);
  });

  it('should return empty array for no numbers', () => {
    expect(mergeConsecutiveNumbers([])).toEqual([]);
  });
});
