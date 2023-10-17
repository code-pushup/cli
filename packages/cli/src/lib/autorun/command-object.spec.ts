import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  PortalUploadArgs,
  ReportFragment,
  uploadToPortal,
} from '@code-pushup/portal-client';
import {UploadOptions} from '@code-pushup/core';
import {objectToCliArgs} from '@code-pushup/utils';
import {middlewares} from '../middlewares';
import {options} from '../options';
import {yargsCli} from '../yargs-cli';
import {yargsAutorunCommandObject} from './command-object';

// This in needed to mock the API client used inside the upload function
vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async () => ({packageName: '@code-pushup/cli'} as ReportFragment),
    ),
  };
});

const baseArgs = [
  'autorun',
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'config.mock.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(args, {
    options,
    middlewares,
    commands: [yargsAutorunCommandObject()],
  });

describe('autorun-command-object', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should override config with CLI arguments', async () => {
    const args = [
      ...baseArgs,
      ...objectToCliArgs({
        'persist.format': 'md',
        'upload.apiKey': 'some-other-api-key',
        'upload.server': 'https://other-example.com/api',
      }),
    ];
    const parsedArgv = (await cli(
      args,
    ).parseAsync()) as Required<UploadOptions>;
    expect(parsedArgv.upload.organization).toBe('code-pushup');
    expect(parsedArgv.upload.project).toBe('cli');
    expect(parsedArgv.upload.apiKey).toBe('some-other-api-key');
    expect(parsedArgv.upload.server).toBe('https://other-example.com/api');
    expect(parsedArgv.persist.outputDir).toBe('tmp');
    expect(parsedArgv.persist.format).toEqual(['md']);
  });

  it('should call portal-client function with correct parameters', async () => {
    await cli(baseArgs).parseAsync();
    expect(uploadToPortal).toHaveBeenCalledWith({
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
      data: {
        commandStartDate: expect.any(String),
        commandDuration: expect.any(Number),
        categories: [],
        plugins: expect.any(Array),
        packageName: '@code-pushup/core',
        packageVersion: '0.0.1',
        project: 'cli',
        organization: 'code-pushup',
        commit: expect.any(String),
      },
    } satisfies PortalUploadArgs);
  });
});
