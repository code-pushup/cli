import type { CompilerOptions } from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import type { Audit } from '@code-pushup/models';
import { AUDITS } from './constants.js';
import {
  filterAuditsBySlug,
  handleCompilerOptionStrict,
  validateAudits,
} from './utils.js';

describe('filterAuditsBySlug', () => {
  const mockAudits: Audit[] = [
    { slug: 'test-1', title: 'Test 1' },
    { slug: 'test-2', title: 'Test 2' },
    { slug: 'test-3', title: 'Test 3' },
  ];

  it.each([
    [undefined, mockAudits, [true, true, true]],
    [[], mockAudits, [true, true, true]],
    [['test-1', 'test-2'], mockAudits, [true, true, false]],
  ])(
    'should filter audits correctly when slugs is %p',
    (slugs, audits, expected) => {
      const filter = filterAuditsBySlug(slugs);
      audits.forEach((audit, index) => {
        expect(filter(audit)).toBe(expected[index]);
      });
    },
  );
});

describe('handleCompilerOptionStrict', () => {
  it('should return original options when strict is false', () => {
    const options: CompilerOptions = {
      strict: false,
      target: 2,
    };

    const result = handleCompilerOptionStrict(options);
    expect(result).toEqual(options);
  });

  it('should add all strict options when strict is true', () => {
    const options: CompilerOptions = {
      strict: true,
      target: 2,
    };

    const result = handleCompilerOptionStrict(options);

    expect(result).toEqual({
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
