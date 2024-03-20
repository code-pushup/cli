import chalk from 'chalk';
import debug from 'debug';
import { type Budget } from 'lighthouse';
import log from 'lighthouse-logger';
import Details from 'lighthouse/types/lhr/audit-details';
import { vol } from 'memfs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Audit,
  CoreConfig,
  Group,
  PluginConfig,
  auditOutputsSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME, getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { LighthouseCliFlags } from './lighthouse-plugin';
import {
  AuditsNotImplementedError,
  CategoriesNotImplementedError,
  filterAuditsAndGroupsByOnlyOptions,
  getBudgets,
  getConfig,
  setLogLevel,
  toAuditOutputs,
  validateFlags,
  validateOnlyAudits,
  validateOnlyCategories,
} from './utils';

// mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => {
  const { CORE_CONFIG_MOCK }: Record<string, CoreConfig> =
    await vi.importActual('@code-pushup/test-utils');

  return {
    bundleRequire: vi
      .fn()
      .mockImplementation((options: { filepath: string }) => {
        const project = options.filepath.split('.').at(-2);
        return {
          mod: {
            default: {
              ...CORE_CONFIG_MOCK,
              upload: {
                ...CORE_CONFIG_MOCK?.upload,
                project, // returns loaded file extension to check in test
              },
            },
          },
        };
      }),
  };
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

    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
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
    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
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

    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
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

    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
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

describe('getConfig', () => {
  it('should return undefined if no path is specified', async () => {
    await expect(getConfig()).resolves.toBeUndefined();
  });

  it.each([
    [
      'desktop',
      expect.objectContaining({
        settings: expect.objectContaining({ formFactor: 'desktop' }),
      }),
    ],
    [
      'perf',
      expect.objectContaining({
        settings: expect.objectContaining({ onlyCategories: ['performance'] }),
      }),
    ],
    [
      'experimental',
      expect.objectContaining({
        audits: expect.arrayContaining(['autocomplete']),
      }),
    ],
  ] satisfies readonly ['desktop' | 'perf' | 'experimental', object][])(
    'should load config from lighthouse preset if %s preset is specified',
    async (preset, config) => {
      await expect(getConfig({ preset })).resolves.toEqual(config);
    },
  );

  it('should return undefined if preset is specified wrong', async () => {
    await expect(
      getConfig({ preset: 'wrong' as 'desktop' }),
    ).resolves.toBeUndefined();
    expect(getLogMessages(ui().logger).at(0)).toMatch(
      'Preset "wrong" is not supported',
    );
  });

  it('should load config from json file if configPath is specified', async () => {
    vol.fromJSON(
      {
        'lh-config.json': JSON.stringify(
          { extends: 'lighthouse:default' },
          null,
          2,
        ),
      },
      MEMFS_VOLUME,
    );
    await expect(getConfig({ configPath: 'lh-config.json' })).resolves.toEqual({
      extends: 'lighthouse:default',
    });
  });

  it('should load config from lh-config.js file if configPath is specified', async () => {
    await expect(getConfig({ configPath: 'lh-config.js' })).resolves.toEqual(
      expect.objectContaining({
        upload: expect.objectContaining({
          project: expect.stringContaining('lh-config'),
        }),
      }),
    );
  });

  it('should return undefined if configPath is specified wrong', async () => {
    await expect(
      getConfig({ configPath: join('wrong.xyz') }),
    ).resolves.toBeUndefined();
  });
});

describe('getBudgets', () => {
  it('should return and empty array if no path is specified', async () => {
    await expect(getBudgets()).resolves.toStrictEqual([]);
  });

  it('should load budgets from specified path', async () => {
    const budgets: Budget[] = [
      {
        path: '*',
        resourceCounts: [
          {
            budget: 3,
            resourceType: 'media',
          },
        ],
      },
    ];
    vol.fromJSON(
      {
        'lh-budgets.json': JSON.stringify(budgets, null, 2),
      },
      MEMFS_VOLUME,
    );
    await expect(getBudgets('lh-budgets.json')).resolves.toEqual(budgets);
  });

  it('should throw if path is specified wrong', async () => {
    await expect(getBudgets('wrong.xyz')).rejects.toThrow(
      'ENOENT: no such file or directory',
    );
  });
});

describe('setLogLevel', () => {
  const debugLib = debug as { enabled: (flag: string) => boolean };
  beforeEach(() => {
    log.setLevel('info');
  });

  /**
   *
   *  case 'silent':
   *    debug.enable('-LH:*');
   *    break;
   *  case 'verbose':
   *    debug.enable('LH:*');
   *    break;
   *  case 'warn':
   *    debug.enable('-LH:*, LH:*:warn, LH:*:error');
   *    break;
   *  case 'error':
   *    debug.enable('-LH:*, LH:*:error');
   *    break;
   *  default: // 'info'
   *    debug.enable('LH:*, -LH:*:verbose');
   */

  it('should set log level to info if no options are given', () => {
    setLogLevel();
    expect(log.isVerbose()).toBe(false);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });

  it('should set log level to verbose', () => {
    setLogLevel({ verbose: true });
    expect(log.isVerbose()).toBe(true);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });

  it('should set log level to quiet', () => {
    setLogLevel({ quiet: true });
    expect(log.isVerbose()).toBe(false);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('-LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });

  it('should set log level to verbose if verbose and quiet are given', () => {
    setLogLevel({ verbose: true, quiet: true });
    expect(log.isVerbose()).toBe(true);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });
});

describe('validateFlags', () => {
  it('should work with empty flags', () => {
    expect(validateFlags()).toStrictEqual({});
  });

  it('should forward supported entries', () => {
    expect(validateFlags({ verbose: true })).toStrictEqual({ verbose: true });
  });

  it('should remove unsupported entries and log', () => {
    expect(
      validateFlags({
        'list-all-audits': true,
        verbose: true,
      } as LighthouseCliFlags),
    ).toStrictEqual({ verbose: true });
    expect(getLogMessages(ui().logger).at(0)).toBe(
      `[ blue(info) ] ${chalk.yellow(
        '⚠',
      )} The following used flags are not supported: ${chalk.bold(
        'list-all-audits',
      )}`,
    );
  });
});
