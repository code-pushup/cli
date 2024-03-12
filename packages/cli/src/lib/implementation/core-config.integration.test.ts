import { describe, expect, vi } from 'vitest';
import {
  CoreConfig,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  PersistConfig,
  UploadConfig,
} from '@code-pushup/models';
import { CORE_CONFIG_MOCK, MINIMAL_CONFIG_MOCK } from '@code-pushup/test-utils';
import { yargsCli } from '../yargs-cli';
import { coreConfigMiddleware } from './core-config.middleware';
import { yargsCoreConfigOptionsDefinition } from './core-config.options';

vi.mock('@code-pushup/core', async () => {
  const core = await vi.importActual('@code-pushup/core');
  return {
    ...(core as object),
    readRcByPath: vi.fn().mockImplementation((filepath: string): CoreConfig => {
      const allPersistOptions = {
        ...CORE_CONFIG_MOCK,
        persist: {
          filename: 'rc-filename',
          format: ['json', 'md'],
          outputDir: 'rc-outputDir',
        },
      };
      const persistOnlyFilename = {
        ...CORE_CONFIG_MOCK,
        persist: {
          filename: 'rc-filename',
        },
      };
      const noPersist = CORE_CONFIG_MOCK;
      const noCategory = { plugins: CORE_CONFIG_MOCK.plugins };
      const noUpload = MINIMAL_CONFIG_MOCK;

      return filepath.includes('all-persist-options')
        ? allPersistOptions
        : filepath.includes('persist-only-filename')
        ? persistOnlyFilename
        : filepath.includes('no-persist')
        ? noPersist
        : filepath.includes('no-category')
        ? noCategory
        : filepath.includes('no-upload')
        ? noUpload
        : CORE_CONFIG_MOCK;
    }),
  };
});

describe('parsing values from CLI and middleware', () => {
  it('should take default values for persist when no argument is given in rc or over the cli', async () => {
    const { persist } = await yargsCli<CoreConfig>(
      ['--config=./no-persist.config.ts'],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(persist).toEqual<PersistConfig>({
      filename: PERSIST_FILENAME,
      format: PERSIST_FORMAT,
      outputDir: PERSIST_OUTPUT_DIR,
    });
  });

  it('should take values for persist when provided over the cli', async () => {
    const { persist } = await yargsCli<CoreConfig>(
      [
        '--persist.filename=cli-filename',
        '--persist.format=md',
        '--persist.outputDir=cli-outputDir',
        `--config=./no-persist.config.ts`,
      ],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(persist).toEqual<PersistConfig>({
      filename: 'cli-filename',
      format: ['md'],
      outputDir: 'cli-outputDir',
    });
  });

  it('should take values for persist when provided over the rc', async () => {
    const { persist } = await yargsCli<CoreConfig>(
      [`--config=./all-persist-options.config.ts`],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(persist).toEqual<PersistConfig>({
      filename: 'rc-filename',
      format: ['json', 'md'],
      outputDir: 'rc-outputDir',
    });
  });

  it('should take the CLI values as precedence if both the rc config and the CLI arguments are given for persist', async () => {
    const { persist } = await yargsCli<CoreConfig>(
      [
        '--persist.filename=cli-filename',
        '--persist.format=md',
        '--persist.outputDir=cli-outputDir',
        '--config=./all-persist-options.config.ts',
      ],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(persist).toEqual<PersistConfig>({
      filename: 'cli-filename',
      format: ['md'],
      outputDir: 'cli-outputDir',
    });
  });

  it('should return persist filename from config, outputDir from CLI and format default', async () => {
    const { persist } = await yargsCli<CoreConfig>(
      [
        '--persist.outputDir=cli-outputdir',
        '--config=./persist-only-filename.config.ts',
      ],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(persist).toEqual<PersistConfig>({
      filename: 'rc-filename',
      format: PERSIST_FORMAT,
      outputDir: 'cli-outputdir',
    });
  });

  it('should set empty array for categories if not given in config file', async () => {
    const { categories } = await yargsCli<CoreConfig>(
      ['--config=./no-category.config.ts'],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(categories).toEqual([]);
  });

  it('should accept an upload configuration with CLI overrides', async () => {
    const { upload } = await yargsCli<CoreConfig>(
      ['--config=./upload.config.ts', '--upload.project=portal'],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(upload).toStrictEqual<UploadConfig>({
      organization: 'code-pushup',
      project: 'portal',
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
    });
  });

  it('should accept an empty upload configuration', async () => {
    const { upload } = await yargsCli<CoreConfig>(
      ['--config=./no-upload.config.ts'],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(upload).toBeUndefined();
  });

  it('should throw for an incomplete upload configuration', async () => {
    await expect(
      yargsCli<CoreConfig>(
        [
          '--config=./no-upload.config.ts',
          '--upload.project=portal',
          '--upload.organization=code-pushup',
        ],
        {
          options: { ...yargsCoreConfigOptionsDefinition() },
          middlewares: [{ middlewareFunction: coreConfigMiddleware }],
        },
      ).parseAsync(),
    ).rejects.toThrow('invalid_type');
  });
});
