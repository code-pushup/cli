import { Report } from '@quality-metrics/models';
import { dummyConfig } from '@quality-metrics/models/testing';
import { CollectOptions } from '@quality-metrics/utils';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yargsCli } from '../cli';
import { logErrorBeforeThrow } from '../implementation/utils';
import { middlewares } from '../middlewares';
import { yargsGlobalOptionsDefinition } from '../options';
import { yargsCollectCommandObject } from './command-object';
import { getDirname } from '../implementation/helper.mock';

const command = {
  ...yargsCollectCommandObject(),
  handler: logErrorBeforeThrow(yargsCollectCommandObject().handler),
};

const outputPath = 'tmp';
const reportPath = (format: 'json' | 'md' = 'json') =>
  join(outputPath, 'report.' + format);

const config = dummyConfig();

describe('collect-command-object', () => {
  it('should parse arguments correctly', async () => {
    const args = ['collect', '--verbose', '--configPath', ''];
    const cli = yargsCli(args, { options: yargsGlobalOptionsDefinition() })
      .config(config)
      .command(command);
    const parsedArgv = (await cli.argv) as unknown as CollectOptions;
    const { persist } = parsedArgv;
    const { outputPath: outPath } = persist;
    expect(outPath).toBe(outputPath);
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
      .config(config)
      .command(command)
      .parseAsync(args);
    const report = JSON.parse(readFileSync(reportPath()).toString()) as Report;
    expect(report.plugins[0]?.slug).toBe('plg-0');
    expect(report.plugins[0]?.audits[0]?.slug).toBe('0a');
  });
});
