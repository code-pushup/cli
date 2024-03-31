import { describe, expect, it } from 'vitest';
import { SuiteConfig } from './runner/types';
import { toAuditSlug } from './runner/utils';
import {
  jsBenchmarkingSuiteNameToCategoryRef,
  loadSuites,
  toAuditMetadata,
  toAuditTitle,
} from './utils';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');

  return {
    ...actual,
    importEsmModule: vi.fn().mockImplementation(
      ({ filepath = '' }: { filepath: string }) =>
        ({
          suiteName: filepath.replace('.ts', ''),
          targetImplementation: 'current-implementation',
          cases: [
            ['current-implementation', vi.fn()],
            ['slower-implementation', vi.fn()],
          ],
        } satisfies SuiteConfig),
    ),
  };
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

describe('jsBenchmarkingSuiteNameToCategoryRef', () => {
  it('should create a valid CategoryRef form suiteName', () => {
    expect(jsBenchmarkingSuiteNameToCategoryRef('glob')).toEqual({
      slug: toAuditSlug('glob'),
      type: 'audit',
      weight: 1,
      plugin: 'js-benchmarking',
    });
  });
});

describe('loadSuites', () => {
  it('should load given suites', async () => {
    await expect(loadSuites(['suite-1.ts', 'suite-2.ts'])).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ suiteName: 'suite-1' }),
        expect.objectContaining({ suiteName: 'suite-2' }),
      ]),
    );
  });
});
