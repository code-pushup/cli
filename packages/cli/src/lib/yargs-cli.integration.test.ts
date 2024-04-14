import { describe, expect, it } from 'vitest';
import { CoreConfig, Format } from '@code-pushup/models';
import { yargsHistoryOptionsDefinition } from './history/history.options';
import { CompareOptions } from './implementation/compare.model';
import { yargsCompareOptionsDefinition } from './implementation/compare.options';
import {
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './implementation/core-config.model';
import { GeneralCliOptions } from './implementation/global.model';
import { OnlyPluginsOptions } from './implementation/only-plugins.model';
import { yargsOnlyPluginsOptionsDefinition } from './implementation/only-plugins.options';
import { options } from './options';
import { yargsCli } from './yargs-cli';

describe('yargsCli', () => {
  it('should provide correct default values for global options', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions>([], {
      options,
    }).parseAsync();
    expect(parsedArgv.verbose).toBe(false);
    expect(parsedArgv.progress).toBe(true);
  });

  it('should parse an empty array as a default onlyPlugins option', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions & OnlyPluginsOptions>(
      [],
      { options: { ...options, ...yargsOnlyPluginsOptionsDefinition() } },
    ).parseAsync();
    expect(parsedArgv.onlyPlugins).toEqual([]);
  });

  it('should parse a single boolean negated argument', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions>(['--no-progress'], {
      options,
    }).parseAsync();
    expect(parsedArgv.progress).toBe(false);
  });

  it('should parse a single config argument as a string', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions>(
      ['--config=./config.a.ts'],
      { options },
    ).parseAsync();
    expect(parsedArgv.config).toBe('./config.a.ts');
  });

  it('should parse an array argument', async () => {
    const parsedArgv = await yargsCli<CoreConfig>(
      ['--persist.format=md', '--persist.format=json'],
      { options },
    ).parseAsync();
    expect(parsedArgv.persist?.format).toEqual<Format[]>(['md', 'json']);
  });

  it('should throw for an invalid persist format', () => {
    expect(() =>
      yargsCli<CoreConfig>(['--persist.format=md', '--persist.format=stdout'], {
        options,
        noExitProcess: true,
      }).parse(),
    ).toThrow('Invalid persist.format option');
  });

  it('should parse global options correctly', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions>(
      ['--verbose', '--no-progress'],
      { options },
    ).parseAsync();
    expect(parsedArgv.verbose).toBe(true);
    expect(parsedArgv.progress).toBe(false);
  });

  it('should use the last occurrence of an argument if config is passed multiple times', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions>(
      ['--config=./config.a.ts', '--config=./config.b.ts'],
      { options },
    ).parseAsync();
    expect(parsedArgv.config).toBe('./config.b.ts');
  });

  it('should handle global options and middleware argument overrides correctly', async () => {
    const parsedArgv = await yargsCli<
      GeneralCliOptions &
        PersistConfigCliOptions &
        UploadConfigCliOptions &
        OnlyPluginsOptions
    >(
      [
        '--verbose',
        '--persist.format=md',
        '--persist.outputDir=code-pushdown/output/dir',
        '--persist.filename=code-pushdown-report',
        '--upload.organization=pushdown',
        '--upload.project=code-push-down',
        '--upload.server=https://code-pushdown.com/api',
        '--upload.apiKey=some-api-key',
        '--onlyPlugins=lighthouse',
        '--onlyPlugins=eslint',
      ],
      { options: { ...options, ...yargsOnlyPluginsOptionsDefinition() } },
    ).parseAsync();
    expect(parsedArgv).toEqual(
      expect.objectContaining({
        // default values
        progress: true,
        // overridden arguments
        verbose: true,
        persist: expect.objectContaining({
          outputDir: 'code-pushdown/output/dir',
          filename: 'code-pushdown-report',
          format: ['md'],
        }),
        upload: expect.objectContaining({
          organization: 'pushdown',
          project: 'code-push-down',
          server: 'https://code-pushdown.com/api',
          apiKey: 'some-api-key',
        }),
        onlyPlugins: ['lighthouse', 'eslint'],
      }),
    );
  });

  it('should parse compare options', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions & CompareOptions>(
      ['--before=source-report.json', '--after', 'target-report.json'],
      {
        options: { ...options, ...yargsCompareOptionsDefinition() },
      },
    ).parseAsync();
    expect(parsedArgv.before).toBe('source-report.json');
    expect(parsedArgv.after).toBe('target-report.json');
  });

  it('should error if required compare option is missing', () => {
    expect(() =>
      yargsCli<GeneralCliOptions & CompareOptions>([], {
        options: { ...options, ...yargsCompareOptionsDefinition() },
        noExitProcess: true,
      }).parse(),
    ).toThrow('Missing required arguments: before, after');
  });

  it('should provide default arguments for history command', async () => {
    const result = await yargsCli(['history'], {
      options: { ...options, ...yargsHistoryOptionsDefinition() },
    }).parseAsync();

    expect(result).toEqual(
      expect.objectContaining({
        targetBranch: 'main',
        maxCount: 5,
        skipUploads: false,
      }),
    );
  });

  it('should parse history options and have 2 commits to crawl in history if maxCount is set to 2', async () => {
    const result = await yargsCli(['history', '--maxCount=2'], {
      options: { ...options, ...yargsHistoryOptionsDefinition() },
    }).parseAsync();

    expect(result).toEqual(
      expect.objectContaining({
        targetBranch: 'main',
        maxCount: 2,
        skipUploads: false,
      }),
    );
  });
});
