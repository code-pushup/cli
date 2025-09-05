import { expect, vi } from 'vitest';
import type { UploadConfig } from '@code-pushup/models';
import { parseAutorunExecutorOptions } from '../../internal/options.js';
import * as config from '../internal/config.js';

describe('parseAutorunExecutorOptions', () => {
  const persistConfigSpy = vi.spyOn(config, 'persistConfig');
  const uploadConfigSpy = vi.spyOn(config, 'uploadConfig');
  const globalConfigSpy = vi.spyOn(config, 'globalConfig');

  afterEach(() => {
    persistConfigSpy.mockReset();
    uploadConfigSpy.mockReset();
    globalConfigSpy.mockReset();
  });

  it('should call child config functions with options', () => {
    parseAutorunExecutorOptions({
      verbose: true,
      persist: { filename: 'my-name' },
      upload: {
        server: 'https://new-portal.code-pushup.dev',
      } as UploadConfig,
    });

    expect(persistConfigSpy).toHaveBeenCalledWith({ filename: 'my-name' });
    expect(uploadConfigSpy).toHaveBeenCalledWith({
      server: 'https://new-portal.code-pushup.dev',
    });
    expect(globalConfigSpy).toHaveBeenCalledWith({
      verbose: true,
      persist: { filename: 'my-name' },
      upload: {
        server: 'https://new-portal.code-pushup.dev',
      } as UploadConfig,
    });
  });
});
