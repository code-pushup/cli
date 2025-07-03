import { describe, expect, it } from 'vitest';
import type { Audit, Group } from '@code-pushup/models';
import {
  expandAuditsForUrls,
  expandGroupsForUrls,
  expandOptionsForUrls,
  getUrlIdentifier,
  orderSlug,
  processAuditsAndGroups,
} from './processing.js';

describe('orderSlug', () => {
  it.each([
    [0, 'performance', 'performance-1'],
    [1, 'performance', 'performance-2'],
    [2, 'best-practices', 'best-practices-3'],
    [1, 'cumulative-layout-shift', 'cumulative-layout-shift-2'],
  ])('should append index %d + 1 to slug %j', (index, slug, expected) => {
    expect(orderSlug(slug, index)).toBe(expected);
  });
});

describe('getUrlIdentifier', () => {
  it.each([
    ['https://example.com', 'example.com'],
    ['https://example.com/', 'example.com'],
    ['http://example.com', 'example.com'],
    ['https://example.com/about', 'example.com/about'],
    ['https://example.com/about/', 'example.com/about/'],
    ['https://example.com/docs/api', 'example.com/docs/api'],
    ['https://example.com/page?q=test', 'example.com/page'],
    ['https://example.com/page#section', 'example.com/page'],
    ['https://example.com/page?q=test#section', 'example.com/page'],
    ['https://example.com:3000', 'example.com:3000'],
    ['https://example.com:3000/api', 'example.com:3000/api'],
    ['https://www.example.com', 'www.example.com'],
    ['https://api.example.com/v1', 'api.example.com/v1'],
    ['not-a-url', 'not-a-url'],
    ['just-text', 'just-text'],
    ['', ''],
    ['https://localhost', 'localhost'],
    ['https://127.0.0.1:8080/test', '127.0.0.1:8080/test'],
  ])('should convert %j to %j', (input, expected) => {
    expect(getUrlIdentifier(input)).toBe(expected);
  });
});

describe('expandAuditsForUrls', () => {
  const mockAudits: Audit[] = [
    {
      slug: 'first-contentful-paint',
      title: 'First Contentful Paint',
      description: 'Measures FCP',
    },
    {
      slug: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      description: 'Measures LCP',
    },
  ];

  it('should expand audits for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandAuditsForUrls(mockAudits, urls);

    expect(result).toHaveLength(4);
    expect(result.map(({ slug }) => slug)).toEqual([
      'first-contentful-paint-1',
      'largest-contentful-paint-1',
      'first-contentful-paint-2',
      'largest-contentful-paint-2',
    ]);
  });

  it('should update titles with URL identifiers', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandAuditsForUrls(mockAudits, urls);

    expect(result[0]?.title).toBe('First Contentful Paint (example.com)');
    expect(result[2]?.title).toBe('First Contentful Paint (example.com/about)');
  });

  it('should preserve other audit properties', () => {
    const auditWithExtra: Audit = {
      slug: 'test-audit',
      title: 'Test Audit',
      description: 'Test description',
      docsUrl: 'https://docs.example.com',
    };

    const result = expandAuditsForUrls(
      [auditWithExtra],
      ['https://example.com'],
    );

    expect(result[0]).toEqual({
      slug: 'test-audit-1',
      title: 'Test Audit (example.com)',
      description: 'Test description',
      docsUrl: 'https://docs.example.com',
    });
  });

  it('should handle single URL', () => {
    const result = expandAuditsForUrls(mockAudits, ['https://example.com']);

    expect(result).toHaveLength(2);
    expect(result.map(a => a.slug)).toEqual([
      'first-contentful-paint-1',
      'largest-contentful-paint-1',
    ]);
  });

  it('should handle empty audits array', () => {
    const result = expandAuditsForUrls([], ['https://example.com']);
    expect(result).toHaveLength(0);
  });
});

