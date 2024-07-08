import { describe, expect } from 'vitest';
import { ENV } from '../../../mock/fixtures/env';
import { uploadConfig } from './config';
import { parseEnv } from './env';

vi.mock('./env', async () => {
  const actual = await vi.importActual('./env');
  return {
    ...actual,
    parseEnv: vi.fn(actual.parseEnv as typeof parseEnv),
  };
});

describe('uploadConfig', () => {
  it('should call parseEnv function with values from process.env', async () => {
    const old = process.env;

    // eslint-disable-next-line functional/immutable-data
    process.env = ENV;

    await expect(
      uploadConfig(
        {
          server: 'https://portal.code.pushup.dev',
        },
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        server: ENV.CP_SERVER,
        apiKey: ENV.CP_API_KEY,
        organization: ENV.CP_ORGANIZATION,
        project: ENV.CP_PROJECT,
      }),
    );

    expect(parseEnv).toHaveBeenCalledTimes(1);
    expect(parseEnv).toHaveBeenCalledWith(ENV);

    // eslint-disable-next-line functional/immutable-data
    process.env = old;
  });
});
