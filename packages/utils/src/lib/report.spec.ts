import { vol } from 'memfs';
import { afterEach, describe, expect, vi } from 'vitest';
import { CategoryRef, IssueSeverity, PluginReport } from '@code-pushup/models';
import { MEMFS_VOLUME, report } from '@code-pushup/models/testing';
import {
  calcDuration,
  compareIssueSeverity,
  countWeightedRefs,
  formatBytes,
  formatCount,
  loadReport,
  slugify,
} from './report';

// Mock file system API's
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputDir = MEMFS_VOLUME;

const resetFiles = (files?: Record<string, string>) => {
  vol.reset();
  vol.fromJSON(files || {}, outputDir);
};

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

describe('formatCount', () => {
  it('should pluralize if count is greater than 1', () => {
    expect(formatCount(5, 'audit')).toBe('5 audits');
  });

  it('should not pluralize if count is 1', () => {
    expect(formatCount(1, 'audit')).toBe('1 audit');
  });

  it('should pluralize if count is 0', () => {
    expect(formatCount(0, 'audit')).toBe('0 audits');
  });
});

describe('countWeightedRefs', () => {
  it('should calc weighted refs only', () => {
    const refs: CategoryRef[] = [
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

describe('compareIssueSeverity', () => {
  it('should order severities in logically ascending order when used as compareFn with .sort()', () => {
    expect(
      (['error', 'info', 'warning'] satisfies IssueSeverity[]).sort(
        compareIssueSeverity,
      ),
    ).toEqual(['info', 'warning', 'error'] satisfies IssueSeverity[]);
  });
});

describe('loadReport', () => {
  afterEach(() => {
    resetFiles({});
  });

  it('should load reports form outputDir', async () => {
    const reportMock = report();
    resetFiles({
      [`report.json`]: JSON.stringify(reportMock),
      [`report.md`]: 'test-42',
    });
    const reports = await loadReport({
      outputDir,
      filename: 'report',
      format: 'json',
    });
    expect(reports).toEqual(reportMock);
  });

  it('should load reports by format', async () => {
    resetFiles({
      [`report.dummy.md`]: 'test-7',
      [`report.json`]: '{"test":42}',
      [`report.md`]: 'test-42',
    });
    const reports = await loadReport({
      outputDir,
      format: 'md',
      filename: 'report',
    });
    expect(reports).toBe('test-42');
  });

  it('should throw for invalid json reports', async () => {
    const reportMock = report();
    reportMock.plugins = [
      {
        ...reportMock.plugins[0],
        slug: '-Invalud_slug',
      } as unknown as PluginReport,
    ];

    resetFiles({
      [`report.json`]: JSON.stringify(reportMock),
    });

    await expect(
      loadReport({ outputDir, filename: 'report', format: 'json' }),
    ).rejects.toThrow('validation');
  });
});
