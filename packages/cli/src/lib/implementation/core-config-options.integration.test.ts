import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { CoreConfig } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { yargsCoreConfigOptionsDefinition } from './core-config-options';

describe('configOptions', () => {
  function argsFromCli(args: Record<string, unknown>): Promise<CoreConfig> {
    return yargsCli(
      objectToCliArgs({
        ...args,
        config: join('code-pushup.config.ts'),
      }),
      {
        options: yargsCoreConfigOptionsDefinition(),
      },
    ).parseAsync() as unknown as Promise<CoreConfig>;
  }

  it('should fill defaults', async () => {
    const config = await argsFromCli({ config: 'code-pushup.config.ts' });
    expect(config).toBeDefined();
    // only _ and $0
    expect(Object.keys(config)).toHaveLength(3);
  });

  it.each([
    // defaults
    [{}, {}],
    // persist.outputDir
    [{ 'persist.outputDir': 'my-dir' }, { outputDir: 'my-dir' }],
    // persist.filename
    [{ 'persist.filename': 'my-report' }, { filename: 'my-report' }],
    // persist.format
    [{ 'persist.format': 'md' }, { format: ['md'] }],
    [{ 'persist.format': ['md', 'json'] }, { format: ['md', 'json'] }],
    // [{ 'persist.format': 'md,json' }, { format: ['md', 'json'] }], @TODO comment in when config auto-loading is implemented
  ])(
    'should parse persist options %j correctly as %j',
    async (options, result) => {
      const args = await argsFromCli(options);

      expect(args?.persist).toEqual(expect.objectContaining(result));
    },
  );
});
