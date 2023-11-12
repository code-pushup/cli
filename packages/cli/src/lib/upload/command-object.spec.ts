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
import { setupFolder } from '../../../test';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
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
const dummyReport = report();

// @TODO move into test library
const baseArgs = [
  'upload',
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'minimal.config.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(args, {
    ...DEFAULT_CLI_CONFIGURATION,
    commands: [yargsUploadCommandObject()],
  });

describe('upload-command-object', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should override config with CLI arguments', async () => {
    setupFolder('tmp', {
      ['report.json']: JSON.stringify(dummyReport),
    });
    const args = [
      ...baseArgs,
      ...objectToCliArgs<CliArgsObject>({
        //   'upload.organization': 'some-other-organization', @TODO
        //   'upload.project': 'some-other-project', @TODO
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
    const reportFileName = 'my-report';
    setupFolder('tmp', {
      [reportFileName + '.json']: JSON.stringify(dummyReport),
    });
    const args = [
      ...baseArgs,
      ...objectToCliArgs<CliArgsObject>({
        'persist.filename': reportFileName,
      }),
    ];
    await cli(args).parseAsync();
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
