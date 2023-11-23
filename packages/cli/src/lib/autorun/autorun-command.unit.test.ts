import { bundleRequire } from 'bundle-require';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PortalUploadArgs,
  ReportFragment,
  uploadToPortal,
} from '@code-pushup/portal-client';
import { collectAndPersistReports } from '@code-pushup/core';
import { report } from '@code-pushup/models/testing';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsAutorunCommandObject } from './autorun-command';

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

// Mock file system API's
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

vi.mock('@code-pushup/core', async () => {
  const core = await vi.importActual('@code-pushup/core');
  return {
    ...(core as object),
    collectAndPersistReports: vi.fn().mockResolvedValue({}),
  };
});

// Mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/testing-utils') =
    await vi.importActual('@code-pushup/testing-utils');
  return {
    bundleRequire: vi
      .fn()
      .mockResolvedValue({ mod: { default: CORE_CONFIG_MOCK } }),
  };
});

describe('autorun-command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vol.reset();
    vol.fromJSON(
      {
        'my-report.json': JSON.stringify(report()),
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
  });

  it('should call collect and upload with correct parameters', async () => {
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
