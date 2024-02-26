import { describe, expect, it } from 'vitest';
import { toBenchmarkJSRunnerConfig } from './utils';

describe('toBenchmarkJSRunnerConfig', () => {
  it('should parse valid options', () => {
    expect(toBenchmarkJSRunnerConfig('https://code-pushup-portal.com')).toEqual(
      expect.arrayContaining(['https://code-pushup-portal.com']),
    );
  });
});
