import chalk from 'chalk';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { LIGHTHOUSE_OUTPUT_PATH } from './constants';
import { normalizeFlags } from './normalize-flags';
import { LIGHTHOUSE_REPORT_NAME } from './runner/constants';
import { LighthouseOptions } from './types';

describe('normalizeFlags', () => {
  const normalizedDefaults = {
    verbose: false,
    quiet: false,
    saveAssets: false,
    // needed to pass CI on linux and windows (locally it works without headless too)
    chromeFlags: ['--headless=shell'],
    port: 0,
    hostname: '127.0.0.1',
    view: false,
    channel: 'cli',
    // custom overwrites in favour of the plugin
    onlyAudits: [],
    skipAudits: [],
    onlyCategories: [],
    budgets: [],
    output: ['json'],
    outputPath: join(LIGHTHOUSE_OUTPUT_PATH, LIGHTHOUSE_REPORT_NAME),
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
        budgets: undefined,
        onlyAudits: 'largest-contentful-paint',
        skipAudits: 'is-on-https',
        chromeFlags: '--headless=shell',
        channel: 'cli',
      }),
    ).toEqual(
      expect.objectContaining({
        budgets: [],
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
      'list-all-audits': true,
      'list-locales': '',
      'list-trace-categories': '',
      chromeIgnoreDefaultFlags: false,
      enableErrorReporting: '',
      precomputedLanternDataPath: '',
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
    expect(getLogMessages(ui().logger).at(0)).toBe(
      `[ blue(info) ] ${chalk.yellow(
        '⚠',
      )} The following used flags are not supported: ${chalk.bold(
        Object.keys(unsupportedFlags).join(', '),
      )}`,
    );
  });
});
