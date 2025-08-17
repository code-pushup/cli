import { describe, expect, it } from 'vitest';
import {
  type Group,
  type GroupRef,
  groupRefSchema,
  groupSchema,
  groupsSchema,
} from './group.js';

describe('groupRefSchema', () => {
  it('should accept a valid group reference', () => {
    expect(() =>
      groupRefSchema.parse({
        slug: 'speed-index',
        weight: 1,
      } satisfies GroupRef),
    ).not.toThrow();
  });

  it('should throw for a group reference with invalid slug', () => {
    expect(() =>
      groupRefSchema.parse({
        slug: '-invalid-blocking-time',
        weight: 1,
      } satisfies GroupRef),
    ).toThrow('slug has to follow the pattern');
  });

  it('should throw for a group reference with negative weight', () => {
    expect(() =>
      groupRefSchema.parse({
        slug: 'total-blocking-time',
        weight: -1,
      } satisfies GroupRef),
    ).toThrow('too_small');
  });
});

describe('groupSchema', () => {
  it('should accept a valid group with all information', () => {
    expect(() =>
      groupSchema.parse({
        refs: [
          { slug: 'lighthouse-bug-prevention', weight: 2 },
          { slug: 'lighthouse-performance', weight: 1 },
        ],
        slug: 'lighthouse',
        title: 'Lighthouse',
        description: 'Lighthouse is a performance and analysis tool.',
        docsUrl: 'https://developer.chrome.com/docs/lighthouse/overview',
      } satisfies Group),
    ).not.toThrow();
  });

  it('should accept a group with minimal information', () => {
    expect(() =>
      groupSchema.parse({
        slug: 'lighthouse-quality',
        title: 'Lighthouse quality plugin',
        refs: [{ slug: 'lighthouse-bug-prevention', weight: 1 }],
      } satisfies Group),
    ).not.toThrow();
  });

  it('should throw for an empty group', () => {
    expect(() =>
      groupSchema.parse({
        slug: 'empty-group',
        title: 'Empty group',
        refs: [],
      } satisfies Group),
    ).toThrow('In a category, there has to be at least one ref');
  });

  it('should throw for duplicate group references', () => {
    expect(() =>
      groupSchema.parse({
        slug: 'lighthouse-quality',
        title: 'Lighthouse quality plugin',
        refs: [
          { slug: 'lighthouse-bug-prevention', weight: 1 },
          { slug: 'lighthouse-bug-prevention', weight: 2 },
        ],
      } satisfies Group),
    ).toThrow(
      String.raw`Group has duplicate references to audits: \"lighthouse-bug-prevention\"`,
    );
  });
});

describe('groupsSchema', () => {
  it('should accept a valid group array', () => {
    expect(() =>
      groupsSchema.parse([
        {
          slug: 'lighthouse',
          title: 'Lighthouse',
          refs: [{ slug: 'lighthouse-performance', weight: 1 }],
        },
        {
          slug: 'jest',
          title: 'Jest',
          refs: [{ slug: 'jest-unit-tests', weight: 2 }],
        },
      ] satisfies Group[]),
    ).not.toThrow();
  });

  it('should accept an empty group array', () => {
    expect(() => groupsSchema.parse([])).not.toThrow();
  });

  it('should throw for duplicate group slugs', () => {
    expect(() =>
      groupsSchema.parse([
        {
          slug: 'lighthouse',
          title: 'Lighthouse',
          refs: [{ slug: 'lighthouse-performance', weight: 1 }],
        },
        {
          slug: 'lighthouse',
          title: 'Lighthouse',
          refs: [{ slug: 'lighthouse-bug-prevention', weight: 2 }],
        },
        {
          slug: 'jest',
          title: 'Jest',
          refs: [{ slug: 'jest-unit-tests', weight: 2 }],
        },
      ] satisfies Group[]),
    ).toThrow(
      String.raw`Group slugs must be unique, but received duplicates: \"lighthouse\"`,
    );
  });
});
