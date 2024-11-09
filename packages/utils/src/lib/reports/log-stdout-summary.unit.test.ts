import { beforeAll, describe, expect, vi } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { ui } from '../logging';
import {
  binaryIconPrefix,
  logCategories,
  logPlugins,
} from './log-stdout-summary';
import type { ScoredReport } from './types';

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

  it('should list categories with failed isBinary', () => {
    const categories: ScoredReport['categories'] = [
      {
        slug: 'performance',
        score: 0.42,
        title: 'Performance',
        isBinary: true,
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

  it('should list categories with passed isBinary', () => {
    const categories: ScoredReport['categories'] = [
      {
        slug: 'performance',
        score: 1,
        title: 'Performance',
        isBinary: true,
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
  let logs: string[];

  beforeAll(() => {
    logs = [];
    vi.spyOn(console, 'log').mockImplementation(msg => {
      logs = [...logs, msg];
    });
    ui().switchMode('normal');
  });

  afterEach(() => {
    logs = [];
  });

  afterAll(() => {
    ui().switchMode('raw');
  });

  it('should log only audits with scores other than 1 when verbose is false', () => {
    logPlugins(
      [
        {
          title: 'Best Practices',
          slug: 'best-practices',
          audits: [
            { title: 'Audit 1', score: 0.75, value: 75 },
            { title: 'Audit 2', score: 1, value: 100 },
          ],
        },
      ] as ScoredReport['plugins'],
      false,
    );
    const output = logs.join('\n');
    expect(output).toContain('Audit 1');
    expect(output).not.toContain('Audit 2');
    expect(output).toContain('audits with perfect scores omitted for brevity');
  });

  it('should log all audits when verbose is true', () => {
    logPlugins(
      [
        {
          title: 'Best Practices',
          slug: 'best-practices',
          audits: [
            { title: 'Audit 1', score: 0.5, value: 50 },
            { title: 'Audit 2', score: 1, value: 100 },
          ],
        },
      ] as ScoredReport['plugins'],
      true,
    );
    const output = logs.join('\n');
    expect(output).toContain('Audit 1');
    expect(output).toContain('Audit 2');
  });

  it('should indicate all audits have perfect scores', () => {
    logPlugins(
      [
        {
          title: 'Best Practices',
          slug: 'best-practices',
          audits: [
            { title: 'Audit 1', score: 1, value: 100 },
            { title: 'Audit 2', score: 1, value: 100 },
          ],
        },
      ] as ScoredReport['plugins'],
      false,
    );
    const output = logs.join('\n');
    expect(output).toContain('All 2 audits have perfect scores');
  });

  it('should log original audits when verbose is false and no audits have perfect scores', () => {
    logPlugins(
      [
        {
          title: 'Best Practices',
          slug: 'best-practices',
          audits: [
            { title: 'Audit 1', score: 0.5, value: 100 },
            { title: 'Audit 2', score: 0.5, value: 100 },
          ],
        },
      ] as ScoredReport['plugins'],
      false,
    );
    const output = logs.join('\n');
    expect(output).toContain('Audit 1');
    expect(output).toContain('Audit 2');
  });

  it('should not truncate a perfect audit in non-verbose mode when it is the only audit available', () => {
    logPlugins(
      [
        {
          title: 'Best Practices',
          slug: 'best-practices',
          audits: [{ title: 'Audit 1', score: 1, value: 100 }],
        },
      ] as ScoredReport['plugins'],
      false,
    );
    const output = logs.join('\n');
    expect(output).toContain('Audit 1');
  });
});

describe('binaryIconPrefix', () => {
  it('should return passing binaryPrefix if score is 1 and isBinary is true', () => {
    expect(removeColorCodes(binaryIconPrefix(1, true))).toBe('✓ ');
  });

  it('should return failing binaryPrefix if score is < then 1 and isBinary is true', () => {
    expect(removeColorCodes(binaryIconPrefix(0, true))).toBe('✗ ');
  });

  it('should return NO binaryPrefix if score is 1 and isBinary is false', () => {
    expect(binaryIconPrefix(1, false)).toBe('');
  });

  it('should return NO binaryPrefix when isBinary is undefined', () => {
    expect(binaryIconPrefix(1, undefined)).toBe('');
  });
});
