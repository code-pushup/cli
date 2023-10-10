import { Report } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import {
  PortalUploadArgs,
  ReportFragment,
  uploadToPortal,
} from '@code-pushup/portal-client';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { vi, describe, it, beforeEach } from 'vitest';
import { yargsGlobalOptionsDefinition } from '../implementation/global-options';
import { middlewares } from '../middlewares';
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
  '--verbose',
  ...objectToCliArgs({
    configPath: join(
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
    options: yargsGlobalOptionsDefinition(),
    middlewares,
    commands: [yargsUploadCommandObject()],
  });

const reportPath = (format: 'json' | 'md' = 'json') =>
  join('tmp', 'report.' + format);

describe('upload-command-object', () => {
  const dummyReport: Report = {
    date: new Date().toISOString(),
    duration: 1000,
    categories: [],
    plugins: [],
    packageName: '@code-pushup/cli',
    version: '0.1.0',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await writeFile(reportPath(), JSON.stringify(dummyReport));
  });

  it('should override config with CLI arguments', async () => {
    const args = [
      ...baseArgs,
      ...objectToCliArgs({
        apiKey: 'some-other-api-key',
        server: 'https://other-example.com/api',
      }),
    ];
    const parsedArgv = await cli(args).parseAsync();
    expect(parsedArgv.upload?.organization).toBe('code-pushup');
    expect(parsedArgv.upload?.project).toBe('cli');
    expect(parsedArgv.upload?.apiKey).toBe('some-other-api-key');
    expect(parsedArgv.upload?.server).toBe('https://other-example.com/api');
  });

  it('should call portal-client function with correct parameters', async () => {
    await cli(baseArgs).parseAsync();
    expect(uploadToPortal).toHaveBeenCalledWith({
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
      data: {
        commandStartDate: dummyReport.date,
        commandDuration: 1000,
        categories: [],
        plugins: [],
        packageName: '@code-pushup/cli',
        packageVersion: '0.1.0',
        organization: 'code-pushup',
        project: 'cli',
        commit: expect.any(String),
      },
    } satisfies PortalUploadArgs);
  });
});
