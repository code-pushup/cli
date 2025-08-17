import type { z } from 'zod';
import type { Audit } from '../audit.js';
import type { CategoryRef } from '../category-config.js';
import {
  createCheck,
  createDuplicateSlugsCheck,
  createDuplicatesCheck,
} from './checks.js';

describe('createCheck', () => {
  it('should add issue if callback finds an error', () => {
    const findErrorFn = vi
      .fn<[string]>()
      .mockReturnValue({ message: 'Something went wrong' });

    const check = createCheck(findErrorFn);

    expect(findErrorFn).not.toHaveBeenCalled();

    const ctx: z.core.ParsePayload<string> = { value: 'XYZ', issues: [] };
    check(ctx);

    expect(findErrorFn).toHaveBeenCalledWith('XYZ');
    expect(ctx.issues).toEqual([
      {
        code: 'custom',
        message: 'Something went wrong',
        input: 'XYZ',
      },
    ]);
  });

  it('should NOT add issue if callback finds no error', () => {
    const findErrorFn = vi.fn<[string]>().mockReturnValue(false);

    const check = createCheck<string>(findErrorFn);

    expect(findErrorFn).not.toHaveBeenCalled();

    const ctx: z.core.ParsePayload<string> = { value: 'XYZ', issues: [] };
    check(ctx);

    expect(findErrorFn).toHaveBeenCalledWith('XYZ');
    expect(ctx.issues).toEqual([]);
  });
});

describe('createDuplicatesCheck', () => {
  const keyFn = vi.fn(
    ({ type, plugin, slug }: CategoryRef) => `${type} ${plugin}/${slug}`,
  );
  const errorMsgFn = vi.fn(
    (duplicates: string[]) => `Duplicate refs found: ${duplicates.join(', ')}`,
  );

  it('add issue with custom message if there are duplicate keys', () => {
    const check = createDuplicatesCheck<CategoryRef>(keyFn, errorMsgFn);

    expect(keyFn).not.toHaveBeenCalled();
    expect(errorMsgFn).not.toHaveBeenCalled();

    const ctx: z.core.ParsePayload<CategoryRef[]> = {
      value: [
        { type: 'audit', plugin: 'coverage', slug: 'coverage', weight: 2 },
        { type: 'audit', plugin: 'jsdocs', slug: 'coverage', weight: 1 },
        { type: 'audit', plugin: 'coverage', slug: 'coverage', weight: 1 },
      ],
      issues: [],
    };
    check(ctx);

    expect(keyFn).toHaveBeenCalledTimes(3);
    expect(errorMsgFn).toHaveBeenCalledWith(['audit coverage/coverage']);
    expect(ctx.issues).toEqual([
      {
        code: 'custom',
        message: 'Duplicate refs found: audit coverage/coverage',
        input: ctx.value,
      },
    ]);
  });

  it('add NOT add issue if all keys are unique', () => {
    const check = createDuplicatesCheck<CategoryRef>(keyFn, errorMsgFn);

    expect(keyFn).not.toHaveBeenCalled();
    expect(errorMsgFn).not.toHaveBeenCalled();

    const ctx: z.core.ParsePayload<CategoryRef[]> = {
      value: [
        { type: 'group', plugin: 'eslint', slug: 'errors', weight: 1 },
        { type: 'group', plugin: 'eslint', slug: 'warnings', weight: 1 },
        { type: 'group', plugin: 'typescript', slug: 'errors', weight: 1 },
      ],
      issues: [],
    };
    check(ctx);

    expect(keyFn).toHaveBeenCalledTimes(3);
    expect(errorMsgFn).not.toHaveBeenCalled();
    expect(ctx.issues).toEqual([]);
  });
});

describe('createDuplicateSlugsCheck', () => {
  it('should add issue if there are duplicate slugs', () => {
    const check = createDuplicateSlugsCheck<Audit>('Audit');

    const ctx: z.core.ParsePayload<Audit[]> = {
      value: [
        { slug: 'lcp', title: 'Largest Contentful Paint' },
        { slug: 'cls', title: 'Cumulative Layout Shift' },
        { slug: 'fcp', title: 'First Contentful Paint' },
        { slug: 'lcp', title: 'LCP' },
        { slug: 'fcp', title: 'FCP' },
      ],
      issues: [],
    };
    check(ctx);

    expect(ctx.issues).toEqual([
      {
        code: 'custom',
        message:
          'Audit slugs must be unique, but received duplicates: "fcp", "lcp"',
        input: ctx.value,
      },
    ]);
  });

  it('should NOT add issue if all slugs are unique', () => {
    const check = createDuplicateSlugsCheck<Audit>('Audit');

    const ctx: z.core.ParsePayload<Audit[]> = {
      value: [
        { slug: 'lcp', title: 'Largest Contentful Paint' },
        { slug: 'cls', title: 'Cumulative Layout Shift' },
        { slug: 'fcp', title: 'First Contentful Paint' },
      ],
      issues: [],
    };
    check(ctx);

    expect(ctx.issues).toEqual([]);
  });
});
