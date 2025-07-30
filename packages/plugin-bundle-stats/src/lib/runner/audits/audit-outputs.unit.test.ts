import { describe, expect, it } from 'vitest';
import { calculateTotalBytes, generateAuditOutputs } from './audit-outputs.js';

describe('calculateTotalBytes', () => {
  it('should calculate total bytes from empty stats', () => {
    expect(calculateTotalBytes({})).toBe(0);
  });

  it('should calculate total bytes from multiple outputs', () => {
    expect(
      calculateTotalBytes({
        'bundle.js': {
          path: 'bundle.js',
          bytes: 1000,
        },
        'vendor.js': {
          path: 'vendor.js',
          bytes: 2500,
        },
        'styles.css': {
          path: 'styles.css',
          bytes: 500,
        },
      }),
    ).toBe(4000);
  });
});

describe('createAuditOutput', () => {
  // All tests removed
});

describe('generateAuditOutputs', () => {
  it('should generate empty audit when no artifacts match selection', () => {
    expect(
      generateAuditOutputs(
        {
          'main.css': { path: 'main.css', bytes: 1000 },
        },
        [
          {
            title: 'JS Bundle',
            slug: 'js-bundle',
            description: 'JS bundle analysis',
            selection: {
              mode: 'matchingOnly',
              includeOutputs: ['**/*.js'],
              excludeOutputs: [],
              includeInputs: [],
              excludeInputs: [],
            },
            scoring: {
              mode: 'onlyMatching',
              totalSize: [1000, 10000],
            },
          },
        ],
      ),
    ).toStrictEqual([
      expect.objectContaining({
        slug: 'js-bundle',
        score: 0,
        value: 0,
        displayValue: '0 B (0 files)',
      }),
    ]);
  });
});
