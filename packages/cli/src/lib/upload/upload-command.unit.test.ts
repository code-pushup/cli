import { vol } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import {
  PortalUploadArgs,
  ReportFragment,
  uploadToPortal,
} from '@code-pushup/portal-client';
import { readCodePushupConfig } from '@code-pushup/core';
import {
  ISO_STRING_REGEXP,
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/testing-utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsUploadCommandObject } from './upload-command';

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

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/testing-utils') =
    await vi.importActual('@code-pushup/testing-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readCodePushupConfig: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('upload-command-object', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'my-report.json': JSON.stringify(MINIMAL_REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );
  });

  it('should call portal-client function with correct parameters', async () => {
    await yargsCli(
      [
        'upload',
        '--verbose',
        '--config=/test/code-pushup.config.ts',
        '--persist.filename=my-report',
        '--persist.outputDir=/test',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsUploadCommandObject()],
      },
    ).parseAsync();

    expect(readCodePushupConfig).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
    );

    // values come from CORE_CONFIG_MOCK returned by readCodePushupConfig mock
    expect(uploadToPortal).toHaveBeenCalledWith({
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
      data: {
        commandStartDate: expect.stringMatching(ISO_STRING_REGEXP),
        commandDuration: expect.any(Number),
        categories: expect.any(Array),
        plugins: expect.any(Array),
        packageName: '@code-pushup/core',
        packageVersion: expect.any(String),
        organization: 'code-pushup',
        project: 'cli',
        commit: expect.any(String),
      },
    } satisfies PortalUploadArgs);
  });
});
