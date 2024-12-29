import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Audit, categoryRefSchema } from '@code-pushup/models';
import config554 from '../../mocks/fixtures/default-ts-configs/tsconfig.5.5.4.json';
import { AUDITS } from './constants.js';
import * as runnerUtilsModule from './runner/utils.js';
import {
  filterAuditsByCompilerOptions,
  filterAuditsBySlug,
  getCategoryRefsFromGroups,
  logSkippedAudits,
} from './utils.js';

describe('filterAuditsBySlug', () => {
  const mockAudit = { slug: 'strict-function-types' } as Audit;

  it('should return true if slugs are undefined', () => {
    expect(filterAuditsBySlug(undefined)(mockAudit)).toBe(true);
  });

  it('should return true if slugs are empty', () => {
    expect(filterAuditsBySlug([])(mockAudit)).toBe(true);
  });

  it('should return true if slugs are including the current audit slug', () => {
    expect(filterAuditsBySlug(['strict-function-types'])(mockAudit)).toBe(true);
  });

  it('should return false if slugs are not including the current audit slug', () => {
    expect(filterAuditsBySlug(['verbatim-module-syntax'])(mockAudit)).toBe(
      false,
    );
  });
});

describe('filterAuditsByCompilerOptions', () => {
  it('should return false if the audit is false in compiler options', () => {
    expect(
      filterAuditsByCompilerOptions(
        {
          strictFunctionTypes: false,
        },
        ['strict-function-types'],
      )({ slug: 'strict-function-types' }),
    ).toBe(false);
  });

  it('should return false if the audit is undefined in compiler options', () => {
    expect(
      filterAuditsByCompilerOptions(
        {
          strictFunctionTypes: undefined,
        },
        ['strict-function-types'],
      )({ slug: 'strict-function-types' }),
    ).toBe(false);
  });

  it('should return false if the audit is enabled in compiler options but not in onlyAudits', () => {
    const onlyAudits = ['strict-null-checks'];
    expect(
      filterAuditsByCompilerOptions(
        {
          strictFunctionTypes: true,
        },
        onlyAudits,
      )({ slug: 'strict-function-types' }),
    ).toBe(false);
  });

  it('should return true if the audit is enabled in compiler options and onlyAudits is empty', () => {
    expect(
      filterAuditsByCompilerOptions(
        {
          strictFunctionTypes: true,
        },
        [],
      )({ slug: 'strict-function-types' }),
    ).toBe(true);
  });

  it('should return true if the audit is enabled in compiler options and in onlyAudits', () => {
    expect(
      filterAuditsByCompilerOptions(
        {
          strictFunctionTypes: true,
        },
        ['strict-function-types'],
      )({ slug: 'strict-function-types' }),
    ).toBe(true);
  });
});

describe('getCategoryRefsFromGroups', () => {
  const loadTsConfigDefaultsByVersionSpy = vi.spyOn(
    runnerUtilsModule,
    'loadTsConfigDefaultsByVersion',
  );
  const loadTargetConfigSpy = vi.spyOn(runnerUtilsModule, 'loadTargetConfig');

  beforeEach(() => {
    loadTsConfigDefaultsByVersionSpy.mockResolvedValue(config554 as any);
    loadTargetConfigSpy.mockResolvedValue({
      options: {
        verbatimModuleSyntax: false,
      },
      fileNames: [],
      errors: [],
    });
  });

  it('should return all groups as categoryRefs if no compiler options are given', async () => {
    const categoryRefs = await getCategoryRefsFromGroups();
    expect(categoryRefs).toHaveLength(7);
    expect(loadTsConfigDefaultsByVersionSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledWith(
      expect.stringContaining('tsconfig.json'),
    );
    expect(() =>
      categoryRefs.map(categoryRefSchema.parse as () => unknown),
    ).not.toThrow();
  });

  it('should return all groups as categoryRefs if compiler options are given', async () => {
    const categoryRefs = await getCategoryRefsFromGroups({
      tsConfigPath: 'tsconfig.json',
    });
    expect(categoryRefs).toHaveLength(7);
  });

  it('should return a subset of all groups as categoryRefs if compiler options contain onlyAudits filter', async () => {
    const categoryRefs = await getCategoryRefsFromGroups({
      tsConfigPath: 'tsconfig.json',
      onlyAudits: ['no-implicit-any'],
    });
    expect(categoryRefs).toHaveLength(1);
  });
});

describe('logSkippedAudits', () => {
  beforeEach(() => {
    vi.mock('console', () => ({
      warn: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not warn when all audits are included', () => {
    logSkippedAudits(AUDITS);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should warn about skipped audits', () => {
    logSkippedAudits(AUDITS.slice(0, -1));

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Skipped audits because the compiler options disabled: [`,
      ),
    );
  });

  it('should camel case the slugs in the audit message', () => {
    logSkippedAudits(AUDITS.slice(0, -1));

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(`strictFunctionTypes`),
    );
  });
});
