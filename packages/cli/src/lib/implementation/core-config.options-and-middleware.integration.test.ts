import { vol } from 'memfs';
import {
  SpyInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  vi,
} from 'vitest';
import {
  CoreConfig,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { CORE_CONFIG_MOCK, MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { yargsCli } from '../yargs-cli';
import { coreConfigMiddleware } from './core-config.middleware';
import { yargsCoreConfigOptionsDefinition } from './core-config.options';

vi.mock('bundle-require', () => ({
  bundleRequire: vi.fn().mockImplementation(args => {
    const filepath = args.filepath as string;

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

    return {
      mod: {
        default: filepath.includes('all-persist-options')
          ? allPersistOptions
          : filepath.includes('persist-only-filename')
          ? persistOnlyFilename
          : CORE_CONFIG_MOCK,
      },
    };
  }),
}));

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

let cwdSpy: SpyInstance;

describe('parsing values from CLI and middleware', () => {
  beforeEach(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);

    // value set in bundle-require mock above
    vol.fromJSON(
      {
        'no-persist.config.ts': '',
        'all-persist-options.config.ts': '',
        'persist-only-filename.config.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  afterEach(() => {
    cwdSpy.mockRestore();
  });

  it('should take default values for persist when no argument is given in rc or over the cli', async () => {
    const { persist } = await yargsCli<CoreConfig>(
      ['--config=./no-persist.config.ts'],
      {
        options: { ...yargsCoreConfigOptionsDefinition() },
        middlewares: [{ middlewareFunction: coreConfigMiddleware }],
      },
    ).parseAsync();

    expect(persist).toEqual({
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

    expect(persist).toEqual({
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

    expect(persist).toEqual({
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

    expect(persist).toEqual({
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

    expect(persist).toEqual({
      filename: 'rc-filename',
      format: PERSIST_FORMAT,
      outputDir: 'cli-outputdir',
    });
  });
});
