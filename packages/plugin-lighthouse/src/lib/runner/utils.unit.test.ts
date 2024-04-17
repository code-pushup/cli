import chalk from 'chalk';
import debug from 'debug';
import { type Budget } from 'lighthouse';
import log from 'lighthouse-logger';
import Details from 'lighthouse/types/lhr/audit-details';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { vol } from 'memfs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreConfig, auditOutputsSchema } from '@code-pushup/models';
import { MEMFS_VOLUME, getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import {
  getBudgets,
  getConfig,
  logUnsupportedDetails,
  setLogLevel,
  toAuditDetails,
  toAuditOutputs,
  unsupportedDetailTypes,
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

describe('logUnsupportedDetails', () => {
  it('should log unsupported entries', () => {
    logUnsupportedDetails([
      { details: { type: 'screenshot' } },
    ] as unknown as Result[]);
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger).at(0)).toBe(
      `[ cyan(debug) ] ${chalk.yellow('⚠')} Plugin ${chalk.bold(
        'lighthouse',
      )} skipped parsing of unsupported audit details: ${chalk.bold(
        'screenshot',
      )}`,
    );
  });
  it('should log only 3 details of unsupported entries', () => {
    logUnsupportedDetails([
      { details: { type: 'table' } },
      { details: { type: 'filmstrip' } },
      { details: { type: 'screenshot' } },
      { details: { type: 'opportunity' } },
      { details: { type: 'debugdata' } },
      { details: { type: 'treemap-data' } },
      { details: { type: 'criticalrequestchain' } },
    ] as unknown as Result[]);
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger).at(0)).toBe(
      `[ cyan(debug) ] ${chalk.yellow('⚠')} Plugin ${chalk.bold(
        'lighthouse',
      )} skipped parsing of unsupported audit details: ${chalk.bold(
        'filmstrip, screenshot, treemap-data',
      )} and 1 more.`,
    );
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

  it('should NOT inform for unsupported details if verbose is NOT given', () => {
    const types = [...unsupportedDetailTypes];
    toAuditOutputs(
      types.map(
        type =>
          ({
            details: { type },
          } as Result),
      ),
    );
    expect(getLogMessages(ui().logger)).toHaveLength(0);
  });

  it('should inform that for all unsupported details if verbose IS given', () => {
    const types = [...unsupportedDetailTypes];
    toAuditOutputs(
      types.map(
        type =>
          ({
            details: { type },
          } as Result),
      ),
      { verbose: true },
    );
    expect(getLogMessages(ui().logger)).toHaveLength(1);
  });
});
describe('toAuditDetails', () => {
  it('should render audit details of type opportunity', () => {
    const outputs = toAuditDetails({
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
    } satisfies Details.Opportunity);

    expect(outputs).toStrictEqual({
      table: {
        headings: [
          {
            key: 'url',
            label: 'URL',
          },
          {
            key: 'responseTime',
            label: 'Time Spent',
          },
        ],
        items: [
          {
            url: 'https://staging.code-pushup.dev/login',
            responseTime: 449.292_000_000_000_03,
          },
        ],
      },
    });
  });

  it('should render audit details of type table', () => {
    const outputs = toAuditDetails({
      type: 'table',
      headings: [
        {
          key: 'name',
          valueType: 'text',
          label: 'Name',
        },
        {
          key: 'duration',
          valueType: 'ms',
          label: 'Duration',
        },
      ],
      items: [
        {
          name: 'Zone',
          duration: 0.634,
        },
        {
          name: 'Zone:ZoneAwarePromise',
          duration: 0.783,
        },
      ],
    });

    expect(outputs).toStrictEqual({
      table: {
        headings: [
          {
            key: 'name',
            label: 'Name',
          },
          {
            key: 'duration',
            label: 'Duration',
          },
        ],
        items: [
          {
            name: 'Zone',
            duration: 0.634,
          },
          {
            name: 'Zone:ZoneAwarePromise',
            duration: 0.783,
          },
        ],
      },
    });
  });

  it('should render audit details of type debugdata', () => {
    const outputs = toAuditDetails({
      type: 'debugdata',
      items: [
        {
          cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
        },
      ],
    });

    // @TODO add check that cliui.logger is called. Resolve TODO after PR #487 is merged.

    expect(outputs).toStrictEqual({
      table: {
        items: [
          {
            cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
          },
        ],
      },
    });
  });

  it('should inform that filmstrip detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'filmstrip',
      scale: 3000,
      items: [
        {
          timing: 375,
          timestamp: 106_245_424_545,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwY...',
        },
      ],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that screenshot detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'screenshot',
      timing: 541,
      timestamp: 106_245_590_644,
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that treemap-data detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'treemap-data',
      nodes: [],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that criticalrequestchain detail type is not supported yet', () => {
    const outputs = toAuditDetails({
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
    });

    expect(outputs).toStrictEqual({});
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

  it('should return undefined and log if configPath has wrong extension', async () => {
    await expect(
      getConfig({ configPath: join('wrong.not') }),
    ).resolves.toBeUndefined();
    expect(getLogMessages(ui().logger).at(0)).toMatch(
      'Format of file wrong.not not supported',
    );
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
