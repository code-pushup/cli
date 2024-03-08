import Details from 'lighthouse/types/lhr/audit-details';
import { describe, expect, it } from 'vitest';
import {
  Audit,
  Group,
  PluginConfig,
  auditOutputsSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import {
  AuditsNotImplementedError,
  CategoriesNotImplementedError,
  filterAuditsAndGroupsByOnlyOptions,
  getLighthouseCliArguments,
  toAuditOutputs,
  validateOnlyAudits,
  validateOnlyCategories,
} from './utils';

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(
      getLighthouseCliArguments({
        url: ['https://code-pushup-portal.com'],
      }),
    ).toEqual(expect.arrayContaining(['https://code-pushup-portal.com']));
  });

  it('should parse chrome-flags options correctly', () => {
    const args = getLighthouseCliArguments({
      url: ['https://code-pushup-portal.com'],
      chromeFlags: { headless: 'new', 'user-data-dir': 'test' },
    });
    expect(args).toEqual(
      expect.arrayContaining([
        '--chromeFlags="--headless=new --user-data-dir=test"',
      ]),
    );
  });
});

describe('validateOnlyAudits', () => {
  it('should not throw for audit slugs existing in given audits', () => {
    expect(
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'a',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyAudits do not exist', () => {
    expect(() =>
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'missing-audit',
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });
});

describe('validateOnlyCategories', () => {
  it('should not throw for category slugs existing in given categories', () => {
    expect(
      validateOnlyCategories(
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
          {
            slug: 'coverage',
            title: 'Code coverage',
            refs: [{ slug: 'function-coverage', weight: 1 }],
          },
        ],
        'coverage',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyCategories do not exist', () => {
    expect(() =>
      validateOnlyCategories(
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        'missing-category',
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-category']));
  });
});

describe('filterAuditsAndGroupsByOnlyOptions to be used in plugin config', () => {
  it('should return given audits and groups if no only filter is set', () => {
    const audits: Audit[] = [{ slug: 'speed-index', title: 'Speed Index' }];
    const groups: Group[] = [
      {
        slug: 'performance',
        title: 'Performance',
        refs: [{ slug: 'speed-index', weight: 1 }],
      },
    ];
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(audits, groups, {});

    expect(filteredAudits).toStrictEqual(audits);
    expect(filteredGroups).toStrictEqual(groups);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should filter audits if onlyAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
        ],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        { onlyAudits: ['speed-index'] },
      );

    expect(filteredAudits).toStrictEqual([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'performance',
        title: 'Performance',
        refs: [{ slug: 'speed-index', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a missing audit slug', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
        ],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        { onlyAudits: ['speed-index'] },
      );
    expect(filteredAudits).toStrictEqual([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'performance',
        title: 'Performance',
        refs: [{ slug: 'speed-index', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should filter categories if onlyCategories is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
          { slug: 'function-coverage', title: 'Function Coverage' },
        ],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
          {
            slug: 'coverage',
            title: 'Code coverage',
            refs: [{ slug: 'function-coverage', weight: 1 }],
          },
        ],
        { onlyCategories: ['coverage'] },
      );

    expect(filteredAudits).toStrictEqual([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'coverage',
        title: 'Code coverage',
        refs: [{ slug: 'function-coverage', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should ignore onlyAudits and only filter categories if onlyCategories and onlyAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
          { slug: 'function-coverage', title: 'Function Coverage' },
        ],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
          {
            slug: 'coverage',
            title: 'Code coverage',
            refs: [{ slug: 'function-coverage', weight: 1 }],
          },
        ],
        {
          onlyAudits: ['speed-index'],
          onlyCategories: ['coverage'],
        },
      );

    expect(filteredAudits).toStrictEqual([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'coverage',
        title: 'Code coverage',
        refs: [{ slug: 'function-coverage', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a audit slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
        [{ slug: 'speed-index', title: 'Speed Index' }],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        {
          onlyAudits: ['missing-audit'],
        },
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });

  it('should throw if onlyCategories is set with a category slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
        [{ slug: 'speed-index', title: 'Speed Index' }],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        {
          onlyCategories: ['missing-category'],
        },
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-category']));
  });
});

describe('toAuditOutputs', () => {
  it('should parse valid lhr details', () => {
    expect(() =>
      auditOutputsSchema.parse(
        toAuditOutputs([
          {
            id: 'first-contentful-paint',
            title: 'First Contentful Paint',
            description:
              'First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).',
            score: 0.55,
            scoreDisplayMode: 'numeric',
            numericValue: 2838.974,
            numericUnit: 'millisecond',
            displayValue: '2.8 s',
          },
        ]),
      ),
    ).not.toThrow();
  });

  it('should parse valid lhr float value to integer', () => {
    expect(
      toAuditOutputs([
        {
          id: 'first-contentful-paint',
          title: 'First Contentful Paint',
          description:
            'First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).',
          score: 0.55,
          scoreDisplayMode: 'numeric',
          numericValue: 2838.974,
          numericUnit: 'millisecond',
          displayValue: '2.8 s',
        },
      ]),
    ).toStrictEqual([expect.objectContaining({ value: 2838 })]);
  });

  it('should convert null score to 1', () => {
    expect(
      toAuditOutputs([
        {
          id: 'performance-budget',
          title: 'Performance budget',
          description:
            'Keep the quantity and size of network requests under the targets set by the provided performance budget. [Learn more about performance budgets](https://developers.google.com/web/tools/lighthouse/audits/budgets).',
          score: null,
          scoreDisplayMode: 'notApplicable',
        },
      ]),
    ).toStrictEqual(
      expect.arrayContaining([expect.objectContaining({ score: 1 })]),
    );
  });

  it('should inform that opportunity type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'dummy-audit',
        title: 'Dummy Audit',
        description: 'This is a dummy audit.',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'opportunity',
          headings: [
            {
              key: 'url',
              valueType: 'url',
              label: 'URL',
            },
            {
              key: 'responseTime',
              valueType: 'timespanMs',
              label: 'Time Spent',
            },
          ],
          items: [
            {
              url: 'https://staging.code-pushup.dev/login',
              responseTime: 449.292_000_000_000_03,
            },
          ],
          overallSavingsMs: 349.292_000_000_000_03,
        } satisfies Details.Opportunity,
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that table type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'dummy-audit',
        title: 'Dummy Audit',
        description: 'This is a dummy audit.',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'table',
          headings: [],
          items: [],
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that debugdata type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        description:
          'Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more about the Cumulative Layout Shift metric](https://web.dev/cls/).',
        score: 1,
        scoreDisplayMode: 'numeric',
        numericValue: 0.000_350_978_852_728_593_95,
        numericUnit: 'unitless',
        displayValue: '0',
        details: {
          type: 'debugdata',
          items: [
            {
              cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
            },
          ],
        },
      },
    ]);

    // @TODO add check that cliui.logger is called. Resolve TODO after PR #487 is merged.

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that filmstrip type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'screenshot-thumbnails',
        title: 'Screenshot Thumbnails',
        description: 'This is what the load of your site looked like.',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'filmstrip',
          scale: 3000,
          items: [
            {
              timing: 375,
              timestamp: 106_245_424_545,
              data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwY...',
            },
          ],
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that screenshot type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'final-screenshot',
        title: 'Final Screenshot',
        description: 'The last screenshot captured of the pageload.',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'screenshot',
          timing: 541,
          timestamp: 106_245_590_644,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that treemap-data type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'script-treemap-data',
        title: 'Script Treemap Data',
        description: 'Used for treemap app',
        score: null,
        scoreDisplayMode: 'informative',
        details: {
          type: 'treemap-data',
          nodes: [],
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });

  it('should inform that criticalrequestchain type is not supported yet', () => {
    const outputs = toAuditOutputs([
      {
        id: 'critical-request-chains',
        title: 'Avoid chaining critical requests',
        description:
          'The Critical Request Chains below show you what resources are loaded with a high priority. Consider reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. [Learn how to avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/).',
        score: null,
        scoreDisplayMode: 'notApplicable',
        displayValue: '',
        details: {
          type: 'criticalrequestchain',
          chains: {
            EED301D300C9A7B634A444E0C6019FC1: {
              request: {
                url: 'https://example.com/',
                startTime: 106_245.050_727,
                endTime: 106_245.559_225,
                responseReceivedTime: 106_245.559_001,
                transferSize: 849,
              },
            },
          },
          longestChain: {
            duration: 508.498_000_010_848_05,
            length: 1,
            transferSize: 849,
          },
        },
      },
    ]);

    expect(outputs[0]?.details).toBeUndefined();
  });
});
