import { MockInstance, describe, expect } from 'vitest';
import { ENV } from '../../../mock/fixtures/env';
import { uploadConfig } from './config';
import * as env from './env';

describe('uploadConfig', () => {
  let parseEnvSpy: MockInstance<[], NodeJS.ProcessEnv>;
  let processEnvSpy: MockInstance<[], NodeJS.ProcessEnv>;

  beforeAll(() => {
    processEnvSpy = vi.spyOn(process, 'env', 'get').mockReturnValue({});
    parseEnvSpy = vi.spyOn(env, 'parseEnv');
  });

  afterAll(() => {
    processEnvSpy.mockRestore();
    parseEnvSpy.mockRestore();
  });

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
    ).toEqual(
      expect.objectContaining({
        server: ENV.CP_SERVER,
        apiKey: ENV.CP_API_KEY,
        organization: ENV.CP_ORGANIZATION,
        project: ENV.CP_PROJECT,
      }),
    );

    expect(parseEnvSpy).toHaveBeenCalledTimes(1);
    expect(parseEnvSpy).toHaveBeenCalledWith(ENV);
  });
});
