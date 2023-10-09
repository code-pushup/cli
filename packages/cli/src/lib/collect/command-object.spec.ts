import {MEMFS_VOLUME} from '@code-pushup/models/testing';
import {CollectOptions} from '@code-pushup/core';
import {yargsCli} from '../yargs-cli';
import {middlewares} from "../middlewares";
import {options} from "../options";
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

const cli = (args: Record<string, string>) => yargsCli(['upload', ...objectToCliArgs({
  verbose: true,
  apiKey: env.API_KEY,
  server: env.SERVER,
  ...args
})], {
  options,
  middlewares,
  commands: [yargsUploadCommandObject()]
});

describe('collect-command-object', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON({
        ['code-pushup.config.js']: `export default = ${JSON.stringify(cfg)}`,
      });
  });

  it('should parse arguments correctly', async () => {
    const _cli = cli({  configPath: MEMFS_VOLUME+'/code-pushup.config.js' });
    const parsedArgv = (await _cli.argv) as unknown as CollectOptions;
    const { persist } = parsedArgv;
    const { outputPath: outPath } = persist;
    expect(outPath).toBe(MEMFS_VOLUME+'/code-pushup.config.js');
  });

});
