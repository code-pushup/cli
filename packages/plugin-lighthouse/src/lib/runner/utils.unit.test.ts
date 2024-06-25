import debug from 'debug';
import log from 'lighthouse-logger';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { vol } from 'memfs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuditOutput,
  CoreConfig,
  auditOutputsSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME, getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { unsupportedDetailTypes } from './details/details';
import {
  determineAndSetLogLevel,
  getConfig,
  normalizeAuditOutputs,
  toAuditOutputs,
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

describe('normalizeAuditOutputs', () => {
  it('should filter audits listed under skipAudits', () => {
    expect(
      normalizeAuditOutputs(
        [
          { slug: 'largest-contentful-paint' } as AuditOutput,
          { slug: 'cumulative-layout-shifts' } as AuditOutput,
        ],
        { skipAudits: ['largest-contentful-paint'] },
      ),
    ).toStrictEqual([{ slug: 'cumulative-layout-shifts' }]);
  });

  it('should NOT filter audits if no skipAudits are listed', () => {
    expect(
      normalizeAuditOutputs([
        { slug: 'largest-contentful-paint' } as AuditOutput,
        { slug: 'cumulative-layout-shifts' } as AuditOutput,
      ]),
    ).toStrictEqual([
      { slug: 'largest-contentful-paint' },
      { slug: 'cumulative-layout-shifts' },
    ]);
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

  it('should copy lhr numericValue to audit value as float', () => {
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
    ).toStrictEqual([expect.objectContaining({ value: 2838.974 })]);
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

describe('determineAndSetLogLevel', () => {
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

  it('should set log level to info and return "info" as level if no options are given', () => {
    expect(determineAndSetLogLevel()).toBe('info');
    expect(log.isVerbose()).toBe(false);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });

  it('should set log level to verbose and return "verbose" as level', () => {
    expect(determineAndSetLogLevel({ verbose: true })).toBe('verbose');
    expect(log.isVerbose()).toBe(true);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });

  it('should set log level to quiet and return "silent" as level', () => {
    expect(determineAndSetLogLevel({ quiet: true })).toBe('silent');
    expect(log.isVerbose()).toBe(false);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('-LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });

  it('should set log level to verbose if verbose and quiet are given and return "verbose" as level', () => {
    expect(determineAndSetLogLevel({ verbose: true, quiet: true })).toBe(
      'verbose',
    );
    expect(log.isVerbose()).toBe(true);
    expect(debugLib.enabled('LH:*')).toBe(true);
    expect(debugLib.enabled('LH:*:verbose')).toBe(false);
  });
});
