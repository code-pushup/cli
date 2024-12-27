import type { CompilerOptions } from 'typescript';
import { describe, expect, it } from 'vitest';
import type { Audit, Group } from '@code-pushup/models';
import { filterAuditsBySlug, handleCompilerOptionStrict } from './utils.js';

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
/*
describe('filterGroupsByAuditSlug', () => {
  const mockGroups: Group[] = [
    {
      slug: 'group-1',
      title: 'Group 1',
      refs: [
        { slug: 'audit-1', weight: 1 },
        { slug: 'audit-2', weight: 1 },
      ],
    },
    {
      slug: 'group-2',
      title: 'Group 2',
      refs: [{ slug: 'audit-3', weight: 1 }],
    },
    {
      slug: 'group-3',
      title: 'Group 3',
      refs: [
        { slug: 'audit-4', weight: 1 },
        { slug: 'audit-5', weight: 1 },
      ],
    },
  ];

  it.each(mockGroups)(
    'should return true for group %# when no slugs provided',
    group => {
      const filter = filterGr();
      expect(filter(group)).toBe(true);
    },
  );

  it.each(mockGroups)(
    'should return true for group %# when empty slugs array provided',
    group => {
      const filter = filterGroupsByAuditSlug([]);
      expect(filter(group)).toBe(true);
    },
  );

  it.each([
    [mockGroups[0], true],
    [mockGroups[1], true],
    [mockGroups[2], false],
  ])('should filter group %# by audit slugs', (group, expected) => {
    const filter = filterGroupsByAuditSlug(['audit-1', 'audit-3']);
    expect(filter(group!)).toBe(expected);
  });
});
*/
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