describe('expandGroupsForUrls', () => {
  const mockGroups: Group[] = [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        { slug: 'first-contentful-paint', weight: 1 },
        { slug: 'largest-contentful-paint', weight: 2 },
      ],
    },
    {
      slug: 'accessibility',
      title: 'Accessibility',
      refs: [{ slug: 'color-contrast', weight: 1 }],
    },
  ];

  it('should expand groups for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandGroupsForUrls(mockGroups, urls);

    expect(result).toHaveLength(4);
    expect(result.map(({ slug }) => slug)).toEqual([
      'performance-1',
      'accessibility-1',
      'performance-2',
      'accessibility-2',
    ]);
  });

  it('should update group titles with URL identifiers', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandGroupsForUrls(mockGroups, urls);

    expect(result[0]?.title).toBe('Performance (example.com)');
    expect(result[2]?.title).toBe('Performance (example.com/about)');
  });

  it('should expand refs within groups', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = expandGroupsForUrls(mockGroups, urls);

    expect(result[0]?.refs).toEqual([
      { slug: 'first-contentful-paint-1', weight: 1 },
      { slug: 'largest-contentful-paint-1', weight: 2 },
    ]);

    expect(result[2]?.refs).toEqual([
      { slug: 'first-contentful-paint-2', weight: 1 },
      { slug: 'largest-contentful-paint-2', weight: 2 },
    ]);
  });

  it('should preserve other group properties', () => {
    const groupWithExtra: Group = {
      slug: 'test-group',
      title: 'Test Group',
      description: 'Test description',
      refs: [{ slug: 'test-audit', weight: 1 }],
    };

    const result = expandGroupsForUrls(
      [groupWithExtra],
      ['https://example.com'],
    );

    expect(result[0]).toEqual({
      slug: 'test-group-1',
      title: 'Test Group (example.com)',
      description: 'Test description',
      refs: [{ slug: 'test-audit-1', weight: 1 }],
    });
  });

  it('should handle empty groups array', () => {
    const result = expandGroupsForUrls([], ['https://example.com']);
    expect(result).toHaveLength(0);
  });
});

describe('expandOptionsForUrls', () => {
  it('should expand onlyAudits options', () => {
    const options = {
      onlyAudits: ['first-contentful-paint', 'largest-contentful-paint'],
    };
    const result = expandOptionsForUrls(options, 2);

    expect(result.onlyAudits).toEqual([
      'first-contentful-paint-1',
      'first-contentful-paint-2',
      'largest-contentful-paint-1',
      'largest-contentful-paint-2',
    ]);
  });

  it('should expand skipAudits options', () => {
    const options = { skipAudits: ['performance-budget'] };
    const result = expandOptionsForUrls(options, 3);

    expect(result.skipAudits).toEqual([
      'performance-budget-1',
      'performance-budget-2',
      'performance-budget-3',
    ]);
  });

  it('should expand onlyCategories options', () => {
    const options = { onlyCategories: ['performance', 'accessibility'] };
    const result = expandOptionsForUrls(options, 2);

    expect(result.onlyCategories).toEqual([
      'performance-1',
      'performance-2',
      'accessibility-1',
      'accessibility-2',
    ]);
  });

  it('should handle mixed filter options', () => {
    const options = {
      onlyAudits: ['first-contentful-paint'],
      skipAudits: ['performance-budget'],
      onlyCategories: ['performance'],
    };
    const result = expandOptionsForUrls(options, 2);

    expect(result).toEqual({
      onlyAudits: ['first-contentful-paint-1', 'first-contentful-paint-2'],
      skipAudits: ['performance-budget-1', 'performance-budget-2'],
      onlyCategories: ['performance-1', 'performance-2'],
    });
  });

  it('should handle empty arrays', () => {
    const options = { onlyAudits: [], skipAudits: [] };
    const result = expandOptionsForUrls(options, 2);

    expect(result).toEqual({
      onlyAudits: [],
      skipAudits: [],
    });
  });

  it('should handle single URL count', () => {
    const options = { onlyAudits: ['test-audit'] };
    const result = expandOptionsForUrls(options, 1);

    expect(result.onlyAudits).toEqual(['test-audit-1']);
  });
});

describe('processAuditsAndGroups', () => {
  it('should return original audits and groups for single URL', () => {
    const result = processAuditsAndGroups(['https://example.com'], {});

    expect(result.audits).toBeDefined();
    expect(result.groups).toBeDefined();
    expect(result.audits.some(({ slug }) => slug.includes('-1'))).toBe(false);
    expect(result.groups.some(({ slug }) => slug.includes('-1'))).toBe(false);
  });

  it('should expand audits and groups for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = processAuditsAndGroups(urls, {});

    expect(result.audits).toBeDefined();
    expect(result.groups).toBeDefined();

    expect(result.audits.every(({ slug }) => /-[12]$/.test(slug))).toBe(true);
    expect(result.groups.every(({ slug }) => /-[12]$/.test(slug))).toBe(true);
  });

  it('should apply filter options for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const options = { onlyCategories: ['performance'] };
    const result = processAuditsAndGroups(urls, options);

    const performanceGroups = result.groups.filter(({ slug }) =>
      slug.startsWith('performance-'),
    );
    const nonPerformanceGroups = result.groups.filter(
      ({ slug }) => !slug.startsWith('performance-'),
    );

    expect(performanceGroups.map(g => g.slug)).toEqual([
      'performance-1',
      'performance-2',
    ]);
    expect(performanceGroups.every(({ isSkipped }) => !isSkipped)).toBe(true);
    expect(nonPerformanceGroups.every(({ isSkipped }) => isSkipped)).toBe(true);
  });

  it('should handle empty options', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = processAuditsAndGroups(urls, {});

    expect(result.audits.length).toBeGreaterThan(0);
    expect(result.groups.length).toBeGreaterThan(0);
  });
});
