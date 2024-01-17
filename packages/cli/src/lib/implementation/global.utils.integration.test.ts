import { expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { GeneralCliOptions } from './global.model';
import { yargsGlobalOptionsDefinition } from './global.options';

describe('cliWithGlobalOptions', () => {
  const cliWithGlobalOptions = (cliObj: GeneralCliOptions) =>
    yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
      options: {
        ...yargsGlobalOptionsDefinition(),
      },
    });

  it.each([
    ['defaults', 'minimal' as const, {}, { verbose: false, progress: true }],
    [
      'cli args',
      'minimal' as const,
      { verbose: true, progress: false },
      { verbose: true, progress: false },
    ],
  ])(
    'should handle general arguments for %s correctly',
    async (testId, configKind, cliObj, generalResult) => {
      const argv = await cliWithGlobalOptions(
        cliObj as GeneralCliOptions,
      ).parseAsync();
      expect(argv).toEqual(expect.objectContaining(generalResult));
    },
  );
});
