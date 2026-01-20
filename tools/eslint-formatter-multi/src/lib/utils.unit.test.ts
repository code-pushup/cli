import type { ESLint } from 'eslint';
import { removeColorCodes } from '@code-pushup/test-utils';
import {
  formatContent,
  formatTerminalOutput,
  findConfigFromEnv as getConfigFromEnv,
  getExtensionForFormat,
} from './utils.js';

describe('getExtensionForFormat', () => {
  it.each([
    ['json', 'json'],
    ['stylish', 'txt'],
    ['unknown', 'txt'],
    ['', 'txt'],
  ])('should return json extension for json format', (format, ext) => {
    expect(getExtensionForFormat(format)).toBe(ext);
  });
});

describe('getConfigFromEnv', () => {
  it('should return null when ESLINT_FORMATTER_CONFIG is not set', () => {
    const env = {};
    expect(getConfigFromEnv(env)).toBeNull();
  });

  it('should return null when ESLINT_FORMATTER_CONFIG is empty string', () => {
    const env = { ESLINT_FORMATTER_CONFIG: '' };
    expect(getConfigFromEnv(env)).toBeNull();
  });

  it('should return null when ESLINT_FORMATTER_CONFIG is whitespace only', () => {
    const env = { ESLINT_FORMATTER_CONFIG: '   ' };
    expect(getConfigFromEnv(env)).toBeNull();
  });

  it('should parse valid JSON configuration', () => {
    const config = {
      outputDir: './reports',
      filename: 'lint-results',
      formats: ['json', 'stylish'],
      terminal: 'stylish',
    };
    const env = { ESLINT_FORMATTER_CONFIG: JSON.stringify(config) };

    expect(getConfigFromEnv(env)).toEqual(config);
  });

  it('should return null and log error for invalid JSON', () => {
    const env = { ESLINT_FORMATTER_CONFIG: '{ invalid json }' };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(getConfigFromEnv(env)).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing ESLINT_FORMATTER_CONFIG environment variable:',
      expect.any(String),
    );
  });
});

describe('formatContent', () => {
  const mockResults: ESLint.LintResult[] = [
    {
      filePath: '/test/file.js',
      messages: [
        {
          line: 1,
          column: 1,
          message: 'Test error',
          severity: 2,
          ruleId: 'test-rule',
        },
      ],
      errorCount: 1,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      fatalErrorCount: 0,
      suppressedMessages: [],
      usedDeprecatedRules: [],
    },
  ];

  it('should format results as JSON when format is json', () => {
    const result = formatContent(mockResults, 'json');
    expect(result).toMatchInlineSnapshot(`
      "[
        {
          "filePath": "/test/file.js",
          "messages": [
            {
              "line": 1,
              "column": 1,
              "message": "Test error",
              "severity": 2,
              "ruleId": "test-rule"
            }
          ],
          "errorCount": 1,
          "warningCount": 0,
          "fixableErrorCount": 0,
          "fixableWarningCount": 0,
          "fatalErrorCount": 0,
          "suppressedMessages": [],
          "usedDeprecatedRules": []
        }
      ]"
    `);
  });

  it('should use stylish formatter when format is stylish', () => {
    const result = formatContent(mockResults, 'stylish');

    expect(removeColorCodes(result)).toMatchInlineSnapshot(`
      "
      /test/file.js
        1:1  error  Test error  test-rule

      ✖ 1 problem (1 error, 0 warnings)
      "
    `);
  });

  it('should default to stylish formatter for unknown formats', () => {
    const result = formatContent(mockResults, 'unknown' as any);

    expect(removeColorCodes(result)).toMatchInlineSnapshot(`
      "
      /test/file.js
        1:1  error  Test error  test-rule

      ✖ 1 problem (1 error, 0 warnings)
      "
    `);
  });
});

describe('formatTerminalOutput', () => {
  const mockResults: ESLint.LintResult[] = [];

  it('should return empty string when format is undefined', () => {
    expect(formatTerminalOutput(undefined, mockResults)).toBe('');
  });

  it('should call formatContent when format is provided', () => {
    const result = formatTerminalOutput('json', mockResults);
    expect(result).toMatchInlineSnapshot(`"[]"`);
  });
});
