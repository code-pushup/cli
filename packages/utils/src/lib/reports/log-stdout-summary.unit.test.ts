import { beforeAll, describe, expect, vi } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { ui } from '../logging';
import { binaryIconPrefix, logCategories } from './log-stdout-summary';
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

    logCategories({ categories, plugins } as ScoredReport);

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

    logCategories({ categories, plugins } as ScoredReport);

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

    logCategories({ categories, plugins } as ScoredReport);

    const output = logs.join('\n');

    expect(output).toContain('✓');
    expect(output).not.toContain('✗');
    expect(output).toContain('Performance');
    expect(output).toContain('100');
    expect(output).toContain('1');
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
});
