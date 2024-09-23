import { describe, expect } from 'vitest';
import { ENV } from '../../../mock/fixtures/env';
import { uploadConfig } from './config';
import * as env from './env';

describe('uploadConfig', () => {
  const processEnvSpy = vi.spyOn(process, 'env', 'get').mockReturnValue({});
  const parseEnvSpy = vi.spyOn(env, 'parseEnv');

  it('should call parseEnv function with values from process.env', () => {
    processEnvSpy.mockReturnValue(ENV);
    expect(
      uploadConfig(
        {},
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      ),
    ).toBeDefined();

    expect(parseEnvSpy).toHaveBeenCalledTimes(1);
    expect(parseEnvSpy).toHaveBeenCalledWith(ENV);
  });
});
