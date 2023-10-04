import {dummyConfig, MEMFS_VOLUME, mockReport} from '@code-pushup/models/testing';
import {CollectOptions} from '@code-pushup/core';
import {yargsCli} from '../yargs-cli';
import {logErrorBeforeThrow} from '../implementation/utils';
import {yargsGlobalOptionsDefinition} from '../implementation/global-options';
import {yargsUploadCommandObject} from './command-object';
import {vi} from "vitest";
import {beforeEach} from "vitest";
import {vol} from "memfs";
import {join} from "path";

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const command = {
  ...yargsUploadCommandObject(),
  handler: logErrorBeforeThrow(yargsUploadCommandObject().handler),
};

const outputPath = MEMFS_VOLUME;

const reportPath = (path = outputPath, format: 'json' | 'md' = 'json') =>
  join(MEMFS_VOLUME, 'report.' + format);
const config = dummyConfig(outputPath);

describe('upload-command-object', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON({
        [reportPath()]: JSON.stringify(mockReport()),
      },
      MEMFS_VOLUME);
  });

  it('should parse arguments correctly', async () => {
    const args = ['upload', '--verbose', '--configPath', ''];
    const cli = yargsCli(args, { options: yargsGlobalOptionsDefinition() })
      .config(config)
      .command(command);
    const parsedArgv = (await cli.argv) as unknown as CollectOptions;
    expect(parsedArgv.persist.outputPath).toBe(outputPath);
  });
});
