import { CoreConfig, Report } from '@quality-metrics/models';
import { CollectOptions } from '@quality-metrics/utils';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yargsCli } from '../cli';
import { getDirname, logErrorBeforeThrow } from '../implementation/utils';
import { middlewares } from '../middlewares';
import { yargsGlobalOptionsDefinition } from '../options';
import { yargsCollectCommandObject } from './command-object';
import { mockPluginConfig } from '@quality-metrics/models/testing';

const command = {
  ...yargsCollectCommandObject(),
  handler: logErrorBeforeThrow(yargsCollectCommandObject().handler),
};

const outputPath = 'collect-command-object.json';
const dummyConfig: CoreConfig = {
  persist: { outputPath },
  plugins: [mockPluginConfig()],
  categories: [],
};

describe('collect-command-object', () => {
  it('should parse arguments correctly', async () => {
    const args = ['collect', '--verbose', '--configPath', ''];
    const cli = yargsCli(args, { options: yargsGlobalOptionsDefinition() })
      .config(dummyConfig)
      .command(command);
    const parsedArgv = (await cli.argv) as unknown as CollectOptions;
    const { persist } = parsedArgv;
    const { outputPath: outPath } = persist;
    expect(outPath).toBe(outputPath);
    return Promise.resolve(void 0);
  });

  it('should execute middleware correctly', async () => {
    const args = [
      'collect',
      '--configPath',
      join(
        getDirname(import.meta.url),
        '..',
        'implementation',
        'mock',
        'config-middleware-config.mock.mjs',
      ),
    ];
    await yargsCli([], { middlewares })
      .config(dummyConfig)
      .command(command)
      .parseAsync(args);
    const report = JSON.parse(readFileSync(outputPath).toString()) as Report;
    expect(report.plugins[0]?.meta.slug).toBe('collect-command-object');
    expect(report.plugins[0]?.audits[0]?.slug).toBe(
      'command-object-audit-slug',
    );
  });
});
