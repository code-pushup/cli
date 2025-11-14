import { beforeAll, describe, expect, vi } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { logger } from '../logger.js';
import { ui } from '../logging.js';
import {
  binaryIconPrefix,
  logCategories,
  logPlugins,
} from './log-stdout-summary.js';
import type { ScoredReport } from './types.js';

describe('logCategories', () => {
  let logs: string[];

  beforeAll(() => {
    logs = [];
    // console.log is used inside the logger when in "normal" mode
    vi.spyOn(console, 'log').mockImplementation(msg => {
      logs = [...logs, msg];
    });
    // we want to see table and sticker logs in the final style ("raw" don't show borders etc so we use `console.log` here)
    ui().switchMode('normal');
  });

  afterEach(() => {
    logs = [];
  });

  afterAll(() => {
    ui().switchMode('raw');
  });

  it('should list categories', () => {
    const categories: ScoredReport['categories'] = [
      {
        slug: 'performance',
        score: 0.42,
        title: 'Performance',
        refs: [
          {
            slug: 'total-blocking-time',
            type: 'audit',
            plugin: 'lighthouse',
            weight: 1,
          },
        ],
      },
    ];

    const plugins = [
      {
        slug: 'lighthouse',
        icon: 'file',
        audits: [
          {
            slug: 'total-blocking-time',
            score: 0.42,
            value: 2000,
            title: 'Total blocking time',
          },
        ],
      },
    ] as ScoredReport['plugins'];

    logCategories({ plugins, categories });

    const output = logs.join('\n');

    expect(output).not.toContain('✅');
    expect(output).not.toContain('❌');
    expect(output).toContain('Performance');
    expect(output).toContain('42');
    expect(output).toContain('1');
  });

  it('should list categories with score < scoreTarget', () => {
    const categories: ScoredReport['categories'] = [
      {
        slug: 'performance',
        score: 0.42,
        scoreTarget: 1,
        title: 'Performance',
        refs: [
          {
            slug: 'total-blocking-time',
            type: 'audit',
            plugin: 'lighthouse',
            weight: 1,
          },
        ],
      },
    ];

    const plugins = [
      {
        slug: 'lighthouse',
        icon: 'file',
        audits: [
          {
            slug: 'total-blocking-time',
            score: 0.42,
            value: 2000,
            title: 'Total blocking time',
          },
        ],
      },
    ] as ScoredReport['plugins'];

    logCategories({ plugins, categories });

    const output = logs.join('\n');

    expect(output).not.toContain('✓');
    expect(output).toContain('✗');
    expect(output).toContain('Performance');
    expect(output).toContain('42');
    expect(output).toContain('1');
  });

  it('should list categories with score >= scoreTarget', () => {
    const categories: ScoredReport['categories'] = [
      {
        slug: 'performance',
        score: 1,
        scoreTarget: 1,
        title: 'Performance',
        refs: [
          {
            slug: 'total-blocking-time',
            type: 'audit',
            plugin: 'lighthouse',
            weight: 1,
          },
        ],
      },
    ];

    const plugins = [
      {
        slug: 'lighthouse',
        icon: 'file',
        audits: [
          {
            slug: 'total-blocking-time',
            score: 1,
            value: 100,
            title: 'Total blocking time',
          },
        ],
      },
    ] as ScoredReport['plugins'];

    logCategories({ plugins, categories });

    const output = logs.join('\n');

    expect(output).toContain('✓');
    expect(output).not.toContain('✗');
    expect(output).toContain('Performance');
    expect(output).toContain('100');
    expect(output).toContain('1');
  });
});

describe('logPlugins', () => {
  let stdout: string;

  beforeAll(() => {
    vi.mocked(logger.info).mockImplementation(message => {
      stdout += `${message}\n`;
    });
  });

  beforeEach(() => {
    stdout = '';
  });

  it('should log only audits with scores other than 1 when verbose is false', () => {
    logger.setVerbose(false);

    logPlugins([
      {
        title: 'Best Practices',
        slug: 'best-practices',
        audits: [
          { title: 'Audit 1', score: 0.75, value: 75 },
          { title: 'Audit 2', score: 1, value: 100 },
        ],
      },
    ] as ScoredReport['plugins']);

    expect(stdout).toContain('Audit 1');
    expect(stdout).not.toContain('Audit 2');
    expect(stdout).toContain('audits with perfect scores');
  });

  it('should log all audits when verbose is true', () => {
    logger.setVerbose(true);

    logPlugins([
      {
        title: 'Best Practices',
        slug: 'best-practices',
        audits: [
          { title: 'Audit 1', score: 0.5, value: 50 },
          { title: 'Audit 2', score: 1, value: 100 },
        ],
      },
    ] as ScoredReport['plugins']);

    expect(stdout).toContain('Audit 1');
    expect(stdout).toContain('Audit 2');
  });

  it('should indicate all audits have perfect scores', () => {
    logger.setVerbose(false);

    logPlugins([
      {
        title: 'Best Practices',
        slug: 'best-practices',
        audits: [
          { title: 'Audit 1', score: 1, value: 100 },
          { title: 'Audit 2', score: 1, value: 100 },
        ],
      },
    ] as ScoredReport['plugins']);

    expect(stdout).toContain('All 2 audits have perfect scores');
  });

  it('should log original audits when verbose is false and no audits have perfect scores', () => {
    logger.setVerbose(false);

    logPlugins([
      {
        title: 'Best Practices',
        slug: 'best-practices',
        audits: [
          { title: 'Audit 1', score: 0.5, value: 100 },
          { title: 'Audit 2', score: 0.5, value: 100 },
        ],
      },
    ] as ScoredReport['plugins']);

    expect(stdout).toContain('Audit 1');
    expect(stdout).toContain('Audit 2');
  });

  it('should not truncate a perfect audit in non-verbose mode when it is the only audit available', () => {
    logger.setVerbose(false);

    logPlugins([
      {
        title: 'Best Practices',
        slug: 'best-practices',
        audits: [{ title: 'Audit 1', score: 1, value: 100 }],
      },
    ] as ScoredReport['plugins']);

    expect(stdout).toContain('Audit 1');
  });
});

describe('binaryIconPrefix', () => {
  it('should return passing binaryPrefix when score >= scoreTarget', () => {
    expect(removeColorCodes(binaryIconPrefix(1, 1))).toBe('✓ ');
  });

  it('should return failing binaryPrefix when score < scoreTarget', () => {
    expect(removeColorCodes(binaryIconPrefix(0, 1))).toBe('✗ ');
  });

  it('should return NO binaryPrefix when scoreTarget is undefined', () => {
    expect(binaryIconPrefix(1, undefined)).toBe('');
  });
});
