import { describe, expect, vi } from 'vitest';
import { autoloadRc, readRcByPath } from '@code-pushup/core';
import { coreConfigMiddleware } from './core-config.middleware';
import { CoreConfigCliOptions } from './core-config.model';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';
import { SkipPluginsOptions } from './skip-plugins.model';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('coreConfigMiddleware', () => {
  it('should attempt to load code-pushup.config.(ts|mjs|js) by default', async () => {
    await coreConfigMiddleware(
      {} as GeneralCliOptions &
        CoreConfigCliOptions &
        OnlyPluginsOptions &
        SkipPluginsOptions,
    );
    expect(autoloadRc).toHaveBeenCalled();
  });

  it('should directly attempt to load passed config', async () => {
    await coreConfigMiddleware({
      config: 'cli/custom-config.mjs',
    } as GeneralCliOptions & CoreConfigCliOptions & OnlyPluginsOptions & SkipPluginsOptions);
    expect(autoloadRc).not.toHaveBeenCalled();
    expect(readRcByPath).toHaveBeenCalledWith(
      'cli/custom-config.mjs',
      undefined,
    );
  });

  it('should forward --tsconfig option to config autoload', async () => {
    await coreConfigMiddleware({
      tsconfig: 'tsconfig.base.json',
    } as GeneralCliOptions & CoreConfigCliOptions & OnlyPluginsOptions & SkipPluginsOptions);
    expect(autoloadRc).toHaveBeenCalledWith('tsconfig.base.json');
  });

  it('should forward --tsconfig option to custom config load', async () => {
    await coreConfigMiddleware({
      config: 'apps/website/code-pushup.config.ts',
      tsconfig: 'apps/website/tsconfig.json',
    } as GeneralCliOptions & CoreConfigCliOptions & OnlyPluginsOptions & SkipPluginsOptions);
    expect(readRcByPath).toHaveBeenCalledWith(
      'apps/website/code-pushup.config.ts',
      'apps/website/tsconfig.json',
    );
  });
});
