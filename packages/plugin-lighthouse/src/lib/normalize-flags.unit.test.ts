import ansis from 'ansis';
import path from 'node:path';
import { logger } from '@code-pushup/utils';
import { DEFAULT_CHROME_FLAGS, LIGHTHOUSE_OUTPUT_PATH } from './constants.js';
import { logUnsupportedFlagsInUse, normalizeFlags } from './normalize-flags.js';
import { LIGHTHOUSE_REPORT_NAME } from './runner/constants.js';
import type { LighthouseOptions } from './types.js';

describe('logUnsupportedFlagsInUse', () => {
  it('should log unsupported entries', () => {
    logUnsupportedFlagsInUse({ 'list-all-audits': true } as LighthouseOptions);
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      `Used unsupported flags: ${ansis.bold('list-all-audits')}`,
    );
  });

  it('should log only 3 details of unsupported entries', () => {
    const unsupportedFlags = {
      'list-all-audits': true,
      'list-locales': '',
      'list-trace-categories': '',
      chromeIgnoreDefaultFlags: false,
      enableErrorReporting: '',
      precomputedLanternDataPath: '',
    };
    logUnsupportedFlagsInUse({
      // unsupported
      ...unsupportedFlags,
    } as unknown as LighthouseOptions);
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      `Used unsupported flags: ${ansis.bold(
        'list-all-audits, list-locales, list-trace-categories',
      )} and 3 more.`,
    );
  });
});

describe('normalizeFlags', () => {
  const normalizedDefaults = {
    verbose: false,
    saveAssets: false,
    chromeFlags: DEFAULT_CHROME_FLAGS,
    port: 0,
    hostname: '127.0.0.1',
    view: false,
    channel: 'cli',
    // custom overwrites in favour of the plugin
    quiet: true,
    output: ['json'],
    outputPath: path.join(LIGHTHOUSE_OUTPUT_PATH, LIGHTHOUSE_REPORT_NAME),
  };

  it('should fill defaults with undefined flags', () => {
    expect(normalizeFlags()).toStrictEqual(normalizedDefaults);
  });

  it('should fill defaults with empty flags', () => {
    expect(normalizeFlags({})).toStrictEqual(normalizedDefaults);
  });

  it('should forward supported entries', () => {
    expect(normalizeFlags({ verbose: true })).toEqual(
      expect.objectContaining({ verbose: true }),
    );
  });

  it('should refine entries', () => {
    expect(
      normalizeFlags({
        onlyAudits: 'largest-contentful-paint',
        skipAudits: 'is-on-https',
        chromeFlags: '--headless=shell',
        channel: 'cli',
      }),
    ).toEqual(
      expect.objectContaining({
        onlyAudits: ['largest-contentful-paint'],
        skipAudits: ['is-on-https'],
        chromeFlags: ['--headless=shell'],
        channel: 'cli',
      }),
    );
  });

  it('should rename entries', () => {
    expect(
      normalizeFlags({
        onlyGroups: 'performance',
      }),
    ).toEqual(
      expect.objectContaining({
        onlyCategories: ['performance'],
      }),
    );
  });

  it('should remove unsupported entries and log', () => {
    const unsupportedFlags = {
      'list-all-audits': '',
      chromeIgnoreDefaultFlags: false,
    };
    const supportedFlags = {
      verbose: true,
    };
    expect(
      normalizeFlags({
        // unsupported
        ...unsupportedFlags,
        // supported
        ...supportedFlags,
      } as unknown as LighthouseOptions),
    ).toEqual(expect.not.objectContaining({ 'list-all-audits': true }));
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('should remove any flag with an empty array as a value', () => {
    const flags = {
      onlyAudits: [],
      skipAudits: [],
      onlyCategories: [],
    };
    const result = normalizeFlags(flags);
    expect(result).not.toHaveProperty('onlyAudits');
    expect(result).not.toHaveProperty('skipAudits');
    expect(result).not.toHaveProperty('onlyCategories');
  });
});
