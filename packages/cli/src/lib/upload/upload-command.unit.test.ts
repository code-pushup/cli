import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { uploadReportToPortal } from '@code-pushup/portal-client';
import { readRcByPath } from '@code-pushup/core';
import {
  ISO_STRING_REGEXP,
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/test-utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsUploadCommandObject } from './upload-command.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
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

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    // values come from CORE_CONFIG_MOCK returned by readRcByPath mock
    expect(uploadReportToPortal).toHaveBeenCalledWith<
      Parameters<typeof uploadReportToPortal>
    >({
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
    });
  });
});
