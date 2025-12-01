import { describe, expect, it } from 'vitest';
import { type Audit, categoryRefSchema } from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import { AUDITS } from './constants.js';
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
  it('should return all groups as categoryRefs if no compiler options are given', async () => {
    const categoryRefs = await getCategoryRefsFromGroups();
    expect(categoryRefs).toHaveLength(3);
    expect(() =>
      categoryRefs.map(categoryRefSchema.parse as () => unknown),
    ).not.toThrow();
  });

  it('should return all groups as categoryRefs if compiler options are given', async () => {
    const categoryRefs = await getCategoryRefsFromGroups({
      tsconfig: 'tsconfig.json',
    });
    expect(categoryRefs).toHaveLength(3);
  });

  it('should return a subset of all groups as categoryRefs if compiler options contain onlyAudits filter', async () => {
    const categoryRefs = await getCategoryRefsFromGroups({
      tsconfig: 'tsconfig.json',
      onlyAudits: ['semantic-errors'],
    });
    expect(categoryRefs).toHaveLength(1);
  });
});

describe('logSkippedAudits', () => {
  it('should not print anything when all audits are included', () => {
    logSkippedAudits(AUDITS);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should warn about skipped audits', () => {
    logSkippedAudits(AUDITS.slice(0, -1));

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`Skipped audits: [`),
    );
  });

  it('should camel case the slugs in the audit message', () => {
    logSkippedAudits(AUDITS.slice(0, -1));

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`unknownCodes`),
    );
  });
});
