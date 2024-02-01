import { describe, expect, it } from 'vitest';
import { calculateCoverage } from './utils';

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
