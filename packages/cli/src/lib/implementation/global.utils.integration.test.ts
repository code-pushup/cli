import { expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { GeneralCliOptions } from './global.model';
import { yargsGlobalOptionsDefinition } from './global.options';

describe('cliWithGlobalOptions', () => {
  const cliWithGlobalOptions = (cliObj: Partial<GeneralCliOptions> = {}) =>
    yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
      options: {
        ...yargsGlobalOptionsDefinition(),
      },
    });

  it('should take defaults for general arguments', async () => {
    const argv = await cliWithGlobalOptions().parseAsync();
    expect(argv).toEqual(
      expect.objectContaining({ verbose: false, progress: true }),
    );
  });

  it('should arguments for general correctly when given over the cli', async () => {
    const argv = await cliWithGlobalOptions({
      verbose: true,
      progress: false,
    }).parseAsync();
    expect(argv).toEqual(
      expect.objectContaining({ verbose: true, progress: false }),
    );
  });
});
