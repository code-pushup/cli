import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import {
  CoreConfig,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { coreConfigMiddleware } from './core-config.middleware';
import { ConfigCliOptions } from './core-config.model';
import { yargsCoreConfigOptionsDefinition } from './core-config.options';

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
  cliObj: CoreConfig & ConfigCliOptions,
) =>
  yargsCli<CoreConfig>(objectToCliArgs(cliObj), {
    options: {
      ...yargsCoreConfigOptionsDefinition(),
    },
    middlewares: [{ middlewareFunction: coreConfigMiddleware }],
  });

describe('cliWithConfigOptionsAndMiddleware', () => {
  const configPath = (kind: 'minimal' | 'persist' | 'upload' = 'minimal') =>
    join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'mocks',
      `code-pushup.${kind}.config.ts`,
    );

  it.each([
    [
      'minimal' as const,
      {},
      {
        outputDir: PERSIST_OUTPUT_DIR,
        format: PERSIST_FORMAT,
        filename: PERSIST_FILENAME,
      },
    ],
    [
      'persist' as const,
      {
        'persist.outputDir': 'tmp',
        'persist.format': 'md',
        'persist.filename': 'report-name',
      },
      { outputDir: 'tmp', format: ['md'], filename: 'report-name' },
    ],
  ])(
    'should handle persist arguments for %s correctly',
    async (configKind, cliObj, persistResult) => {
      const argv = await cliWithConfigOptionsAndMiddleware({
        ...(cliObj as CoreConfig),
        config: configPath(configKind),
      }).parseAsync();

      expect(argv?.persist).toEqual(expect.objectContaining(persistResult));
    },
  );
});
