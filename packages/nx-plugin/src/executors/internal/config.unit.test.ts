import { afterEach, beforeEach, describe, expect } from 'vitest';
import { ENV } from '../../../mock/fixtures/env';
import { globalConfig, persistConfig, uploadConfig } from './config';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('should parse empty env vars', async () => {
    await expect(parseEnv({})).resolves.toEqual({});
  });

  it('should parse process.env.CP_SERVER option', async () => {
    await expect(
      parseEnv({ CP_SERVER: 'https://portal.code.pushup.dev' }),
    ).resolves.toEqual(
      expect.objectContaining({ server: 'https://portal.code.pushup.dev' }),
    );
  });

  it('should parse process.env.CP_ORGANIZATION option', async () => {
    await expect(parseEnv({ CP_ORGANIZATION: 'code-pushup' })).resolves.toEqual(
      expect.objectContaining({ organization: 'code-pushup' }),
    );
  });

  it('should parse process.env.CP_PROJECT option', async () => {
    await expect(parseEnv({ CP_PROJECT: 'cli-utils' })).resolves.toEqual(
      expect.objectContaining({ project: 'cli-utils' }),
    );
  });

  it('should parse process.env.CP_TIMEOUT option', async () => {
    await expect(parseEnv({ CP_TIMEOUT: 3 })).resolves.toEqual(
      expect.objectContaining({ timeout: 3 }),
    );
  });
});

describe('globalConfig', () => {
  it('should parse all global options', () => {
    expect(globalConfig({ progress: true, verbose: true })).toEqual({
      progress: true,
      verbose: true,
    });
  });

  it('should parse partial global options', () => {
    expect(globalConfig({ progress: true })).toEqual({
      progress: true,
      verbose: false,
    });
  });

  it('should parse global empty options to default values', () => {
    expect(globalConfig({})).toEqual({
      progress: false,
      verbose: false,
    });
  });

  it('should exclude other options', () => {
    expect(globalConfig({ test: 42 } as {})).toEqual({
      progress: false,
      verbose: false,
    });
  });
});

describe('persistConfig', () => {
  it('should parse empty format options to "json"', async () => {
    await expect(
      persistConfig(
        {},
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ format: ['json'] }));
  });

  it('should parse empty outputDir options to project root', async () => {
    await expect(
      persistConfig(
        {},
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
        outputDir: '/test/root/workspaceRoot/.code-pushup/my-app',
      }),
    );
  });

  it('should parse empty filename options to project name + report name', async () => {
    await expect(
      persistConfig(
        {},
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({ filename: 'my-app-report.json' }),
    );
  });

  it('should parse given persist options', async () => {
    await expect(
      persistConfig(
        {
          format: ['md'],
          outputDir: 'outputDir',
          filename: 'filename',
        },
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'name',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual({
      format: ['md'],
      outputDir: 'outputDir',
      filename: 'filename',
    });
  });
});

describe('uploadConfig', () => {
  const oldEnv = process.env;
  beforeEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = {};
  });

  afterEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = oldEnv;
  });

  it('should parse empty project options to project-name', async () => {
    await expect(
      uploadConfig(
        {
          server: 'https://new1-portal.code.pushup.dev',
          apiKey: 'apiKey',
          organization: 'organization',
        },
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'my-app',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ project: 'my-app' }));
  });

  it('should parse process.env option', async () => {
    // eslint-disable-next-line functional/immutable-data
    process.env = ENV;

    await expect(
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
    ).resolves.toEqual(expect.objectContaining({ server: ENV.CP_SERVER }));
  });
});