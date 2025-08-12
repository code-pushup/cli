import path from 'node:path';
import type { CoreConfig } from '@code-pushup/models';
import {
  type EnhancedPersistConfig,
  parsePersistConfig,
  persistedFilesFromConfig,
} from './persist.js';

describe('persistedFilesFromConfig', () => {
  it('should return default report paths when no config is set', () => {
    expect(persistedFilesFromConfig({}, { directory: process.cwd() })).toEqual({
      json: path.join(process.cwd(), '.code-pushup', 'report.json'),
      md: path.join(process.cwd(), '.code-pushup', 'report.md'),
    });
  });

  it('should return default diff paths when no config is set', () => {
    expect(
      persistedFilesFromConfig(
        { persist: {} },
        { directory: process.cwd(), isDiff: true },
      ),
    ).toEqual({
      json: path.join(process.cwd(), '.code-pushup', 'report-diff.json'),
      md: path.join(process.cwd(), '.code-pushup', 'report-diff.md'),
    });
  });

  it('should return diff paths with filename from config', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { filename: 'merged-report' } },
        { directory: process.cwd(), isDiff: true },
      ),
    ).toEqual({
      json: path.join(process.cwd(), '.code-pushup', 'merged-report-diff.json'),
      md: path.join(process.cwd(), '.code-pushup', 'merged-report-diff.md'),
    });
  });

  it('should return report paths with outputDir from config', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { outputDir: 'tmp' } },
        { directory: process.cwd() },
      ),
    ).toEqual({
      json: path.join(process.cwd(), 'tmp', 'report.json'),
      md: path.join(process.cwd(), 'tmp', 'report.md'),
    });
  });

  it('should append relative outputDir to working directory', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { outputDir: 'tmp' } },
        { directory: path.join(process.cwd(), 'backend') },
      ),
    ).toEqual({
      json: path.join(process.cwd(), 'backend', 'tmp', 'report.json'),
      md: path.join(process.cwd(), 'backend', 'tmp', 'report.md'),
    });
  });

  it('should ignore working directory when absolute outputDir in config', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { outputDir: path.join(process.cwd(), 'tmp') } },
        { directory: path.join(process.cwd(), 'backend') },
      ),
    ).toEqual({
      json: path.join(process.cwd(), 'tmp', 'report.json'),
      md: path.join(process.cwd(), 'tmp', 'report.md'),
    });
  });
});

describe('parsePersistConfig', () => {
  it('should validate only persist and upload config', async () => {
    await expect(
      parsePersistConfig({
        persist: {
          outputDir: '.code-pushup',
          filename: 'report',
          format: ['json', 'md'],
        },
        upload: {
          server: 'https://code-pushup-api.dunder-mifflin.org/graphql',
          apiKey: 'cp_abcdef0123456789',
          organization: 'dunder-mifflin',
          project: 'website',
        },
        // missing props (slug, etc.)
        plugins: [{ title: 'some plugin', audits: [{ title: 'some audit' }] }],
      } as CoreConfig),
    ).resolves.toEqual({
      persist: {
        outputDir: '.code-pushup',
        filename: 'report',
        format: ['json', 'md'],
      },
      upload: {
        server: 'https://code-pushup-api.dunder-mifflin.org/graphql',
        apiKey: 'cp_abcdef0123456789',
        organization: 'dunder-mifflin',
        project: 'website',
      },
    } satisfies EnhancedPersistConfig);
  });

  it('should accept missing upload config', async () => {
    await expect(
      parsePersistConfig({
        persist: {
          outputDir: '.code-pushup',
          filename: 'report',
          format: ['json', 'md'],
        },
      }),
    ).resolves.toEqual({
      persist: {
        outputDir: '.code-pushup',
        filename: 'report',
        format: ['json', 'md'],
      },
    });
  });

  it('should accept missing persist config', async () => {
    await expect(parsePersistConfig({})).resolves.toEqual({});
  });

  it('should accept empty persist config', async () => {
    await expect(parsePersistConfig({ persist: {} })).resolves.toEqual({
      persist: {},
    });
  });

  it('should accept partial persist config', async () => {
    await expect(
      parsePersistConfig({ persist: { outputDir: 'tmp' } }),
    ).resolves.toEqual({
      persist: { outputDir: 'tmp' },
    });
  });

  it('should error if persist config is invalid', async () => {
    await expect(
      parsePersistConfig({ persist: { format: ['json', 'html'] } }),
    ).rejects.toThrow(
      /^Code PushUp config is invalid.*Invalid option: expected one of "json"\|"md".*at persist\.format\[1]/s,
    );
  });

  it('should error if upload config is invalid', async () => {
    await expect(
      parsePersistConfig({
        upload: {
          organization: 'dunder-mifflin',
          project: 'website',
        },
      }),
    ).rejects.toThrow(
      /^Code PushUp config is invalid.*Invalid input: expected string, received undefined.*at upload\.server.*at upload\.apiKey/s,
    );
  });
});
