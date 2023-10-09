import {dummyConfig, MEMFS_VOLUME, mockReport} from '@code-pushup/models/testing';
import {CollectOptions} from '@code-pushup/core';
import {yargsCli} from '../yargs-cli';
import {logErrorBeforeThrow} from '../implementation/utils';
import {yargsGlobalOptionsDefinition} from '../implementation/global-options';
import {yargsCollectCommandObject} from './command-object';
import {middlewares} from "../middlewares";
import {yargsUploadCommandObject} from "../upload/command-object";
import {vi} from "vitest";
import {objectToCliArgs} from "@code-pushup/utils";
import {vol} from "memfs";
import {cfg} from "../upload/config.mock";

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});


type ENV = {API_KEY: string, SERVER: string};
const env = process.env as ENV;
const args = ['upload', '--verbose', ...objectToCliArgs({
  configPath: MEMFS_VOLUME+'/code-pushup.config.js',
  apiKey: env.API_KEY,
  server: env.SERVER,
})];
const cli = (args: string[]) => yargsCli(args, {
  options: yargsGlobalOptionsDefinition(),
  middlewares,
  commands: [yargsUploadCommandObject()]
});

describe('collect-command-object', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON({
        ['code-pushup.config.js']: `export default = ${JSON.stringify(cfg)}`,
      },
      MEMFS_VOLUME);
  });
  it('should parse arguments correctly', async () => {
    const _cli = cli(args)
    const parsedArgv = (await _cli.argv) as unknown as CollectOptions;
    const { persist } = parsedArgv;
    const { outputPath: outPath } = persist;
    expect(outPath).toBe(MEMFS_VOLUME+'/code-pushup.config.js');
  });

});
