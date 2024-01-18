import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import {
  CoreConfig,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  PersistConfig,
} from '@code-pushup/models';
import { CoreConfigName } from '@code-pushup/testing-utils';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { coreConfigMiddleware } from './core-config.middleware';
import {
  CoreConfigCliOptions,
  PersistConfigCliOptions,
} from './core-config.model';
import { yargsCoreConfigOptionsDefinition } from './core-config.options';

const configDirPath = join(
  fileURLToPath(dirname(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
  'testing-utils',
  'src',
  'lib',
  'fixtures',
  'configs',
);

describe('coreConfigMiddleware', () => {
  it.each(['ts', 'mjs', 'js'])(
    'should load a valid .%s config',
    async extension => {
      const config = await coreConfigMiddleware({
        config: join(configDirPath, `code-pushup.config.${extension}`),
      });
      expect(config.config).toContain(`code-pushup.config.${extension}`);
      expect(config.upload?.project).toContain(extension);
    },
  );

  it('should throw with invalid config path', async () => {
    await expect(
      coreConfigMiddleware({ config: 'wrong/path/to/config' }),
    ).rejects.toThrow(/Provided path .* is not valid./);
  });
});

describe('cliWithConfigOptionsAndMiddleware', () => {
  const cliWithConfigOptionsAndMiddleware = (
    cliObj: Partial<CoreConfigCliOptions>,
  ) =>
    yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
      options: {
        ...yargsCoreConfigOptionsDefinition(),
      },
      middlewares: [{ middlewareFunction: coreConfigMiddleware }],
    });
  const configPath = (kind?: CoreConfigName) => {
    const templateKind = kind ? `${kind}.` : '';
    return join(configDirPath, `code-pushup.${templateKind}config.ts`);
  };
  const cliPersistOptions: PersistConfigCliOptions = {
    'persist.outputDir': 'tmp-cli',
    'persist.format': 'md',
    'persist.filename': 'cli-report',
  };
  const cliResultPersistOptions: PersistConfig = {
    outputDir: cliPersistOptions['persist.outputDir'],
    format: [cliPersistOptions['persist.format']],
    filename: cliPersistOptions['persist.filename'],
  };
  const rcResultPersistOptions: PersistConfig = {
    outputDir: 'rc-tmp',
    format: ['json', 'md'],
    filename: 'rc-report',
  };

  it('should take default values for persist when no argument is given in rc or over the cli', async () => {
    const expectedObject = {
      outputDir: PERSIST_OUTPUT_DIR,
      format: PERSIST_FORMAT,
      filename: PERSIST_FILENAME,
    };
    const argv = await cliWithConfigOptionsAndMiddleware({
      config: configPath('minimal'),
    }).parseAsync();

    expect(argv?.persist).toEqual(expect.objectContaining(expectedObject));
  });

  it('should take values for persist when provided over the cli', async () => {
    const expectedObject = cliResultPersistOptions;
    const argv = await cliWithConfigOptionsAndMiddleware({
      ...cliPersistOptions,
      config: configPath('minimal'),
    }).parseAsync();

    expect(argv?.persist).toEqual(expect.objectContaining(expectedObject));
  });

  it('should take values for persist when provided over the rc', async () => {
    const expectedObject = rcResultPersistOptions;
    const argv = await cliWithConfigOptionsAndMiddleware({
      config: configPath('persist'),
    }).parseAsync();

    expect(argv?.persist).toEqual(expect.objectContaining(expectedObject));
  });

  it('should take the CLI values as precedence if both, the rc config and the CLI arguments are given for persist', async () => {
    const expectedObject = cliResultPersistOptions;
    const argv = await cliWithConfigOptionsAndMiddleware({
      ...cliPersistOptions,
      config: configPath('persist'),
    }).parseAsync();

    expect(argv?.persist).toEqual(expect.objectContaining(expectedObject));
  });

  it('should take values for persist when provided over both, the rc config, the cli and the defaults', async () => {
    const expectedObject = {
      outputDir: cliResultPersistOptions.outputDir,
      format: PERSIST_FORMAT,
      filename: rcResultPersistOptions.filename,
    };
    const argv = await cliWithConfigOptionsAndMiddleware({
      ['persist.outputDir']: cliPersistOptions['persist.outputDir'],
      config: configPath('persist-only-filename'),
    }).parseAsync();

    expect(argv?.persist).toEqual(expect.objectContaining(expectedObject));
  });
});
