import yargs from 'yargs';
import { yargsCollectCommandObject } from './command-object';
import {CoreConfig, PluginConfig, Report, RunnerOutput, runnerOutputSchema} from '@quality-metrics/models';
import { CollectOptions, CollectOutputError } from '@quality-metrics/utils';
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import {middlewares} from "../middlewares";

const outputPath = 'collect-command-object.json';
const dummyConfig: CoreConfig = {
  persist: { outputPath },
  plugins: [mockPlugin({outputPath})],
  categories: [],
};

describe('collect-command-object', () => {
  it('should parse arguments correctly', async () => {
    const args = ['collect', '--verbose', '--configPath', ''];
    const cli = yargs([])
      .config(dummyConfig)
      .command(yargsCollectCommandObject());

    const parsedArgv = (await cli.parseAsync(
      args,
    )) as unknown as CollectOptions;
    const { persist } = parsedArgv;
    const { outputPath: outPath } = persist;
    expect(outPath).toBe(outputPath);

    return Promise.resolve(void 0);
  });

  it('should execute plugins correctly', async () => {
    const args = ['collect'];
    await yargs([])
      .config(dummyConfig)
      .middleware(middlewares[0].middlewareFunction)
      .command(yargsCollectCommandObject())
      .parseAsync(args);

    const result = JSON.parse(readFileSync(outputPath).toString());
    expect(result).toBe('');
  });

  // @TODO if we dont catch the error in the handler we always exit the process
  it('should throw if plugin output is wrong', async () => {
    const configWithWrongAuditOutput = JSON.parse(JSON.stringify(dummyConfig));
    configWithWrongAuditOutput.plugins[0] = mockPlugin({
      outputPath,
      auditOutput: 'wrong output' as unknown as Report,
    });

    let error: Error = undefined as unknown as Error;
    await yargsCollectCommandObject()
      .handler(configWithWrongAuditOutput)
      ?.catch(e => (error = e));
    expect(error.message).toContain(
     'collect-command-object'
    );
  });
});

function mockPlugin(
  opt: { outputPath: string; auditOutput?: Report } = { outputPath },
): PluginConfig {
  return {
    audits: [
      {
        slug: 'command-object-audit-slug',
        title: 'audit title',
        description: 'audit description',
        label: 'mock audit label',
        docsUrl: 'http://www.my-docs.dev',
      }
    ],
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify({
          audits: [{
            slug: 'command-object-audit-slug',
            value: 0,
            score: 0
          }],
        })}' > ${outputPath}`,
      ],
      outputPath,
    },
    groups: [],
    meta: {
      slug: 'collect-command-object',
      name: 'collect command object',
    },
  } satisfies PluginConfig;
}
