import ansis from 'ansis';
import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDate,
  formatDuration,
  indentLines,
  pluralize,
  pluralizeToken,
  roundDecimals,
  slugify,
  transformLines,
  truncateMultilineText,
  truncateText,
} from './formatting.js';

describe('roundDecimals', () => {
  it('should remove extra decimals', () => {
    expect(roundDecimals(1.2345, 2)).toBe(1.23);
  });

  it('should round last decimal', () => {
    expect(roundDecimals(123.456, 2)).toBe(123.46);
  });

  it('should return number to prevent unnecessary trailing 0s in decimals', () => {
    const result = roundDecimals(42.500_001, 3);
    expect(result).toBeTypeOf('number');
    expect(result.toString()).toBe('42.5');
    expect(result.toString()).not.toBe('42.50');
  });

  it('should leave integers unchanged', () => {
    const value = 42;
    const result = roundDecimals(value, 3);
    expect(result).toBe(value);
    expect(result.toString()).toBe('42');
  });

  it('should round to integer if max decimals set to 0', () => {
    expect(roundDecimals(100.5, 0)).toBe(101);
  });
});

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
    [23, '23 ms'],
    [891, '891 ms'],
    [499.85, '500 ms'],
    [1200, '1.2 s'],
    [56_789, '56.79 s'],
    [60_000, '60 s'],
  ])('should format duration of %s milliseconds as %s', (ms, displayValue) => {
    expect(formatDuration(ms)).toBe(displayValue);
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
      'All work and no play makes Jack…',
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
    ).toBe('…oudy day.');
  });

  it('should produce truncated text with ellipsis at the middle', () => {
    expect(
      truncateText('Horrendous amounts of lint issues are present Tony!', {
        maxChars: 8,
        position: 'middle',
      }),
    ).toBe('Hor…ny!');
  });

  it('should produce truncated text with ellipsis at the end', () => {
    expect(truncateText("I'm Johnny!", { maxChars: 10, position: 'end' })).toBe(
      "I'm Johnn…",
    );
  });

  it('should produce truncated text with custom ellipsis', () => {
    expect(truncateText("I'm Johnny!", { maxChars: 10, ellipsis: '...' })).toBe(
      "I'm Joh...",
    );
  });
});

describe('transformMultilineText', () => {
  it('should replace additional lines with an ellipsis', () => {
    const error = `SchemaValidationError: Invalid CoreConfig in code-pushup.config.ts file
✖ Invalid input: expected array, received undefined
  → at plugins`;
    expect(truncateMultilineText(error)).toBe(
      'SchemaValidationError: Invalid CoreConfig in code-pushup.config.ts file […]',
    );
  });

  it('should leave one-liner texts unchanged', () => {
    expect(truncateMultilineText('Hello, world!')).toBe('Hello, world!');
  });

  it('should omit ellipsis if additional lines have no non-whitespace characters', () => {
    expect(truncateMultilineText('- item 1\n  \n\n')).toBe('- item 1');
  });
});

describe('transformLines', () => {
  it('should apply custom transformation to each line', () => {
    let count = 0;
    expect(
      transformLines(
        `export function greet(name = 'World') {\n  console.log('Hello, ' + name + '!');\n}\n`,
        line => {
          const prefix = `${++count} | `;
          return `${ansis.gray(prefix)}${line}`;
        },
      ),
    ).toBe(
      `
${ansis.gray('1 | ')}export function greet(name = 'World') {
${ansis.gray('2 | ')}  console.log('Hello, ' + name + '!');
${ansis.gray('3 | ')}}
${ansis.gray('4 | ')}`.trimStart(),
    );
  });

  it('should support CRLF line endings', () => {
    expect(
      transformLines(
        'ESLint v9.16.0\r\n\r\nAll files pass linting.\r\n',
        line => `> ${line}`,
      ),
    ).toBe(
      `
> ESLint v9.16.0
> 
> All files pass linting.
> `.trimStart(),
    );
  });
});

describe('indentLines', () => {
  it('should indent each line by given number of spaces', () => {
    expect(indentLines('ESLint v9.16.0\n\nAll files pass linting.\n', 2)).toBe(
      `
  ESLint v9.16.0
  
  All files pass linting.
  `.slice(1), // ignore first line break
    );
  });
});
