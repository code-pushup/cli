import { MEMFS_VOLUME, mockReport } from '@code-pushup/models/testing';
import { CollectOptions } from '@code-pushup/core';
import { yargsCli } from '../yargs-cli';
import { yargsGlobalOptionsDefinition } from '../implementation/global-options';
import { yargsUploadCommandObject } from './command-object';
import { vi } from 'vitest';
import { join } from 'path';
import { objectToCliArgs } from '@code-pushup/utils';
import { middlewares } from '../middlewares';
import { vol } from 'memfs';
import { cfg } from './config.mock';

vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');
  return {
    ...module,
    uploadToPortal: vi.fn(() => {
      return 'portal-result-mock';
    }),
  };
});

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

type ENV = { API_KEY: string; SERVER: string };
const env = process.env as ENV;
const args = [
  'upload',
  '--verbose',
  ...objectToCliArgs({
    configPath: '/code-pushup.config.js',
    apiKey: env.API_KEY,
    server: env.SERVER,
  }),
];
const cli = (args: string[]) =>
  yargsCli(args, {
    options: yargsGlobalOptionsDefinition(),
    middlewares,
    commands: [yargsUploadCommandObject()],
  });

const outputPath = MEMFS_VOLUME;

const reportPath = (path = outputPath, format: 'json' | 'md' = 'json') =>
  join('report.' + format);

describe('upload-command-object', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON({
      [reportPath()]: JSON.stringify(mockReport()),
      ['code-pushup.config.js']: `export default = ${JSON.stringify(cfg)}`,
    });
  });

  it('should parse arguments correctly', async () => {
    const _arg = [
      ...args,
      ...objectToCliArgs({
        apiKey: 'env.API_KEY',
        server: 'env.SERVER',
      }),
    ];

    const _cli = cli(_arg);
    const parsedArgv = (await _cli.argv) as unknown as CollectOptions;
    expect(parsedArgv.persist.outputPath).toBe(outputPath);
  });
});
