import { describe, expect, vi } from 'vitest';
import { ConfigPathError } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { CORE_CONFIG_MOCK } from '@code-pushup/testing-utils';
import { coreConfigMiddleware } from './core-config.middleware';

vi.mock('@code-pushup/core', async () => {
  const core: typeof import('@code-pushup/core') = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockImplementation((filepath: string): CoreConfig => {
      const extension = filepath.split('.');
      if (filepath.includes('throw-error')) {
        throw new ConfigPathError(filepath);
      }
      return {
        ...CORE_CONFIG_MOCK,
        upload: {
          ...CORE_CONFIG_MOCK.upload,
          project: `cli-${extension}`,
        },
      };
    }),
    autoloadRc: vi.fn().mockImplementation(
      (): CoreConfig => ({
        ...CORE_CONFIG_MOCK,
        upload: {
          ...CORE_CONFIG_MOCK.upload,
          project: `cli-autoload`,
        },
      }),
    ),
  };
});

describe('coreConfigMiddleware', () => {
  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    const config = await coreConfigMiddleware({});
    expect(config?.upload?.project).toBe('cli-autoload');
  });

  it.each(['ts', 'mjs', 'js'])(
    'should load a valid .%s config',
    async extension => {
      const config = await coreConfigMiddleware({
        config: `code-pushup.config.${extension}`,
      });
      expect(config.config).toContain(`code-pushup.config.${extension}`);
      expect(config.upload?.project).toContain(extension);
    },
  );

  it('should throw with invalid config path', async () => {
    await expect(
      coreConfigMiddleware({ config: 'throw-error' }),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });
});
