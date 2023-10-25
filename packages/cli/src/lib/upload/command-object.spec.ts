import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PortalUploadArgs,
  ReportFragment,
  uploadToPortal,
} from '@code-pushup/portal-client';
import { UploadOptions } from '@code-pushup/core';
import { report } from '@code-pushup/models/testing';
import { CliArgsObject, objectToCliArgs } from '@code-pushup/utils';
import { cleanFolderPutGitKeep } from '../../../test';
import { middlewares } from '../middlewares';
import { options } from '../options';
import { yargsCli } from '../yargs-cli';
import { yargsUploadCommandObject } from './command-object';

// This in needed to mock the API client used inside the upload function
vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async () => ({ packageName: '@code-pushup/cli' } as ReportFragment),
    ),
  };
});

const baseArgs = [
  'upload',
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      '..',
      'models',
      'test',
      'fixtures',
      'code-pushup.config.mock.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(args, {
    options,
    middlewares,
    commands: [yargsUploadCommandObject()],
  });

const reportFile = (format: 'json' | 'md' = 'json') => 'report.' + format;
const dummyReport = report();

describe('upload-command-object', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    cleanFolderPutGitKeep('tmp', {
      [reportFile()]: JSON.stringify(dummyReport),
    });
  });
  afterEach(async () => {
    cleanFolderPutGitKeep('tmp');
  });

  it('should override config with CLI arguments', async () => {
    const args = [
      ...baseArgs,
      ...objectToCliArgs<CliArgsObject>({
        //   'upload.organization': 'some-other-organization',
        //   'upload.project': 'some-other-project',
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
  });

  it('should call portal-client function with correct parameters', async () => {
    await cli(baseArgs).parseAsync();
    expect(uploadToPortal).toHaveBeenCalledWith({
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
      data: {
        commandStartDate: expect.any(String),
        commandDuration: expect.any(Number),
        categories: expect.any(Array),
        plugins: expect.any(Array),
        packageName: dummyReport.packageName,
        packageVersion: dummyReport.version,
        organization: 'code-pushup',
        project: 'cli',
        commit: expect.any(String),
      },
    } satisfies PortalUploadArgs);
  });
});
