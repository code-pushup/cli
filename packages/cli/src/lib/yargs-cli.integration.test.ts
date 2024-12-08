import { describe, expect, it } from 'vitest';
import type { CoreConfig, Format } from '@code-pushup/models';
import { yargsHistoryOptionsDefinition } from './history/history.options.js';
import type { CompareOptions } from './implementation/compare.model.js';
import { yargsCompareOptionsDefinition } from './implementation/compare.options.js';
import type {
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './implementation/core-config.model.js';
import type { FilterOptions } from './implementation/filter.model.js';
import { yargsFilterOptionsDefinition } from './implementation/filter.options.js';
import type { GeneralCliOptions } from './implementation/global.model.js';
import type { MergeDiffsOptions } from './implementation/merge-diffs.model.js';
import { yargsMergeDiffsOptionsDefinition } from './implementation/merge-diffs.options.js';
import { options } from './options.js';
import { yargsCli } from './yargs-cli.js';

describe('yargsCli', () => {
  it('should provide correct default values for global options', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions>([], {
      options,
    }).parseAsync();
    expect(parsedArgv.verbose).toBe(false);
    expect(parsedArgv.progress).toBe(true);
  });

  it('should parse an empty array as a default onlyPlugins option', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions & FilterOptions>([], {
      options: { ...options, ...yargsFilterOptionsDefinition() },
    }).parseAsync();
    expect(parsedArgv.onlyPlugins).toEqual([]);
  });

  it('should parse an empty array as a default skipPlugins option', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions & FilterOptions>([], {
      options: { ...options, ...yargsFilterOptionsDefinition() },
    }).parseAsync();
    expect(parsedArgv.skipPlugins).toEqual([]);
  });

  it('should parse the overrides of skipPlugins and onlyPlugins even with different formats', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions & FilterOptions>(
      [
        '--onlyPlugins=lighthouse',
        '--onlyPlugins=eslint',
        '--skipPlugins=coverage,eslint',
      ],
      { options: { ...options, ...yargsFilterOptionsDefinition() } },
    ).parseAsync();
    expect(parsedArgv).toEqual(
      expect.objectContaining({
        onlyPlugins: ['lighthouse', 'eslint'],
        skipPlugins: ['coverage', 'eslint'],
      }),
    );
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
        FilterOptions
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
        '--skipPlugins=coverage',
        '--skipPlugins=eslint',
      ],
      { options: { ...options, ...yargsFilterOptionsDefinition() } },
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
        skipPlugins: ['coverage', 'eslint'],
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

  it('should parse merge-diffs options', async () => {
    const parsedArgv = await yargsCli<GeneralCliOptions & MergeDiffsOptions>(
      [
        '--files',
        '.code-pushup/frontend/report-diff.json',
        '.code-pushup/backend/report-diff.json',
      ],
      { options: { ...options, ...yargsMergeDiffsOptionsDefinition() } },
    ).parseAsync();
    expect(parsedArgv.files).toEqual([
      '.code-pushup/frontend/report-diff.json',
      '.code-pushup/backend/report-diff.json',
    ]);
  });

  it('should error if required merge-diffs option is missing', () => {
    expect(() =>
      yargsCli<GeneralCliOptions & CompareOptions>([], {
        options: { ...options, ...yargsMergeDiffsOptionsDefinition() },
        noExitProcess: true,
      }).parse(),
    ).toThrow('Missing required argument: files');
  });

  it('should provide default arguments for history command', async () => {
    const result = await yargsCli(['history'], {
      options: { ...options, ...yargsHistoryOptionsDefinition() },
    }).parseAsync();

    expect(result).toEqual(
      expect.objectContaining({
        onlySemverTags: false,
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
        maxCount: 2,
      }),
    );
  });

  it('should parse history options and have onlySemverTags true to crawl in history if onlySemverTags is set', async () => {
    const result = await yargsCli(['history', '--onlySemverTags'], {
      options: { ...options, ...yargsHistoryOptionsDefinition() },
    }).parseAsync();

    expect(result).toEqual(
      expect.objectContaining({
        onlySemverTags: true,
      }),
    );
  });
});
