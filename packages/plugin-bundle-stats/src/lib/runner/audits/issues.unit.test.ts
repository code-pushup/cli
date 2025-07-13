import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkBlacklistIssues,
  checkSizeIssues,
  createBlacklistedIssue,
  createTooLargeIssue,
  createTooSmallIssue,
  getIssues,
} from './issues.js';

describe('createTooLargeIssue', () => {
  it('should create error issue for oversized artifact', () => {
    expect(createTooLargeIssue('bundle.js', 1048576, 500000)).toStrictEqual({
      severity: 'error',
      message: '🔺 `bundle.js` is **1 MB** _(> 488.28 kB)_',
      source: { file: 'bundle.js' },
    });
  });
});

describe('createTooSmallIssue', () => {
  it('should create warning issue for undersized artifact', () => {
    expect(createTooSmallIssue('chunk.js', 512, 2048)).toStrictEqual({
      severity: 'warning',
      message: '🔻 `chunk.js` is **512 B** _(< 2 kB)_',
      source: { file: 'chunk.js' },
    });
  });
});

describe('createBlacklistedIssue', () => {
  it('should create error issue for blacklisted import', () => {
    expect(
      createBlacklistedIssue('src/math.ts', 'dist/bundle.js', '**/*math*'),
    ).toStrictEqual({
      severity: 'error',
      message: '🚫 `src/math.ts` matches blacklist pattern `**/*math*`',
      source: { file: 'dist/bundle.js' },
    });
  });
});

describe('checkSizeIssues', () => {
  it('should return too large issue when file exceeds maxSize', () => {
    expect(
      checkSizeIssues(
        'big.js',
        { path: 'big.js', bytes: 1000 },
        undefined,
        500,
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should return too small issue when file is below minSize', () => {
    expect(
      checkSizeIssues(
        'small.js',
        { path: 'small.js', bytes: 100 },
        500,
        undefined,
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'warning' })]);
  });

  it('should return empty array when file is within size range', () => {
    expect(
      checkSizeIssues('ok.js', { path: 'ok.js', bytes: 750 }, 500, 1000),
    ).toStrictEqual([]);
  });
});

describe('checkBlacklistIssues', () => {
  it('should check output path itself for blacklist patterns', () => {
    expect(
      checkBlacklistIssues('a.js', { path: 'a.js', bytes: 1 }, ['a*']),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should check entryPoint property for blacklist patterns', () => {
    expect(
      checkBlacklistIssues(
        'out.js',
        { path: 'out.js', bytes: 1, entryPoint: 'b.js' },
        ['b*'],
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should check input paths for blacklist patterns', () => {
    expect(
      checkBlacklistIssues(
        'out.js',
        { path: 'out.js', bytes: 1, inputs: { 'c.js': { bytes: 1 } } },
        ['c*'],
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should check import resolved paths for blacklist patterns', () => {
    expect(
      checkBlacklistIssues(
        'out.js',
        {
          path: 'out.js',
          bytes: 1,
          imports: [{ path: 'd.js', kind: 'static' }],
        },
        ['d*'],
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should check import original statements for blacklist patterns', () => {
    expect(
      checkBlacklistIssues(
        'out.js',
        {
          path: 'out.js',
          bytes: 1,
          imports: [{ path: 'x.js', kind: 'static', original: './e' }],
        },
        ['./e*'],
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should return multiple issues when multiple paths match blacklist patterns', () => {
    expect(
      checkBlacklistIssues(
        'f.js',
        {
          path: 'f.js',
          bytes: 1,
          inputs: { 'g.js': { bytes: 1 } },
          imports: [{ path: 'h.js', kind: 'static' }],
        },
        ['*'],
      ),
    ).toStrictEqual([
      expect.objectContaining({ severity: 'error' }),
      expect.objectContaining({ severity: 'error' }),
      expect.objectContaining({ severity: 'error' }),
    ]);
  });

  it('should match disabled paths with (disabled): prefix', () => {
    expect(
      checkBlacklistIssues(
        'out.js',
        {
          path: 'out.js',
          bytes: 1,
          inputs: { '(disabled):i.js': { bytes: 1 } },
        },
        ['*disabled*'],
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });

  it('should match runtime paths with <runtime> pattern', () => {
    expect(
      checkBlacklistIssues(
        'out.js',
        {
          path: 'out.js',
          bytes: 1,
          imports: [{ path: '<runtime>', kind: 'static' }],
        },
        ['<runtime>'],
      ),
    ).toStrictEqual([expect.objectContaining({ severity: 'error' })]);
  });
});

describe('getIssues', () => {
  it('should return empty array when no configuration is provided', () => {
    expect(getIssues({}, {} as any)).toStrictEqual([]);
  });

  it('should process multiple outputs and return issues', () => {
    const result = getIssues(
      {
        'a.js': { path: 'a.js', bytes: 1 },
        'b.js': { path: 'b.js', bytes: 2 },
      },
      { penalty: { blacklist: ['a*'] } } as any,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ severity: 'error' }));
  });
});
