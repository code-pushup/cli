import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDate,
  formatDuration,
  pluralize,
  pluralizeToken,
  slugify,
  truncateText,
} from './formatting.js';

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

  it('should not pluralize if 1 passed in as amount', () => {
    expect(pluralize('audit', 1)).toBe('audit');
  });

  it('should pluralize if amount is other than 1/-1', () => {
    expect(pluralize('audit', 2)).toBe('audits');
  });
});

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [-1, '0 B'],
    [1000, '1000 B'],
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

  it('should log formatted duration with 1 digit after the decimal point', () => {
    expect(formatDuration(120.255_555, 1)).toBe('120.3 ms');
  });
});

describe('formatDate', () => {
  it('should produce human-readable date and time in English', () => {
    expect(formatDate(new Date('2024-01-23T09:50:09.606Z'))).toBe(
      'Tue, Jan 23, 2024, 9:50 AM UTC',
    );
  });

  // see https://github.com/nodejs/node/issues/45171
  it('should not include narrow non-breaking space', () => {
    expect(formatDate(new Date())).not.toMatch(' ');
  });
});

describe('truncateText', () => {
  it('should replace overflowing text with ellipsis at the end', () => {
    expect(truncateText('All work and no play makes Jack a dull boy', 32)).toBe(
      'All work and no play makes Ja...',
    );
  });

  it('should leave text unchanged when within character limit passed as number', () => {
    expect(truncateText("Here's Johnny!", 32)).toBe("Here's Johnny!");
  });

  it('should produce truncated text which fits within limit passed as number', () => {
    expect(
      truncateText('All work and no play makes Jack a dull boy', 32).length,
    ).toBeLessThanOrEqual(32);
  });

  it('should leave text unchanged when within character limit passed as options', () => {
    expect(truncateText("Here's Johnny!", { maxChars: 32 })).toBe(
      "Here's Johnny!",
    );
  });

  it('should produce truncated text with ellipsis at the start', () => {
    expect(
      truncateText('Yesterday cloudy day.', {
        maxChars: 10,
        position: 'start',
      }),
    ).toBe('...dy day.');
  });

  it('should produce truncated text with ellipsis at the middle', () => {
    expect(
      truncateText('Horrendous amounts of lint issues are present Tony!', {
        maxChars: 10,
        position: 'middle',
      }),
    ).toBe('Hor...ny!');
  });

  it('should produce truncated text with ellipsis at the end', () => {
    expect(truncateText("I'm Johnny!", { maxChars: 10, position: 'end' })).toBe(
      "I'm Joh...",
    );
  });

  it('should produce truncated text with custom ellipsis', () => {
    expect(truncateText("I'm Johnny!", { maxChars: 10, ellipsis: '*' })).toBe(
      "I'm Johnn*",
    );
  });
});
