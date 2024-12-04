import { join } from 'node:path';
import type { CoreConfig } from '@code-pushup/models';
import { parsePersistConfig, persistedFilesFromConfig } from './persist.js';

describe('persistedFilesFromConfig', () => {
  it('should return default report paths when no config is set', () => {
    expect(persistedFilesFromConfig({}, { directory: process.cwd() })).toEqual({
      json: join(process.cwd(), '.code-pushup', 'report.json'),
      md: join(process.cwd(), '.code-pushup', 'report.md'),
    });
  });

  it('should return default diff paths when no config is set', () => {
    expect(
      persistedFilesFromConfig(
        { persist: {} },
        { directory: process.cwd(), isDiff: true },
      ),
    ).toEqual({
      json: join(process.cwd(), '.code-pushup', 'report-diff.json'),
      md: join(process.cwd(), '.code-pushup', 'report-diff.md'),
    });
  });

  it('should return diff paths with filename from config', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { filename: 'merged-report' } },
        { directory: process.cwd(), isDiff: true },
      ),
    ).toEqual({
      json: join(process.cwd(), '.code-pushup', 'merged-report-diff.json'),
      md: join(process.cwd(), '.code-pushup', 'merged-report-diff.md'),
    });
  });

  it('should return report paths with outputDir from config', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { outputDir: 'tmp' } },
        { directory: process.cwd() },
      ),
    ).toEqual({
      json: join(process.cwd(), 'tmp', 'report.json'),
      md: join(process.cwd(), 'tmp', 'report.md'),
    });
  });

  it('should append relative outputDir to working directory', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { outputDir: 'tmp' } },
        { directory: join(process.cwd(), 'backend') },
      ),
    ).toEqual({
      json: join(process.cwd(), 'backend', 'tmp', 'report.json'),
      md: join(process.cwd(), 'backend', 'tmp', 'report.md'),
    });
  });

  it('should ignore working directory when absolute outputDir in config', () => {
    expect(
      persistedFilesFromConfig(
        { persist: { outputDir: join(process.cwd(), 'tmp') } },
        { directory: join(process.cwd(), 'backend') },
      ),
    ).toEqual({
      json: join(process.cwd(), 'tmp', 'report.json'),
      md: join(process.cwd(), 'tmp', 'report.md'),
    });
  });
});

describe('parsePersistConfig', () => {
  it('should validate only persist config', async () => {
    await expect(
      parsePersistConfig({
        persist: {
          outputDir: '.code-pushup',
          filename: 'report',
          format: ['json', 'md'],
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
      /^Invalid persist config - ZodError:.*Invalid enum value. Expected 'json' \| 'md', received 'html'/s,
    );
  });
});
