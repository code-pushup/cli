import {describe, expect} from 'vitest';
import {CoreConfig, PERSIST_FILENAME, PERSIST_FORMAT, PERSIST_OUTPUT_DIR,} from '@code-pushup/models';
import {yargsCli} from '../yargs-cli';
import {coreConfigMiddleware} from './core-config.middleware';
import {yargsCoreConfigOptionsDefinition} from './core-config.options';

describe('cliWithConfigOptionsAndMiddleware', () => {

  it('should take default values for persist when no argument is given in rc or over the cli', async () => {
    const {persist} = await yargsCli<CoreConfig>(
      [
        '--persist.outputDir=tmp-cli',
        '--persist.format=md',
        '--persist.filename=cli-report',
        '--config=./minimal.config.ts', // cwd is also mocked
      ],
      {
        options: {...yargsCoreConfigOptionsDefinition()},
        middlewares: [{middlewareFunction: coreConfigMiddleware}],
      },
    ).parseAsync();

    expect(persist).toEqual(expect.objectContaining({
      outputDir: PERSIST_OUTPUT_DIR,
      format: PERSIST_FORMAT,
      filename: PERSIST_FILENAME,
    }));
  });

  it('should take values for persist when provided over the cli', async () => {
    const {persist} = await yargsCli<CoreConfig>(
      [
        '--persist.outputDir=tmp-cli',
        '--persist.format=md',
        '--persist.filename=cli-report',
        `--config=./test/code-pushup.persist-only-filename.config.ts`,
      ],
      {
        options: {...yargsCoreConfigOptionsDefinition()},
        middlewares: [{middlewareFunction: coreConfigMiddleware}],
      },
    ).parseAsync();

    expect(persist).toEqual(expect.objectContaining({
      outputDir: 'tmp-cli',
      format: 'md',
      filename: 'cli-report'
    }));
  });

  it('should take values for persist when provided over the rc', async () => {
    const {persist} = await yargsCli<CoreConfig>(
      [
        '--persist.outputDir=tmp-cli',
        '--persist.format=md',
        '--persist.filename=cli-report',
        `--config=./code-pushup.persist.config.ts`,
      ],
      {
        options: {...yargsCoreConfigOptionsDefinition()},
        middlewares: [{middlewareFunction: coreConfigMiddleware}],
      },
    ).parseAsync();

    expect(persist).toEqual(expect.objectContaining({
      outputDir: 'rc-tmp',
      format: ['json', 'md'],
      filename: 'rc-report',
    }));
  });

  it('should take the CLI values as precedence if both, the rc config and the CLI arguments are given for persist', async () => {
    const {persist} = await yargsCli<CoreConfig>(
      [
        '--persist.outputDir=tmddp-cli',
        '--persist.format=md',
        '--persist.filename=cli-report',
        '--config=code-pushup.persist-only-filename.config', // cwd is also mocked
      ],
      {
        options: {...yargsCoreConfigOptionsDefinition()},
        middlewares: [{middlewareFunction: coreConfigMiddleware}],
      },
    ).parseAsync();

    expect(persist).toEqual(expect.objectContaining({
      outputDir: 'tmp-cli',
      format: 'md',
      filename: 'cli-report',
    }));
  });

  it('should take values for persist when provided over both, the rc config, the cli and the defaults', async () => {
    const {persist} = await yargsCli<CoreConfig>(
      [
        '--persist.outputDir=cli-outputdir',
        '--config=./persist-only-filename.config.ts', // cwd is also mocked
      ],
      {
        options: {...yargsCoreConfigOptionsDefinition()},
        middlewares: [{middlewareFunction: coreConfigMiddleware}],
      },
    ).parseAsync();

    expect(persist).toEqual(expect.objectContaining({
      outputDir: 'tmp-cli',
      format: 'md',
      filename: 'cli-report',
    }));
  });

  // TODO THIS IS AN EXAMPLE
  it('should return persist filename from config, outputDir from CLI and format default', async () => {
    await expect(
      yargsCli<CoreConfig>(
        [
          '--persist.outputDir=tmp-cli',
          '--persist.format=md',
          '--persist.filename=cli-report',
          '--config=./code-pushup.persist-only-filename.config.ts', // cwd is also mocked
        ],
        {
          options: {...yargsCoreConfigOptionsDefinition()},
          middlewares: [{middlewareFunction: coreConfigMiddleware}],
        },
      ).parseAsync(),
    ).resolves.toEqual(
      expect.objectContaining({
        persist: {
          filename: 'rc-filename', // from config
          outputDir: 'cli-outputdir', // from CLI
          format: ['json'], // default
        },
      }),
    );
  });

});


