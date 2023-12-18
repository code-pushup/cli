import { describe, expect } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { yargsGlobalOptionsDefinition } from './global-options';
import { GeneralCliOptions } from './model';

describe('globalOptions', () => {
  function cli(args: Record<string, unknown>): Promise<GeneralCliOptions> {
    return yargsCli(objectToCliArgs(args), {
      options: yargsGlobalOptionsDefinition(),
    }).parseAsync() as unknown as Promise<GeneralCliOptions>;
  }

  it('should fill defaults', async () => {
    const config = await cli({});
    expect(config.verbose).toBe(false);
    expect(config.progress).toBe(true);
    expect(config.config).toBe('code-pushup.config.js');
  });
});
