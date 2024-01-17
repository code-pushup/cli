import { expect } from 'vitest';
import { GlobalOptions } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { CoreConfigNames } from '@code-pushup/testing-utils';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { GeneralCliOptions } from './global.model';
import { yargsGlobalOptionsDefinition } from './global.options';

describe('cliWithGlobalOptions', () => {
  const cliWithGlobalOptions = (cliObj: Partial<GeneralCliOptions>) =>
    yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
      options: {
        ...yargsGlobalOptionsDefinition(),
      },
    });

  it.each<[string, CoreConfigNames, Partial<GeneralCliOptions>, GlobalOptions]>(
    [
      ['defaults', 'minimal' as const, {}, { verbose: false, progress: true }],
      [
        'cli args',
        'minimal' as const,
        { verbose: true, progress: false },
        { verbose: true, progress: false },
      ],
    ],
  )(
    'should handle general arguments for %s correctly',
    async (_, configKind, cliObj, expectedObject) => {
      const argv = await cliWithGlobalOptions(cliObj).parseAsync();
      expect(argv).toEqual(expect.objectContaining(expectedObject));
    },
  );
});
