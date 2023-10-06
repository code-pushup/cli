import { CategoryConfig, Issue } from '@code-pushup/models';
import { describe, expect } from 'vitest';
import {
  calcDuration,
  compareIssueSeverity,
  countOccurrences,
  countWeightedRefs,
  distinct,
  formatBytes,
  slugify,
  sumRefs,
  toArray,
} from './utils';

describe('calcDuration', () => {
  it('should calc the duration correctly if start and stop are given', () => {
    const start = performance.now();
    const stop = performance.now() + 100;
    expect(calcDuration(start, stop)).toBe(100);
  });

  it('should calc the duration correctly if only start is given', () => {
    const start = performance.now();
    expect(calcDuration(start)).toBe(0);
  });
});

describe('countWeightedRefs', () => {
  it('should calc weighted refs only', () => {
    const refs: CategoryConfig['refs'] = [
      {
        slug: 'a1',
        weight: 0,
        plugin: 'a',
        type: 'audit',
      },
      {
        slug: 'a2',
        weight: 1,
        plugin: 'a',
        type: 'audit',
      },
    ];
    expect(countWeightedRefs(refs)).toBe(1);
  });
});

describe('sumRefs', () => {
  it('should sum refs correctly', () => {
    const refs: CategoryConfig['refs'] = [
      {
        slug: 'a1',
        weight: 0,
        plugin: 'a',
        type: 'audit',
      },
      {
        slug: 'a2',
        weight: 1,
        plugin: 'a',
        type: 'audit',
      },
      {
        slug: 'a3',
        weight: 10,
        plugin: 'a',
        type: 'audit',
      },
    ];
    expect(sumRefs(refs)).toBe(11);
  });
});

describe('formatBytes', () => {
  it('should log file sizes in Bytes`', async () => {
    expect(formatBytes(1000)).toBe('1000 B');
  });

  it('should log file sizes in KB`', async () => {
    expect(formatBytes(10000)).toBe('9.77 kB');
  });

  it('should log file sizes in MB`', async () => {
    expect(formatBytes(10000000)).toBe('9.54 MB');
  });

  it('should log file sizes in bytes`', async () => {
    expect(formatBytes(10000000000)).toBe('9.31 GB');
  });

  it('should log file sizes in TB`', async () => {
    expect(formatBytes(10000000000000)).toBe('9.09 TB');
  });

  it('should log file sizes in PB`', async () => {
    expect(formatBytes(10000000000000000)).toBe('8.88 PB');
  });

  it('should log file sizes in EB`', async () => {
    expect(formatBytes(10000000000000000000)).toBe('8.67 EB');
  });

  it('should log file sizes in ZB`', async () => {
    expect(formatBytes(10000000000000000000000)).toBe('8.47 ZB');
  });

  it('should log file sizes in YB`', async () => {
    expect(formatBytes(10000000000000000000000000)).toBe('8.27 YB');
  });

  it('should log file sizes correctly with correct decimal`', async () => {
    expect(formatBytes(10000, 1)).toBe('9.8 kB');
  });

  it('should log file sizes of 0 if no size is given`', async () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});

describe('distinct', () => {
  it('should remove duplicate strings from array', () => {
    expect(
      distinct([
        'no-unused-vars',
        'no-invalid-regexp',
        'no-unused-vars',
        'no-invalid-regexp',
        '@typescript-eslint/no-unused-vars',
      ]),
    ).toEqual([
      'no-unused-vars',
      'no-invalid-regexp',
      '@typescript-eslint/no-unused-vars',
    ]);
  });
});

describe('toArray', () => {
  it('should transform non-array value into array with single value', () => {
    expect(toArray('src/**/*.ts')).toEqual(['src/**/*.ts']);
  });

  it('should leave array value unchanged', () => {
    expect(toArray(['*.ts', '*.js'])).toEqual(['*.ts', '*.js']);
  });
});

describe('slugify', () => {
  it.each([
    ['Largest Contentful Paint', 'largest-contentful-paint'],
    ['cumulative-layout-shift', 'cumulative-layout-shift'],
    ['max-lines-200', 'max-lines-200'],
    ['rxjs/finnish', 'rxjs-finnish'],
    ['@typescript-eslint/no-explicit-any', 'typescript-eslint-no-explicit-any'],
    ['Code  PushUp ', 'code-pushup'],
  ])('should transform "%s" to valid slug "%s"', (text, slug) => {
    expect(slugify(text)).toBe(slug);
  });
});

describe('countOccurrences', () => {
  it('should return record with counts for each item', () => {
    expect(
      countOccurrences(['error', 'warning', 'error', 'error', 'warning']),
    ).toEqual({ error: 3, warning: 2 });
  });
});

describe('compareIssueSeverity', () => {
  it('should order severities in logically ascending order when used as compareFn with .sort()', () => {
    expect(
      (['error', 'info', 'warning'] satisfies Issue['severity'][]).sort(
        compareIssueSeverity,
      ),
    ).toEqual(['info', 'warning', 'error'] satisfies Issue['severity'][]);
  });
});
