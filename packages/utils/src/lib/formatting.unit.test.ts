import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDuration,
  pluralize,
  pluralizeToken,
  slugify,
  truncateText,
} from './formatting';

describe('slugify', () => {
  it.each([
    ['Largest Contentful Paint', 'largest-contentful-paint'],
    ['cumulative-layout-shift', 'cumulative-layout-shift'],
    ['max-lines-200', 'max-lines-200'],
    ['rxjs/finnish', 'rxjs-finnish'],
    ['@typescript-eslint/no-explicit-any', 'typescript-eslint-no-explicit-any'],
    ['Code  PushUp ', 'code-pushup'],
  ])('should transform "%s" to valid slug "%s"', (text, slug) => {
    expect(slugify(text)).toBe(slug);
  });
});

describe('pluralize', () => {
  it.each([
    ['warning', 'warnings'],
    ['error', 'errors'],
    ['category', 'categories'],
    ['status', 'statuses'],
  ])('should pluralize "%s" as "%s"', (singular, plural) => {
    expect(pluralize(singular)).toBe(plural);
  });
});

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [1_000, '1000 B'],
    [10_000, '9.77 kB'],
    [10_000_000, '9.54 MB'],
    [10_000_000_000, '9.31 GB'],
    [10_000_000_000_000, '9.09 TB'],
    [5_000_000_000_000_000, '4.44 PB'],
  ])('should log file sizes correctly for %s', (bytes, displayValue) => {
    expect(formatBytes(bytes)).toBe(displayValue);
  });

  it('should log file sizes correctly with correct decimal', () => {
    expect(formatBytes(10_000, 1)).toBe('9.8 kB');
  });
});

describe('pluralizeToken', () => {
  it.each([
    [undefined, '0 files'],
    [-2, '-2 files'],
    [-1, '-1 file'],
    [0, '0 files'],
    [1, '1 file'],
    [2, '2 files'],
  ])('should log correct plural for %s', (times, plural) => {
    expect(pluralizeToken('file', times)).toBe(plural);
  });
});

describe('formatDuration', () => {
  it.each([
    [-1, '-1 ms'],
    [0, '0 ms'],
    [1, '1 ms'],
    [2, '2 ms'],
    [1200, '1.20 s'],
  ])('should log correctly formatted duration for %s', (ms, displayValue) => {
    expect(formatDuration(ms)).toBe(displayValue);
  });
});

describe('truncateText', () => {
  it('should replace overflowing text with ellipsis', () => {
    expect(truncateText('All work and no play makes Jack a dull boy', 32)).toBe(
      'All work and no play makes Ja...',
    );
  });

  it('should produce truncated text which fits within limit', () => {
    expect(
      truncateText('All work and no play makes Jack a dull boy', 32).length,
    ).toBeLessThanOrEqual(32);
  });

  it('should leave text unchanged when within character limit', () => {
    expect(truncateText("Here's Johnny!", 32)).toBe("Here's Johnny!");
  });
});
