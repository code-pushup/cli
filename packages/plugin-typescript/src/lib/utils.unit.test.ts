import type { CompilerOptions } from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import type { Audit } from '@code-pushup/models';
import { AUDITS } from './constants.js';
import {
  filterAuditsByCompilerOptions,
  filterAuditsBySlug,
  handleCompilerOptionStrict,
  validateAudits,
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

describe('handleCompilerOptionStrict', () => {
  it('should return original options when strict is false', () => {
    const options: CompilerOptions = {
      strict: false,
      target: 2,
    };

    const result = handleCompilerOptionStrict(options);
    expect(result).toB(options);
  });

  it('should add all strict options when strict is true', () => {
    const options: CompilerOptions = {
      strict: true,
      target: 2,
    };

    const result = handleCompilerOptionStrict(options);

    expect(result).toStrictEqual({
      ...options,
      noImplicitAny: true,
      noImplicitThis: true,
      alwaysStrict: true,
      strictBuiltinIteratorReturn: true,
      strictPropertyInitialization: true,
      strictNullChecks: true,
      strictBindCallApply: true,
      strictFunctionTypes: true,
    });
  });

  it('should preserve existing option values while adding strict options', () => {
    const options: CompilerOptions = {
      strict: true,
      target: 2,
      noImplicitAny: false,
    };

    const result = handleCompilerOptionStrict(options);

    expect(result.target).toBe(2);
    expect(result.noImplicitAny).toBe(true);
  });
});

describe('validateAudits', () => {
  beforeEach(() => {
    vi.mock('console', () => ({
      warn: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not warn when all audits are included', () => {
    const filteredAudits = AUDITS.map(audit => ({ ...audit }));

    validateAudits(filteredAudits);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should warn about skipped audits', () => {
    const filteredAudits = AUDITS.slice(1); // Removes an audit
    validateAudits(filteredAudits);

    expect(console.warn).toHaveBeenCalled();
  });

  it('should warn of all audits when filteredAudits are empty', () => {
    validateAudits([]);

    expect(console.warn).toHaveBeenCalled();
  });
});
