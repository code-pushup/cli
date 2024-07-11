import { afterEach, beforeEach, describe, expect } from 'vitest';
import { toNormalizedPath } from '@code-pushup/test-utils';
import { ENV } from '../../../mock/fixtures/env';
import { globalConfig, persistConfig, uploadConfig } from './config';

describe('globalConfig', () => {
  it('should provide default global verbose options', () => {
    expect(
      globalConfig(
        {},
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ verbose: false }));
  });

  it('should parse global verbose options', () => {
    expect(
      globalConfig(
        { verbose: true },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ verbose: true }));
  });

  it('should provide default global progress options', () => {
    expect(
      globalConfig(
        {},
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ progress: false }));
  });

  it('should parse global progress options', () => {
    expect(
      globalConfig(
        { progress: true },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ progress: true }));
  });

  it('should provide default global config options', () => {
    const { config } = globalConfig(
      {},
      {
        workspaceRoot: '/test/root/workspace-root',
        projectConfig: {
          name: 'my-app',
          root: 'packages/project-root',
        },
      },
    );
    expect(toNormalizedPath(config)).toEqual(
      expect.stringContaining(
        toNormalizedPath('project-root/code-pushup.config.json'),
      ),
    );
  });

  it('should parse global config options', () => {
    expect(
      globalConfig(
        { config: 'my.config.ts' },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ config: 'my.config.ts' }));
  });

  it('should exclude other options', () => {
    expect(
      globalConfig({ test: 42 } as unknown as { verbose: boolean }, {
        workspaceRoot: '/test/root/workspace-root',
        projectConfig: {
          name: 'my-app',
          root: 'packages/project-root',
        },
      }),
    ).toEqual(expect.not.objectContaining({ test: expect.anything() }));
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
    const { outputDir } = persistConfig(
      {},
      {
        workspaceRoot: '/test/root/workspace-root',
        projectConfig: {
          name: projectName,
          root: 'packages/project-root',
        },
      },
    );
    expect(toNormalizedPath(outputDir)).toEqual(
      expect.stringContaining(
        toNormalizedPath(`packages/project-root/.code-pushup/${projectName}`),
      ),
    );
  });

  it('should parse given outputDir options', () => {
    const outputDir = '../dist/packages/test-folder';
    const { outputDir: resultingOutDir } = persistConfig(
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
    );
    expect(toNormalizedPath(resultingOutDir)).toEqual(
      expect.stringContaining(toNormalizedPath('../dist/packages/test-folder')),
    );
  });

  it('should provide NO default persist filename', () => {
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
    ).toEqual(expect.not.objectContaining({ filename: expect.anything() }));
  });

  it('should parse given persist filename', () => {
    const projectName = 'my-app';
    expect(
      persistConfig(
        {
          filename: 'my-name',
        },
        {
          workspaceRoot: 'workspaceRoot',
          projectConfig: {
            name: projectName,
            root: 'root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ filename: 'my-name' }));
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

  it('should provide default upload project options as project name', () => {
    const projectName = 'my-app';
    expect(
      uploadConfig(baseUploadConfig, {
        workspaceRoot: 'workspace-root',
        projectConfig: {
          name: projectName,
          root: 'root',
        },
      }),
    ).toEqual(expect.objectContaining({ project: projectName }));
  });

  it('should parse upload project options', () => {
    const projectName = 'utils';
    expect(
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
    ).toEqual(expect.objectContaining({ project: 'cli-utils' }));
  });

  it('should parse upload server options', () => {
    expect(
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
    ).toEqual(
      expect.objectContaining({
        server: 'https://new1-portal.code.pushup.dev',
      }),
    );
  });

  it('should parse upload organization options', () => {
    expect(
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
    ).toEqual(expect.objectContaining({ organization: 'code-pushup-v2' }));
  });

  it('should parse upload apiKey options', () => {
    expect(
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
    ).toEqual(expect.objectContaining({ apiKey: '123456789' }));
  });

  it('should parse process.env options', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env = ENV;

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
        timeout: ENV.CP_TIMEOUT,
      }),
    );
  });
});
