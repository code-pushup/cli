import { describe, expect, it } from 'vitest';
import {
  type TableCellValue,
  docsUrlSchema,
  globPathSchema,
  tableCellValueSchema,
  weightSchema,
} from './schemas.js';

describe('primitiveValueSchema', () => {
  it('should accept a valid union', () => {
    const value: TableCellValue = 'test';
    expect(() => tableCellValueSchema.parse(value)).not.toThrow();
  });

  it('should throw for a invalid union', () => {
    const value = new Date();
    expect(() => tableCellValueSchema.parse(value)).toThrow('invalid_union');
  });
});

describe('weightSchema', () => {
  it('should accept an integer', () => {
    expect(() => weightSchema.parse(1)).not.toThrow();
  });

  it('should accept a float', () => {
    expect(() => weightSchema.parse(0.5)).not.toThrow();
  });

  it('should accept zero', () => {
    expect(() => weightSchema.parse(0)).not.toThrow();
  });

  it('should throw for negative number', () => {
    expect(() => weightSchema.parse(-1)).toThrow('too_small');
  });
});

describe('docsUrlSchema', () => {
  it('should accept a valid URL', () => {
    expect(() =>
      docsUrlSchema.parse(
        'https://eslint.org/docs/latest/rules/no-unused-vars',
      ),
    ).not.toThrow();
  });

  it('should accept an empty string', () => {
    expect(() => docsUrlSchema.parse('')).not.toThrow();
  });

  it('should tolerate invalid URL - treat as missing and log warning', () => {
    expect(
      docsUrlSchema.parse(
        '/home/user/project/tools/eslint-rules/rules/my-custom-rule.ts',
      ),
    ).toBe('');
    expect(console.warn).toHaveBeenCalledWith(
      'Ignoring invalid docsUrl: /home/user/project/tools/eslint-rules/rules/my-custom-rule.ts',
    );
  });

  it('should throw if not a string', () => {
    expect(() => docsUrlSchema.parse(false)).toThrow(
      'Invalid input: expected string, received boolean',
    );
  });
});

describe('globPathSchema', () => {
  it.each([
    '**/*.ts',
    'src/components/*.jsx',
    '{src,lib,test}/**/*.js',
    '!node_modules/**',
  ])('should accept a valid glob pattern: %s', pattern => {
    expect(() => globPathSchema.parse(pattern)).not.toThrow();
  });

  it.each(['path<file.js', 'path>file.js', 'path"file.js', 'path|file.js'])(
    'should throw for invalid path with forbidden character: %s',
    pattern => {
      expect(() => globPathSchema.parse(pattern)).toThrow();
    },
  );
});
