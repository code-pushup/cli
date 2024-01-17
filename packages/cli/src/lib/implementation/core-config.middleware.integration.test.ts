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
import { CoreConfigNames } from '@code-pushup/testing-utils';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { coreConfigMiddleware } from './core-config.middleware';
import {
  CoreConfigCliOptions,
  PersistConfigCliOptions,
} from './core-config.model';
import { yargsCoreConfigOptionsDefinition } from './core-config.options';
import { GeneralCliOptions } from './global.model';

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

const cliWithConfigOptionsAndMiddleware = (
  cliObj: Partial<GeneralCliOptions>,
) =>
  yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
    options: {
      ...yargsCoreConfigOptionsDefinition(),
    },
    middlewares: [{ middlewareFunction: coreConfigMiddleware }],
  });

describe('cliWithConfigOptionsAndMiddleware', () => {
  const configPath = (kind?: CoreConfigNames) => {
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

  it.each<
    [string, CoreConfigNames, Partial<CoreConfigCliOptions>, PersistConfig]
  >([
    [
      'defaults',
      'minimal',
      {},
      {
        outputDir: PERSIST_OUTPUT_DIR,
        format: PERSIST_FORMAT,
        filename: PERSIST_FILENAME,
      },
    ],
    ['cli args', 'minimal', cliPersistOptions, cliResultPersistOptions],
    ['rc', 'persist', {}, rcResultPersistOptions],
    ['rc + cli args', 'persist', cliPersistOptions, cliResultPersistOptions],
    [
      'partial rc + partial cli args',
      'persist-only-filename',
      { 'persist.outputDir': cliPersistOptions['persist.outputDir'] },
      {
        outputDir: cliResultPersistOptions.outputDir,
        format: PERSIST_FORMAT,
        filename: rcResultPersistOptions.filename,
      },
    ],
  ])(
    'should handle persist arguments for "%s" correctly',
    async (_, configKind, cliObj, expectedObject) => {
      const argv = await cliWithConfigOptionsAndMiddleware({
        ...cliObj,
        config: configPath(configKind),
      }).parseAsync();

      expect(argv?.persist).toEqual(expect.objectContaining(expectedObject));
    },
  );
});
