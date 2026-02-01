import type { UploadConfig } from '@code-pushup/models';
import { normalizedExecutorContext } from '../../../mock/utils/executor.js';
import * as config from '../internal/config.js';
import { parseCliExecutorOptions } from './utils.js';

describe('parseCliExecutorOptions', () => {
  const persistConfigSpy = vi.spyOn(config, 'persistConfig');
  const uploadConfigSpy = vi.spyOn(config, 'uploadConfig');
  const globalConfigSpy = vi.spyOn(config, 'globalConfig');
  const normalizedContext = normalizedExecutorContext('portal');

  afterEach(() => {
    persistConfigSpy.mockReset();
    uploadConfigSpy.mockReset();
    globalConfigSpy.mockReset();
  });

  it('should call child config functions with options', () => {
    parseCliExecutorOptions(
      {
        verbose: true,
        persist: { filename: 'my-name' },
        upload: {
          server: 'https://new-portal.code-pushup.dev',
        } as UploadConfig,
      },
      normalizedContext,
    );
    expect(persistConfigSpy).toHaveBeenCalledWith(
      { filename: 'my-name' },
      normalizedContext,
    );
    expect(uploadConfigSpy).toHaveBeenCalledWith(
      {
        server: 'https://new-portal.code-pushup.dev',
      },
      normalizedContext,
    );
    expect(globalConfigSpy).toHaveBeenCalledWith(
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
