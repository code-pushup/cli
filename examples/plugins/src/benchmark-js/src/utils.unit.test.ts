import { describe, expect, it } from 'vitest';
import { auditOutputSchema } from '@code-pushup/models';
import {
  suiteNameToCategoryRef,
  suiteResultToAuditOutput,
  toAuditMetadata,
  toAuditSlug,
  toAuditTitle,
} from './utils';

describe('toAuditSlug', () => {
  it('should create slug string', () => {
    expect(toAuditSlug('glob')).toBe('benchmark-js-glob');
  });
});

describe('toAuditTitle', () => {
  it('should create title string', () => {
    expect(toAuditTitle('glob')).toBe('glob');
  });
});

describe('toAuditMetadata', () => {
  it('should create metadata string', () => {
    expect(toAuditMetadata(['glob'])).toStrictEqual([
      {
        slug: toAuditSlug('glob'),
        title: toAuditTitle('glob'),
      },
    ]);
  });
});

describe('suiteNameToCategoryRef', () => {
  it('should create a valid CategoryRef form suiteName', () => {
    expect(suiteNameToCategoryRef('glob')).toEqual({
      slug: toAuditSlug('glob'),
      type: 'audit',
      weight: 1,
      plugin: 'benchmark-js',
    });
  });
});

describe('scoredAuditOutput', () => {
  it('should produce valid minimal AuditOutput for a single result', () => {
    const auditOutput = suiteResultToAuditOutput([
      {
        suiteName: 'sort',
        hz: 100,
        rme: 1,
        name: 'implementation-1',
        isFastest: true,
        isTarget: true,
        samples: 4,
      },
    ]);
    expect(auditOutput).toEqual(
      expect.objectContaining({
        slug: toAuditSlug('sort'),
        score: 1,
        value: 100,
        displayValue: '100.00 ops/sec',
      }),
    );
    expect(() => auditOutputSchema.parse(auditOutput)).not.toThrow();
  });

  it('should have integer value', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'glob',
          hz: 100.1111,
          rme: 2.5,
          name: 'globby',
          isFastest: true,
          isTarget: true,
          samples: 4,
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        value: 100,
      }),
    );
  });

  it('should score based on maxHz', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'glob',
          hz: 100,
          rme: 2.5,
          name: 'globby',
          isFastest: true,
          isTarget: false,
          samples: 4,
        },
        {
          suiteName: 'glob',
          hz: 10,
          rme: 2.5,
          name: 'globby2',
          isFastest: false,
          isTarget: true,
          samples: 4,
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        score: 0.1,
      }),
    );
  });

  it('should format value to 2 floating positions', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'glob',
          hz: 1.111_111,
          rme: 2.5,
          name: 'globby',
          isFastest: true,
          isTarget: true,
          samples: 4,
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        displayValue: '1.11 ops/sec',
      }),
    );
  });

  it('should pick fastest test result as scoring base', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'sort',
          hz: 100,
          rme: 1,
          name: 'implementation-1',
          isFastest: true,
          isTarget: false,
          samples: 4,
        },
        {
          suiteName: 'sort',
          hz: 10,
          rme: 1,
          name: 'implementation-2',
          isFastest: false,
          isTarget: true,
          samples: 4,
        },
      ]),
    ).toEqual(expect.objectContaining({ score: 0.1 }));
  });

  it('should pick target test result for AuditOutput data', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'sort',
          hz: 99,
          rme: 1,
          name: 'implementation-1',
          isFastest: true,
          isTarget: true,
          samples: 4,
        },
        {
          suiteName: 'sort',
          hz: 10,
          rme: 1,
          name: 'implementation-2',
          isFastest: false,
          isTarget: false,
          samples: 4,
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        slug: toAuditSlug('sort'),
        value: 99,
        displayValue: '99.00 ops/sec',
      }),
    );
  });

  it('should have correct details for a suit with score 100', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'sort',
          hz: 100,
          rme: 1,
          name: 'implementation-1',
          isFastest: true,
          isTarget: true,
          samples: 4,
        },
        {
          suiteName: 'sort',
          hz: 60,
          rme: 1,
          name: 'implementation-2',
          isFastest: false,
          isTarget: false,
          samples: 4,
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        details: {
          issues: expect.arrayContaining([
            {
              message: `🎯implementation-1 100.00 ops/sec (fastest 🔥)`,
              severity: 'info',
            },
            {
              message: `implementation-2 60.00 ops/sec (40.0% slower)`,
              severity: 'info',
            },
          ]),
        },
      }),
    );
  });

  it('should have correct details for a suit with score long floating number', () => {
    expect(
      suiteResultToAuditOutput([
        {
          suiteName: 'sort',
          hz: 100.0001,
          rme: 1,
          name: 'implementation-1',
          isFastest: true,
          isTarget: false,
          samples: 4,
        },
        {
          suiteName: 'sort',
          hz: 60.123,
          rme: 1,
          name: 'implementation-2',
          isFastest: false,
          isTarget: true,
          samples: 4,
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        details: {
          issues: expect.arrayContaining([
            {
              message: `implementation-1 100.00 ops/sec (fastest 🔥)`,
              severity: 'info',
            },
            {
              message: `🎯implementation-2 60.12 ops/sec (39.9% slower)`,
              severity: 'error',
            },
          ]),
        },
      }),
    );
  });
});
