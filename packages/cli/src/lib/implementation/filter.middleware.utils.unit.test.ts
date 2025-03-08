import { describe, expect } from 'vitest';
import type { CategoryRef } from '@code-pushup/models';
import {
  extractSkippedItems,
  isValidCategoryRef,
} from './filter.middleware.utils';
import type { Filterables } from './filter.model';

describe('isValidCategoryRef', () => {
  const plugins = [
    {
      slug: 'p1',
      audits: [{ slug: 'a1' }],
      groups: [{ slug: 'g1' }],
    },
  ] as Filterables['plugins'];

  it('should return true for valid audit ref', () => {
    const ref = {
      type: 'audit',
      slug: 'a1',
      plugin: 'p1',
      weight: 1,
    } satisfies CategoryRef;
    expect(isValidCategoryRef(ref, plugins)).toBe(true);
  });

  it('should return false for skipped audit ref', () => {
    const ref = {
      type: 'audit',
      slug: 'a2',
      plugin: 'p1',
      weight: 1,
    } satisfies CategoryRef;
    expect(isValidCategoryRef(ref, plugins)).toBe(false);
  });

  it('should return true for valid group ref', () => {
    const ref = {
      type: 'group',
      slug: 'g1',
      plugin: 'p1',
      weight: 1,
    } satisfies CategoryRef;
    expect(isValidCategoryRef(ref, plugins)).toBe(true);
  });

  it('should return false for skipped group ref', () => {
    const ref = {
      type: 'group',
      slug: 'g2',
      plugin: 'p1',
      weight: 1,
    } satisfies CategoryRef;
    expect(isValidCategoryRef(ref, plugins)).toBe(false);
  });

  it('should return false for nonexistent plugin', () => {
    const ref = {
      type: 'audit',
      slug: 'a1',
      plugin: 'nonexistent',
      weight: 1,
    } satisfies CategoryRef;
    expect(isValidCategoryRef(ref, plugins)).toBe(false);
  });
});

describe('extractSkippedItems', () => {
  it('should extract skipped items', () => {
    expect(
      extractSkippedItems(
        [{ slug: 'p1' }, { slug: 'p2' }, { slug: 'p3' }, { slug: 'p4' }],
        [{ slug: 'p1' }, { slug: 'p2' }, { slug: 'p3' }],
      ),
    ).toStrictEqual(['p4']);
  });
});
