import { expect } from 'vitest';
import { mergeExecutorOptions } from './utils.js';

describe('mergeExecutorOptions', () => {
  it('should deeply merge target and CLI options', () => {
    const targetOptions = {
      persist: {
        outputDir: '.reports',
        filename: 'report',
      },
    };
    const cliOptions = {
      persist: {
        filename: 'report-file',
      },
    };
    const expected = {
      persist: {
        outputDir: '.reports',
        filename: 'report-file',
      },
    };
    expect(mergeExecutorOptions(targetOptions, cliOptions)).toEqual(expected);
  });
});
