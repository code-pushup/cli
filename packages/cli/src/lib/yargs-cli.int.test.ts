import type { CompareOptions } from '@code-pushup/core';
import type { CoreConfig, Format } from '@code-pushup/models';
import { yargsHistoryOptionsDefinition } from './history/history.options.js';
import { yargsCompareOptionsDefinition } from './implementation/compare.options.js';
import type {
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './implementation/core-config.model.js';
import type { FilterOptions } from './implementation/filter.model.js';
import { yargsFilterOptionsDefinition } from './implementation/filter.options.js';
import type { GlobalOptions } from './implementation/global.model.js';
import type { MergeDiffsOptions } from './implementation/merge-diffs.model.js';
import { yargsMergeDiffsOptionsDefinition } from './implementation/merge-diffs.options.js';
import { options } from './options.js';
import { yargsCli } from './yargs-cli.js';

describe('yargsCli', () => {
  it('should parse an empty array as a default onlyPlugins option', async () => {
    const parsedArgv = await yargsCli<GlobalOptions & FilterOptions>([], {
      options: { ...options, ...yargsFilterOptionsDefinition() },
    }).parseAsync();
    expect(parsedArgv.onlyPlugins).toEqual([]);
  });

  it('should parse an empty array as a default skipPlugins option', async () => {
    const parsedArgv = await yargsCli<GlobalOptions & FilterOptions>([], {
      options: { ...options, ...yargsFilterOptionsDefinition() },
    }).parseAsync();
    expect(parsedArgv.skipPlugins).toEqual([]);
  });

  it('should parse the overrides of skipPlugins and onlyPlugins even with different formats', async () => {
    const parsedArgv = await yargsCli<GlobalOptions & FilterOptions>(
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
    const parsedArgv = await yargsCli<GlobalOptions>(['--no-verbose'], {
      options,
    }).parseAsync();
    expect(parsedArgv.verbose).toBeFalse();
  });

  it('should parse a single config argument as a string', async () => {
    const parsedArgv = await yargsCli<GlobalOptions>(
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
    const parsedArgv = await yargsCli<GlobalOptions>(
      ['--verbose', '--tsconfig', 'tsconfig.json'],
      { options },
    ).parseAsync();
    expect(parsedArgv.verbose).toBeTrue();
    expect(parsedArgv.tsconfig).toBe('tsconfig.json');
  });

  it('should use the last occurrence of an argument if config is passed multiple times', async () => {
    const parsedArgv = await yargsCli<GlobalOptions>(
      ['--config=./config.a.ts', '--config=./config.b.ts'],
      { options },
    ).parseAsync();
    expect(parsedArgv.config).toBe('./config.b.ts');
  });

  it('should use the last occurrence of an argument if persist.outputDir is passed multiple times', async () => {
    const parsedArgv = await yargsCli<Pick<CoreConfig, 'persist'>>(
      ['--persist.outputDir=output-a', '--persist.outputDir=output-b'],
      { options },
    ).parseAsync();
    expect(parsedArgv.persist!.outputDir).toBe('output-b');
  });

  it('should ignore unknown options', async () => {
    const parsedArgv = await yargsCli<GlobalOptions>(
      ['--no-progress', '--verbose'],
      { options },
    ).parseAsync();
    expect(parsedArgv.verbose).toBeTrue();
  });

  it('should handle global options and middleware argument overrides correctly', async () => {
    const parsedArgv = await yargsCli<
      GlobalOptions &
        PersistConfigCliOptions &
        UploadConfigCliOptions &
        FilterOptions
    >(
      [
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
        onlyCategories: [],
        skipCategories: [],
        // overridden arguments
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
    const parsedArgv = await yargsCli<GlobalOptions & CompareOptions>(
      ['--before=source-report.json', '--after', 'target-report.json'],
      {
        options: { ...options, ...yargsCompareOptionsDefinition() },
      },
    ).parseAsync();
    expect(parsedArgv.before).toBe('source-report.json');
    expect(parsedArgv.after).toBe('target-report.json');
  });

  it('should parse merge-diffs options', async () => {
    const parsedArgv = await yargsCli<GlobalOptions & MergeDiffsOptions>(
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
      yargsCli<GlobalOptions & CompareOptions>([], {
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
