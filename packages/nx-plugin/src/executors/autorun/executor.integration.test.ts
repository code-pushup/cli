// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { expect, vi } from 'vitest';
import type { UploadConfig } from '@code-pushup/models';
import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import { runAutorunExecutor } from './executor';
import { parseAutorunExecutorOptions } from './utils';

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
        root: expect.stringContaining(projectName),
      },
    },
  },
} as unknown as ExecutorContext;

describe('runAutorunExecutor', () => {
  it('should consider the context argument', () => {
    const output = runAutorunExecutor({}, context);
    expect(output.success).toBe(true);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(`libs/${projectName}`),
      {},
    );
  });

  it('should process dryRun option', () => {
    const output = runAutorunExecutor({ dryRun: true }, context);
    expect(output.success).toBe(true);
    expect(output.command).toMatch(`libs/${projectName}`);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledTimes(0);
  });

  it('should consider given options', () => {
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
    const output = runAutorunExecutor(cfg, context);
    expect(output.success).toBe(true);
    expect(output.command).toMatch(`afas57g8h9uj03iqwkeaclsd`);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('afas57g8h9uj03iqwkeaclsd'),
      {},
    );
  });
});

describe('parseAutorunExecutorOptions', () => {
  const normalizedContext = {
    projectName: 'my-app',
    workspaceRoot: 'workspaceRoot',
    projectConfig: {
      name: 'my-app',
      root: 'root',
    },
  };
  it('should call child config functions with options', () => {
    parseAutorunExecutorOptions(
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
    expect(globalConfig).toHaveBeenCalledWith(
      {
        verbose: true,
        persist: { filename: 'my-name' },
        upload: {
          server: 'https://new-portal.code-pushup.dev',
        } as UploadConfig,
      },
      normalizedContext,
    );
  });
});
