import { bundleRequire } from 'bundle-require';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PortalUploadArgs, uploadToPortal } from '@code-pushup/portal-client';
import { collectAndPersistReports } from '@code-pushup/core';
import { MINIMAL_REPORT_MOCK } from '@code-pushup/testing-utils';
import { objectToCliArgs } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsAutorunCommandObject } from './autorun-command';

vi.mock('@code-pushup/core', async () => {
  const core = await vi.importActual('@code-pushup/core');
  return {
    ...(core as object),
    collectAndPersistReports: vi.fn().mockResolvedValue({}),
  };
});

const cli = (options = {}) =>
  yargsCli(
    objectToCliArgs({
      _: 'autorun',
      verbose: true,
      config: '/test/code-pushup.config.ts',
      'persist.outputDir': '/test',
      ...options,
    }),
    {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsAutorunCommandObject()],
    },
  );

describe('autorun-command', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'my-report.json': JSON.stringify(MINIMAL_REPORT_MOCK),
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
  });

  it('should call collect and upload with correct parameters', async () => {
    await cli().parseAsync();

    expect(bundleRequire).toHaveBeenCalledWith({
      format: 'esm',
      filepath: '/test/code-pushup.config.ts',
    });

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

    expect(uploadToPortal).toHaveBeenCalledWith({
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
    } satisfies PortalUploadArgs);
  });

});
