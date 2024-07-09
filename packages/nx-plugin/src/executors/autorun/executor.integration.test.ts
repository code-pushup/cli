// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { normalize } from 'node:path';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { expect, vi } from 'vitest';
import type { UploadConfig } from '@code-pushup/models';
import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import { runAutorunExecutor } from './executor';
import { getExecutorOptions } from './utils';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');

  return {
    ...actual,
    // eslint-disable-next-line n/no-sync
    execSync: vi.fn(),
  };
});

vi.mock('../internal/config', async () => {
  const actual: any = await vi.importActual('../internal/config');

  return {
    ...actual,
    persistConfig: vi.fn(actual.persistConfig),
    uploadConfig: vi.fn(actual.uploadConfig),
    globalConfig: vi.fn(actual.globalConfig),
  };
});

const projectName = 'my-lib';
const context = {
  projectName,
  root: '.', // workspaceRoot
  projectsConfigurations: {
    projects: {
      [projectName]: {
        name: projectName,
        root: `libs/${projectName}`,
      },
    },
  },
} as unknown as ExecutorContext;

describe('runAutorunExecutor', () => {
  it('should consider the context argument', async () => {
    const output = await runAutorunExecutor({}, context);
    expect(output.success).toBe(true);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(`libs/${projectName}`),
      {},
    );
  });

  it('should process dryRun option', async () => {
    const output = await runAutorunExecutor({ dryRun: true }, context);
    expect(output.success).toBe(true);
    expect(output.command).toMatch(`libs/${projectName}`);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledTimes(0);
  });

  it('should consider given options', async () => {
    const cfg = {
      persist: { filename: 'filename' },
      upload: {
        server: 'https://portal.code-pushup.dev',
        apiKey: 'afas57g8h9uj03iqwkeaclsd',
        timeout: 1000,
        project: 'utils',
        organization: 'code-pushup',
      },
    };
    const output = await runAutorunExecutor(cfg, context);
    expect(output.success).toBe(true);
    expect(output.command).toMatch(`afas57g8h9uj03iqwkeaclsd`);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('afas57g8h9uj03iqwkeaclsd'),
      {},
    );
  });
});

describe('getExecutorOptions', () => {
  const normalizedContext = {
    projectName: 'my-app',
    workspaceRoot: 'workspaceRoot',
    projectConfig: {
      name: 'my-app',
      root: 'root',
    },
  };
  it('should call other functions with options', async () => {
    const executorOptions = await getExecutorOptions(
      {
        verbose: true,
        persist: { filename: 'my-name' },
        upload: {
          server: 'https://new-portal.code-pushup.dev',
        } as UploadConfig,
      },
      normalizedContext,
    );
    expect(persistConfig).toHaveBeenCalledWith(
      { filename: 'my-name' },
      normalizedContext,
    );
    expect(uploadConfig).toHaveBeenCalledWith(
      {
        server: 'https://new-portal.code-pushup.dev',
      },
      normalizedContext,
    );
    expect(globalConfig).toHaveBeenCalledWith({
      verbose: true,
      persist: { filename: 'my-name' },
      upload: {
        server: 'https://new-portal.code-pushup.dev',
      } as UploadConfig,
    });

    expect(executorOptions).toStrictEqual({
      verbose: true,
      progress: false,
      persist: {
        filename: 'my-name-report',
        format: ['json'],
        outputDir: normalize('root/.code-pushup/my-app'),
      },
      upload: {
        server: 'https://new-portal.code-pushup.dev',
        apiKey:
          'cp_57ba713d0803d41b2ea48aacf3a11c227fe0c7d0276870ab4fe79f4cdefcdb3c',
        organization: 'code-pushup',
        project: 'cli',
      } as UploadConfig,
    });
  });
});
