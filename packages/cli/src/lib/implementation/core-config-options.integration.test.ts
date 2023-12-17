import { describe, expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { yargsCoreConfigOptionsDefinition } from './core-config-options';

describe('configOptions', () => {
  function cli(args: Record<string, unknown>): Promise<CoreConfig> {
    return yargsCli(objectToCliArgs(args), {
      options: yargsCoreConfigOptionsDefinition(),
    }).parseAsync() as unknown as Promise<CoreConfig>;
  }

  it('should fill defaults', async () => {
    const config = await cli({});
    expect(config).toBeDefined();
    // only _ and $0
    expect(Object.keys(config).length).toBe(2);
  });
});
