import {dummyConfig} from '@code-pushup/models/testing';
import {CollectOptions} from '@code-pushup/core';
import {yargsCli} from '../yargs-cli';
import {logErrorBeforeThrow} from '../implementation/utils';
import {yargsGlobalOptionsDefinition} from '../implementation/global-options';
import {yargsCollectCommandObject} from './command-object';

const command = {
  ...yargsCollectCommandObject(),
  handler: logErrorBeforeThrow(yargsCollectCommandObject().handler),
};

const outputPath = 'tmp';

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

});
