import {dummyConfig, MEMFS_VOLUME, mockReport} from '@code-pushup/models/testing';
import {CollectOptions} from '@code-pushup/core';
import {yargsCli} from '../yargs-cli';
import {yargsGlobalOptionsDefinition} from '../implementation/global-options';
import {yargsUploadCommandObject} from './command-object';
import {beforeEach, vi} from "vitest";
import {vol} from "memfs";
import {join} from "path";
import {objectToCliArgs} from "@code-pushup/utils";

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});


const args = ['upload', '--verbose', '--configPath', join('packages', 'cli', 'src', 'lib', 'upload', 'config.mock.js')];
const cli = (args: string[]) => yargsCli(args, {
  options: yargsGlobalOptionsDefinition(),
  commands: [yargsUploadCommandObject()]
});

const outputPath = MEMFS_VOLUME;
type ENV = {API_KEY: string, SERVER: string};

const reportPath = (path = outputPath, format: 'json' | 'md' = 'json') =>
  join(MEMFS_VOLUME, 'report.' + format);

describe('upload-command-object', () => {
  /*beforeEach(async () => {
    vol.reset();
    vol.fromJSON({
        [reportPath()]: JSON.stringify(mockReport()),
      },
      MEMFS_VOLUME);
  });*/

  it('should parse arguments correctly', async () => {
    const env = process.env as ENV;
    const _arg = [...args, ...objectToCliArgs({
      apiKey: env.API_KEY,
      server: env.SERVER,
    })];

    const _cli = cli(_arg);
    const parsedArgv = (await _cli.argv) as unknown as CollectOptions;
    expect(parsedArgv.persist.outputPath).toBe(outputPath);
    /**/
  });
});
