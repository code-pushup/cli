import { describe, expect } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { yargsOnlyPluginsOptionsDefinition } from './only-plugins-options';

describe('onlyPlugin option', () => {
  type OnlyPluginsOptions = { onlyPlugins?: string | string[] };
  function argsFromCli<T extends OnlyPluginsOptions>(
    args: Record<string, unknown>,
  ) {
    return yargsCli<T>(objectToCliArgs(args), {
      options: yargsOnlyPluginsOptionsDefinition(),
    }).parseAsync() as unknown as Promise<OnlyPluginsOptions>;
  }

  it('should fill defaults', async () => {
    const args = await argsFromCli({});
    expect(args).toBeDefined();
    // "_" and "$0" are in by default
    // camelCase and kebab-case of each option value
    expect(Object.keys(args)).toHaveLength(4);
  });

  it.each([
    // defaults
    [{}, []],
    [{ onlyPlugins: 'lighthouse' }, ['lighthouse']],
    [{ onlyPlugins: ['lighthouse', 'eslint'] }, ['lighthouse', 'eslint']],
    [{ onlyPlugins: 'lighthouse,eslint' }, ['lighthouse', 'eslint']],
  ])(
    'should parse onlyPlugins options %j correctly as %j correctly',
    async (options, result) => {
      const parsedArgs = await argsFromCli(options);
      expect(parsedArgs?.onlyPlugins).toEqual(result);
    },
  );
});
