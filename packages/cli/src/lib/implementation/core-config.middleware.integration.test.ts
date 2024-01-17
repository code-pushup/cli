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
import { objectToCliArgs } from '@code-pushup/utils';
import { CoreConfigNames } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { coreConfigMiddleware } from './core-config.middleware';
import {
  ConfigCliOptions,
  CoreConfigCliOptions,
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './core-config.model';
import { yargsCoreConfigOptionsDefinition } from './core-config.options';
import { GeneralCliOptions } from './global.model';

describe('coreConfigMiddleware', () => {
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

const cliWithConfigOptionsAndMiddleware = (
  cliObj: Partial<CoreConfigCliOptions>,
) =>
  yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
    options: {
      ...yargsCoreConfigOptionsDefinition(),
    },
    middlewares: [{ middlewareFunction: coreConfigMiddleware }],
  });

describe('cliWithConfigOptionsAndMiddleware', () => {
  const configPath = (kind: CoreConfigNames = 'minimal') =>
    join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'mocks',
      `code-pushup.${kind}.config.ts`,
    );
  const cliPersistOptions: PersistConfigCliOptions = {
    'persist.outputDir': 'tmp-cli',
    'persist.format': 'md',
    'persist.filename': 'cli-report',
  };
  const cliResultPersistOptions: PersistConfig = {
    outputDir: 'tmp-cli',
    format: ['md'],
    filename: 'cli-report',
  };
  const rcResultPersistOptions: PersistConfig = {
    outputDir: 'rc-tmp',
    format: ['json', 'md'],
    filename: 'rc-report',
  };
  it.each([
    [
      'defaults',
      'minimal' as const,
      {},
      {
        outputDir: PERSIST_OUTPUT_DIR,
        format: PERSIST_FORMAT,
        filename: PERSIST_FILENAME,
      },
    ],
    [
      'cli args',
      'minimal' as const,
      cliPersistOptions,
      cliResultPersistOptions,
    ],
    ['rc', 'persist' as const, {}, rcResultPersistOptions],
    [
      'rc + cli args',
      'persist' as const,
      cliPersistOptions,
      cliResultPersistOptions,
    ],
    [
      'partial rc + partial cli args',
      'persist-only-filename' as const,
      { 'persist.outputDir': cliPersistOptions['persist.outputDir'] },
      {
        outputDir: cliResultPersistOptions.outputDir,
        format: PERSIST_FORMAT,
        filename: rcResultPersistOptions.filename,
      },
    ],
  ])(
    'should handle persist arguments for "%s" correctly',
    async (id, configKind, cliObj, persistResult) => {
      const argv = await cliWithConfigOptionsAndMiddleware({
        ...(cliObj as CoreConfigCliOptions),
        config: configPath(configKind),
      }).parseAsync();

      expect(argv?.persist).toEqual(expect.objectContaining(persistResult));
    },
  );
});
