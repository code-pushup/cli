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
  it('should provide default global verbose options', () => {
    expect(globalConfig({})).toEqual(
      expect.objectContaining({ verbose: false }),
    );
  });

  it('should parse global verbose options', () => {
    expect(globalConfig({ verbose: true })).toEqual(
      expect.objectContaining({ verbose: true }),
    );
  });

  it('should provide default global progress options', () => {
    expect(globalConfig({})).toEqual(
      expect.objectContaining({ progress: false }),
    );
  });

  it('should parse global progress options', () => {
    expect(globalConfig({ progress: true })).toEqual(
      expect.objectContaining({ progress: true }),
    );
  });

  it('should exclude other options', () => {
    expect(
      globalConfig({ test: 42 } as unknown as { verbose: boolean }),
    ).toEqual({
      progress: false,
      verbose: false,
    });
  });
});

describe('persistConfig', () => {
  it('should provide default persist format options of ["json"]', () => {
    expect(
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
    ).toEqual(expect.objectContaining({ format: ['json'] }));
  });

  it('should parse given persist format option', () => {
    expect(
      persistConfig(
        {
          format: ['md'],
        },
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: 'name',
            root: 'root',
          },
        },
      ),
    ).toEqual(
      expect.objectContaining({
        format: ['md'],
      }),
    );
  });

  it('should provide default outputDir options', () => {
    const projectName = 'my-app';
    expect(
      persistConfig(
        {},
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: projectName,
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(
      expect.objectContaining({
        outputDir: `packages/project-root/.code-pushup/${projectName}`,
      }),
    );
  });

  it('should parse given outputDir options', () => {
    const outputDir = '../dist/packages/test-folder';
    expect(
      persistConfig(
        {
          outputDir,
        },
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
        outputDir,
      }),
    );
  });

  it('should provide default filename options', () => {
    const projectName = 'my-app';
    expect(
      persistConfig(
        {},
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: projectName,
            root: 'root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ filename: `${projectName}-report` }));
  });

  it('should provide default persist filename as [project-name]-report', () => {
    const projectName = 'my-app';
    expect(
      persistConfig(
        {},
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: projectName,
            root: 'root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ filename: `${projectName}-report` }));
  });
});

describe('uploadConfig', () => {
  const baseUploadConfig = {
    server: 'https://base-portal.code.pushup.dev',
    apiKey: 'apiKey',
    organization: 'organization',
  };
  const oldEnv = process.env;
  beforeEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = {};
  });

  afterEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = oldEnv;
  });

  it('should provide default upload project options as project name', async () => {
    const projectName = 'my-app';
    await expect(
      uploadConfig(baseUploadConfig, {
        workspaceRoot: 'workspace-root',
        projectConfig: {
          name: projectName,
          root: 'root',
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ project: projectName }));
  });

  it('should parse upload project options', async () => {
    const projectName = 'utils';
    await expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          project: 'cli-utils',
        },
        {
          workspaceRoot: 'workspace-root',
          projectConfig: {
            name: projectName,
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ project: 'cli-utils' }));
  });

  it('should parse upload server options', async () => {
    await expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          server: 'https://new1-portal.code.pushup.dev',
        },
        {
          workspaceRoot: 'workspace-root',
          projectConfig: {
            name: 'utils',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        server: 'https://new1-portal.code.pushup.dev',
      }),
    );
  });

  it('should parse upload organization options', async () => {
    await expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          organization: 'code-pushup-v2',
        },
        {
          workspaceRoot: 'workspace-root',
          projectConfig: {
            name: 'utils',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({ organization: 'code-pushup-v2' }),
    );
  });

  it('should parse upload apiKey options', async () => {
    await expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          apiKey: '123456789',
        },
        {
          workspaceRoot: 'workspace-root',
          projectConfig: {
            name: 'utils',
            root: 'root',
          },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ apiKey: '123456789' }));
  });

  it('should parse process.env options', async () => {
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
    ).resolves.toEqual(
      expect.objectContaining({
        server: ENV.CP_SERVER,
        apiKey: ENV.CP_API_KEY,
        organization: ENV.CP_ORGANIZATION,
        project: ENV.CP_PROJECT,
        timeout: ENV.CP_TIMEOUT,
      }),
    );
  });
});
