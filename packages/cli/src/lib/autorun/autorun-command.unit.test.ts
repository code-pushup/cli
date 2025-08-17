import { vol } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import { uploadReportToPortal } from '@code-pushup/portal-client';
import { collectAndPersistReports, readRcByPath } from '@code-pushup/core';
import { MEMFS_VOLUME, MINIMAL_REPORT_MOCK } from '@code-pushup/test-utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsAutorunCommandObject } from './autorun-command.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    collectAndPersistReports: vi.fn().mockResolvedValue({}),
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('autorun-command', () => {
  it('should call collect and upload with correct parameters', async () => {
    vol.fromJSON(
      {
        'my-report.json': JSON.stringify(MINIMAL_REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );

    await yargsCli(
      [
        'autorun',
        '--verbose',
        '--config=/test/code-pushup.config.ts',
        '--persist.filename=my-report',
        '--persist.outputDir=/test',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsAutorunCommandObject()],
      },
    ).parseAsync();

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    expect(collectAndPersistReports).toHaveBeenCalledWith(
      expect.objectContaining({
        verbose: true,
        config: '/test/code-pushup.config.ts',
        persist: expect.objectContaining({
          filename: 'my-report',
          outputDir: '/test',
        }),
      }),
    );

    // values come from CORE_CONFIG_MOCK returned by readRcByPath mock
    expect(uploadReportToPortal).toHaveBeenCalledWith<
      Parameters<typeof uploadReportToPortal>
    >({
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
      data: {
        commandStartDate: expect.any(String),
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
