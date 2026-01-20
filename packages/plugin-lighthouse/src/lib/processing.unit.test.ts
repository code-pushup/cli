import { expandOptionsForUrls, processAuditsAndGroups } from './processing.js';

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
    expect(result.audits.some(({ slug }) => slug.includes('-1'))).toBeFalse();
    expect(result.groups.some(({ slug }) => slug.includes('-1'))).toBeFalse();
  });

  it('should expand audits and groups for multiple URLs', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = processAuditsAndGroups(urls, {});

    expect(result.audits).toBeDefined();
    expect(result.groups).toBeDefined();

    expect(result.audits.every(({ slug }) => /-[12]$/.test(slug))).toBeTrue();
    expect(result.groups.every(({ slug }) => /-[12]$/.test(slug))).toBeTrue();
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
    expect(performanceGroups.every(({ isSkipped }) => !isSkipped)).toBeTrue();
    expect(nonPerformanceGroups.every(({ isSkipped }) => isSkipped)).toBeTrue();
  });

  it('should handle empty options', () => {
    const urls = ['https://example.com', 'https://example.com/about'];
    const result = processAuditsAndGroups(urls, {});

    expect(result.audits.length).toBeGreaterThan(0);
    expect(result.groups.length).toBeGreaterThan(0);
  });
});
