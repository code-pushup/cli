// eslint-disable-next-line n/no-sync
import { expect, vi } from 'vitest';
import type { UploadConfig } from '@code-pushup/models';
import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import { parseAutorunExecutorOptions } from './utils';

vi.mock('../internal/config', async () => {
  const actual: any = await vi.importActual('../internal/config');

  return {
    ...actual,
    persistConfig: vi.fn(actual.persistConfig),
    uploadConfig: vi.fn(actual.uploadConfig),
    globalConfig: vi.fn(actual.globalConfig),
  };
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
