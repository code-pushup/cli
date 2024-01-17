import { expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { GeneralCliOptions } from './global.model';
import { yargsGlobalOptionsDefinition } from './global.options';
import { filterKebabCaseKeys } from './global.utils';

describe('filterKebabCaseKeys', () => {
  it('should filter root level kebab-case keys', () => {
    const obj = {
      'kebab-case': 'value',
      camelCase: 'value',
      snake_case: 'value',
    };
    expect(filterKebabCaseKeys(obj)).toEqual({
      camelCase: 'value',
      snake_case: 'value',
    });
  });

  it('should filter nested kebab-case keys', () => {
    const obj = {
      nested: {
        'nested-kebab-case': 'value',
        nestedCamelCase: 'value',
      },
    };
    expect(filterKebabCaseKeys(obj)).toEqual({
      nested: {
        nestedCamelCase: 'value',
      },
    });
  });

  it('should keep array values untouched', () => {
    const obj = {
      'kebab-case': [],
      camelCase: ['kebab-case', { 'kebab-case': 'value' }],
    };
    expect(filterKebabCaseKeys(obj)).toEqual({
      camelCase: ['kebab-case', { 'kebab-case': 'value' }],
    });
  });
});

describe('cliWithGlobalOptionsAndMiddleware', () => {
  const cliWithGlobalOptionsAndMiddleware = (cliObj: GeneralCliOptions) =>
    yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
      options: {
        ...yargsGlobalOptionsDefinition(),
      },
    });

  it.each([
    [
      'minimal' as const,
      {},
      { verbose: false, progress: true },
      'persist' as const,
      { verbose: true, progress: false },
      { verbose: true, progress: false },
    ],
  ])(
    'should handle general arguments for %s correctly',
    async (configKind, cliObj, generalResult) => {
      const argv = await cliWithGlobalOptionsAndMiddleware(
        cliObj as GeneralCliOptions,
      ).parseAsync();
      expect(argv.persist).toEqual(expect.objectContaining(generalResult));
    },
  );
});
