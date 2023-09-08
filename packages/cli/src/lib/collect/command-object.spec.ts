import yargs from 'yargs';
import { yargsCollectCommandObject } from './command-object';
import { CoreConfig, PluginConfig, Report } from '@quality-metrics/models';
import { CollectOptions, CollectOutputError } from '@quality-metrics/utils';
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

const outputPath = 'command-config-out.json';
const dummyConfig: CoreConfig = {
  persist: { outputPath },
  plugins: [mockPlugin()],
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
      .command(yargsCollectCommandObject())
      .parseAsync(args);

    const result = JSON.parse(readFileSync(outputPath).toString());
    expect(result).toBe('1ms');
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
    expect(error.message).toEqual(
      new CollectOutputError('collect-command-object').message,
    );
  });
});

function mockPlugin(
  opt: { outputPath: string; auditOutput?: Report } = { outputPath },
): PluginConfig {
  const auditOutput: Report =
    opt.auditOutput ||
    ({
      version: '0.0.0',
      date: new Date().toISOString(),
      duration: 3,
      audits: [
        {
          slug: 'collect-command-object-audit1',
          value: 0,
        },
      ],
    } satisfies Report);

  return {
    audits: [
      {
        slug: 'collect-command-object-audit1',
        description: 'w',
        docsUrl: 'w',
        label: 'w',
        title: 'w',
      },
    ],
    runner: {
      command: 'bash',
      args: ['-c', `echo '${JSON.stringify(auditOutput)}' > ${outputPath}`],
      outputPath: outputPath,
    },
    groups: [],
    meta: {
      slug: 'collect-command-object',
      name: 'collect command object',
    },
  } satisfies PluginConfig;
}
