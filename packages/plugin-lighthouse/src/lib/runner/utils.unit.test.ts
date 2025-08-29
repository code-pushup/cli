import { bold } from 'ansis';
import debug from 'debug';
import log from 'lighthouse-logger';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AuditOutput,
  type CoreConfig,
  auditOutputsSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_FLAGS } from './constants.js';
import { unsupportedDetailTypes } from './details/details.js';
import type { LighthouseCliFlags } from './types.js';
import {
  determineAndSetLogLevel,
  enrichFlags,
  getConfig,
  normalizeAuditOutputs,
  toAuditOutputs,
} from './utils.js';

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

  it('should set displayValue to "passed" when binary score equals 1', () => {
    expect(
      toAuditOutputs([
        {
          id: 'image-aspect-ratio',
          title: 'Displays images with correct aspect ratio',
          description:
            'Image display dimensions should match natural aspect ratio. [Learn more about image aspect ratio](https://developer.chrome.com/docs/lighthouse/best-practices/image-aspect-ratio/).',
          score: 1,
          scoreDisplayMode: 'binary',
        },
      ]),
    ).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ displayValue: 'passed' }),
      ]),
    );
  });

  it('should set displayValue to "failed" when binary score equals 0', () => {
    expect(
      toAuditOutputs([
        {
          id: 'image-aspect-ratio',
          title: 'Displays images with correct aspect ratio',
          description:
            'Image display dimensions should match natural aspect ratio. [Learn more about image aspect ratio](https://developer.chrome.com/docs/lighthouse/best-practices/image-aspect-ratio/).',
          score: 0,
          scoreDisplayMode: 'binary',
        },
      ]),
    ).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ displayValue: 'failed' }),
      ]),
    );
  });

  it('should set audit value to its score when numericValue is missing', () => {
    expect(
      toAuditOutputs([
        {
          id: 'image-aspect-ratio',
          title: 'Displays images with correct aspect ratio',
          description:
            'Image display dimensions should match natural aspect ratio. [Learn more about image aspect ratio](https://developer.chrome.com/docs/lighthouse/best-practices/image-aspect-ratio/).',
          score: 1,
          scoreDisplayMode: 'binary',
        },
      ]),
    ).toStrictEqual(
      expect.arrayContaining([expect.objectContaining({ value: 1 })]),
    );
  });

  it('should set audit displayValue to formatted score when displayValue is missing and scoreDisplayMode is not binary', () => {
    expect(
      toAuditOutputs([
        {
          id: 'unsized-images',
          title: 'Image elements do not have explicit `width` and `height`',
          description:
            'Set an explicit width and height on image elements to reduce layout shifts and improve CLS. [Learn how to set image dimensions](https://web.dev/articles/optimize-cls#images_without_dimensions)',
          score: 0.5,
          scoreDisplayMode: 'metricSavings',
        },
      ]),
    ).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ displayValue: '50%' }),
      ]),
    );
  });

  it('should not parse given audit details', () => {
    expect(
      toAuditOutputs(
        [
          {
            id: 'cumulative-layout-shift',
            details: {
              type: 'table',
              headings: [{ key: 'number' }] as Details.TableColumnHeading[],
              items: [{ number: 42 }],
            } as Details,
            score: 0,
            numericValue: 0,
            displayValue: '0 ms',
          } as Result,
        ],
        { verbose: true },
      ).at(0)?.details,
    ).toStrictEqual({
      table: {
        columns: [{ key: 'number', align: 'left' }],
        rows: [{ number: 42 }],
      },
    });
  });

  it('should NOT inform for unsupported details if verbose is NOT given', () => {
    const types = [...unsupportedDetailTypes];
    toAuditOutputs(
      types.map(
        type =>
          ({
            id: 'cumulative-layout-shift',
            details: { type, headings: [], items: [] } as Details,
            score: 0,
            numericValue: 0,
            displayValue: '0 ms',
          }) as Result,
      ),
    );
    expect(ui()).not.toHaveLogs();
  });

  it('should inform that for all unsupported details if verbose IS given', () => {
    const types = [...unsupportedDetailTypes];
    toAuditOutputs(
      types.map(
        type =>
          ({
            id: 'cumulative-layout-shift',
            details: { type, headings: [], items: [] } as Details,
            score: 0,
            numericValue: 0,
            displayValue: '0 ms',
          }) as Result,
      ),
      { verbose: true },
    );
    expect(ui()).toHaveLoggedTimes(1);
  });

  it('should not parse empty audit details', () => {
    expect(
      toAuditOutputs(
        [
          {
            id: 'cumulative-layout-shift',
            details: {
              type: 'table',
              headings: [],
              items: [],
            } as Details,
            score: 0,
            numericValue: 0,
            displayValue: '0 ms',
          } as Result,
        ],
        { verbose: true },
      ).at(0)?.details,
    ).toBeUndefined();
  });

  it('should throw for invalid audits', () => {
    expect(() =>
      toAuditOutputs(
        [
          {
            id: 'cumulative-layout-shift',
            details: {
              type: 'table',
              headings: ['left'] as unknown as Details.TableColumnHeading[],
              items: [undefined] as unknown as Details.TableItem[],
            },
            score: 0,
            numericValue: 0,
            displayValue: '0 ms',
          } as unknown as Result,
        ],
        { verbose: true },
      ),
    ).toThrow(
      `Audit ${bold('cumulative-layout-shift')} failed parsing details:`,
    );
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
    expect(ui()).toHaveLogged('info', 'Preset "wrong" is not supported');
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
      getConfig({ configPath: path.join('wrong.not') }),
    ).resolves.toBeUndefined();
    expect(ui()).toHaveLogged('info', 'Format of file wrong.not not supported');
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

describe('enrichFlags', () => {
  it('should return enriched flags without URL index for single URL', () => {
    const flags = {
      ...DEFAULT_CLI_FLAGS,
      outputPath: '/path/to/report.json',
    };
    expect(enrichFlags(flags).outputPath).toBe('/path/to/report.json');
  });

  it('should add URL index to output path for multiple URLs', () => {
    const flags = {
      ...DEFAULT_CLI_FLAGS,
      outputPath: '/path/to/report.json',
    };
    expect(enrichFlags(flags, 2).outputPath).toBe('/path/to/report-2.json');
  });

  it('should handle output path with multiple dots', () => {
    const flags = {
      ...DEFAULT_CLI_FLAGS,
      outputPath: '/path/to/report.min.json',
    };
    expect(enrichFlags(flags, 1).outputPath).toBe('/path/to/report.min-1.json');
  });

  it('should handle default output path', () => {
    expect(enrichFlags(DEFAULT_CLI_FLAGS).outputPath).toBe(
      DEFAULT_CLI_FLAGS.outputPath,
    );
  });

  it('should not modify output path when URL index is 0 or undefined', () => {
    const flags = {
      ...DEFAULT_CLI_FLAGS,
      outputPath: '/path/to/report.json',
    };
    expect(enrichFlags(flags, 0).outputPath).toBe('/path/to/report.json');
    expect(enrichFlags(flags, undefined).outputPath).toBe(
      '/path/to/report.json',
    );
  });

  it('should preserve all other flags', () => {
    const flags: LighthouseCliFlags = {
      outputPath: '/path/to/report.json',
      chromeFlags: ['--headless'],
      onlyAudits: ['performance'],
      skipAudits: ['seo'],
      onlyCategories: [],
      preset: 'desktop',
    };
    expect(enrichFlags(flags, 1)).toEqual({
      chromeFlags: ['--headless'],
      onlyAudits: ['performance'],
      skipAudits: ['seo'],
      onlyCategories: [],
      preset: 'desktop',
      logLevel: 'info',
      outputPath: '/path/to/report-1.json',
    });
  });
});
