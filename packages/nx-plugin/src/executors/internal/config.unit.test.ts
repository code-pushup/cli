import type { MockInstance } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import { ENV } from '../../../mock/fixtures/env.js';
import { globalConfig, persistConfig, uploadConfig } from './config.js';

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
    expect(osAgnosticPath(String(config))).toStrictEqual(
      expect.stringContaining(
        osAgnosticPath('project-root/code-pushup.config.ts'),
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

  it('should include the command options', () => {
    const { command } = globalConfig(
      { command: 'collect' },
      {
        workspaceRoot: '/test/root/workspace-root',
        projectConfig: {
          name: 'my-app',
          root: 'packages/project-root',
        },
      },
    );
    expect(command).toBe('collect');
  });

  it('should work with empty projectConfig', () => {
    expect(
      globalConfig(
        {},
        {
          workspaceRoot: '/test/root/workspace-root',
        },
      ),
    ).toEqual(expect.objectContaining({ config: 'code-pushup.config.ts' }));
  });

  it('should exclude other options', () => {
    expect(
      globalConfig(
        { test: 42, verbose: true },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.not.objectContaining({ test: expect.anything() }));
  });
});

describe('persistConfig', () => {
  it('should NOT provide default persist format options', () => {
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
    ).toEqual(expect.not.objectContaining({ format: expect.anything() }));
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
    expect(osAgnosticPath(String(outputDir))).toBe(
      osAgnosticPath(`/test/root/workspace-root/.code-pushup/${projectName}`),
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
    expect(osAgnosticPath(String(resultingOutDir))).toEqual(
      expect.stringContaining(osAgnosticPath('../dist/packages/test-folder')),
    );
  });

  it('should work with empty projectConfig', () => {
    const { outputDir } = persistConfig(
      {},
      {
        workspaceRoot: '/test/root/workspace-root',
      },
    );

    expect(osAgnosticPath(String(outputDir))).toEqual(
      expect.stringContaining(osAgnosticPath('.code-pushup')),
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

  let processEnvSpy: MockInstance<[], NodeJS.ProcessEnv>;

  beforeAll(() => {
    processEnvSpy = vi.spyOn(process, 'env', 'get').mockReturnValue({});
  });

  afterAll(() => {
    processEnvSpy.mockRestore();
  });

  it('should provide default upload project options as project name', () => {
    const projectName = 'my-app';
    expect(
      uploadConfig(baseUploadConfig, {
        workspaceRoot: 'workspace-root',
        projectName,
        projectConfig: {
          root: 'root',
        },
      }),
    ).toEqual(expect.objectContaining({ project: projectName }));
  });

  it('should parse upload project options', () => {
    expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          project: 'cli-utils',
        },
        { workspaceRoot: 'workspace-root', projectName: 'utils' },
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
        { workspaceRoot: 'workspace-root', projectName: 'utils' },
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
        { workspaceRoot: 'workspace-root', projectName: 'utils' },
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
        { workspaceRoot: 'workspace-root', projectName: 'utils' },
      ),
    ).toEqual(expect.objectContaining({ apiKey: '123456789' }));
  });

  it('should parse process.env options', () => {
    processEnvSpy.mockReturnValue(ENV);
    expect(
      uploadConfig(
        {},
        { workspaceRoot: 'workspaceRoot', projectName: 'my-app' },
      ),
    ).toEqual(
      expect.objectContaining({
        apiKey: ENV.CP_API_KEY,
      }),
    );
  });

  it('should options overwrite process.env vars', () => {
    expect(
      uploadConfig(
        {
          project: 'my-app2',
        },
        { workspaceRoot: 'workspaceRoot', projectName: 'my-app' },
      ),
    ).toStrictEqual(expect.objectContaining({ project: 'my-app2' }));
  });

  it('should apply projectPrefix when workspaceRoot is not "."', () => {
    expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          projectPrefix: 'cli',
        },
        { workspaceRoot: 'workspace-root', projectName: 'models' },
      ),
    ).toStrictEqual(expect.objectContaining({ project: 'cli-models' }));
  });

  it('should NOT apply projectPrefix when workspaceRoot is "."', () => {
    expect(
      uploadConfig(
        {
          ...baseUploadConfig,
          projectPrefix: 'cli',
        },
        { workspaceRoot: '.', projectName: 'models' },
      ),
    ).toStrictEqual(expect.objectContaining({ project: 'models' }));
  });

  it('should NOT apply projectPrefix when projectPrefix is not provided', () => {
    expect(
      uploadConfig(baseUploadConfig, {
        workspaceRoot: 'workspace-root',
        projectName: 'models',
      }),
    ).toStrictEqual(expect.objectContaining({ project: 'models' }));
  });
});
