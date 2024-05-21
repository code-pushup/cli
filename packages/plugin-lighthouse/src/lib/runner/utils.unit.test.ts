import debug from 'debug';
import { type Budget } from 'lighthouse';
import log from 'lighthouse-logger';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { vol } from 'memfs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreConfig, auditOutputsSchema } from '@code-pushup/models';
import { MEMFS_VOLUME, getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { unsupportedDetailTypes } from './details/details';
import { getBudgets, getConfig, setLogLevel, toAuditOutputs } from './utils';

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
