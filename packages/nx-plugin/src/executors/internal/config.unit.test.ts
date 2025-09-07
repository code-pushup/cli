import { type MockInstance, describe, expect } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import { ENV } from '../../../mock/fixtures/env.js';
import { globalConfig, persistConfig, uploadConfig } from './config.js';

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

  // should get handled in plugin
  it('should provide default global config options', () => {
    const { config } = globalConfig({});
    expect(osAgnosticPath(String(config))).toStrictEqual(
      expect.stringContaining(
        osAgnosticPath('{projectRoot}/code-pushup.config.ts'),
      ),
    );
  });

  it('should parse global config options', () => {
    expect(globalConfig({ config: 'my.config.ts' })).toEqual(
      expect.objectContaining({ config: 'my.config.ts' }),
    );
  });

  it('should work with empty projectConfig', () => {
    expect(globalConfig({})).toEqual(
      expect.objectContaining({
        config: '{projectRoot}/code-pushup.config.ts',
      }),
    );
  });

  it('should exclude other options', () => {
    expect(globalConfig({ test: 42, verbose: true })).toEqual(
      expect.not.objectContaining({ test: expect.anything() }),
    );
  });
});

describe('persistConfig', () => {
  it('should NOT provide default persist format options', () => {
    expect(persistConfig({})).toEqual(
      expect.not.objectContaining({ format: expect.anything() }),
    );
  });

  it('should parse given persist format option', () => {
    expect(
      persistConfig({
        format: ['md'],
      }),
    ).toEqual(
      expect.objectContaining({
        format: ['md'],
      }),
    );
  });

  it('should provide default outputDir options', () => {
    const { outputDir } = persistConfig({});
    expect(osAgnosticPath(String(outputDir))).toBe(
      osAgnosticPath('{projectRoot}/.code-pushup'),
    );
  });

  it('should parse given outputDir options', () => {
    const outputDir = '../dist/packages/test-folder';
    const { outputDir: resultingOutDir } = persistConfig({
      outputDir,
    });
    expect(osAgnosticPath(String(resultingOutDir))).toEqual(
      expect.stringContaining(osAgnosticPath('../dist/packages/test-folder')),
    );
  });

  it('should work with empty projectConfig', () => {
    const { outputDir } = persistConfig({});

    expect(osAgnosticPath(String(outputDir))).toEqual(
      expect.stringContaining(osAgnosticPath('.code-pushup')),
    );
  });

  it('should provide NO default persist filename', () => {
    expect(persistConfig({})).toEqual(
      expect.not.objectContaining({ filename: expect.anything() }),
    );
  });

  it('should parse given persist filename', () => {
    expect(
      persistConfig({
        filename: 'my-name',
      }),
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

  beforeEach(() => {
    processEnvSpy.mockReturnValue({});
  });

  it('should provide default upload project options as project name', () => {
    expect(uploadConfig(baseUploadConfig)).toStrictEqual(
      expect.objectContaining({
        server: 'https://base-portal.code.pushup.dev',
        apiKey: 'apiKey',
        organization: 'organization',
      }),
    );
  });

  // Useless now
  it('should parse upload project options', () => {
    expect(
      uploadConfig({
        ...baseUploadConfig,
        project: 'cli-utils',
      }),
    ).toEqual(expect.objectContaining({ project: 'cli-utils' }));
  });

  it('should parse upload server options', () => {
    expect(
      uploadConfig({
        ...baseUploadConfig,
        server: 'https://new1-portal.code.pushup.dev',
      }),
    ).toEqual(
      expect.objectContaining({
        server: 'https://new1-portal.code.pushup.dev',
      }),
    );
  });

  it('should parse upload organization options', () => {
    expect(
      uploadConfig({
        ...baseUploadConfig,
        organization: 'code-pushup-v2',
      }),
    ).toEqual(expect.objectContaining({ organization: 'code-pushup-v2' }));
  });

  it('should parse upload apiKey options', () => {
    expect(
      uploadConfig({
        ...baseUploadConfig,
        apiKey: '123456789',
      }),
    ).toEqual(expect.objectContaining({ apiKey: '123456789' }));
  });

  it('should parse process.env options', () => {
    processEnvSpy.mockReturnValue(ENV);
    expect(uploadConfig({})).toEqual(
      expect.objectContaining({
        server: ENV.CP_SERVER,
        apiKey: ENV.CP_API_KEY,
        organization: ENV.CP_ORGANIZATION,
        project: ENV.CP_PROJECT,
        timeout: Number(ENV.CP_TIMEOUT),
      }),
    );
  });

  it('should options overwrite process.env vars', () => {
    expect(
      uploadConfig({
        ...baseUploadConfig,
        project: 'my-app2',
      }),
    ).toEqual(
      expect.objectContaining({
        project: 'my-app2',
        server: 'https://base-portal.code.pushup.dev',
        apiKey: 'apiKey',
        organization: 'organization',
      }),
    );
  });
});
