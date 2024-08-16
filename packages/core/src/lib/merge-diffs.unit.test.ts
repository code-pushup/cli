import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PersistConfig } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  getLogMessages,
  reportsDiffAddedPluginMock,
  reportsDiffAltMock,
  reportsDiffMock,
  reportsDiffUnchangedMock,
} from '@code-pushup/test-utils';
import { fileExists, ui } from '@code-pushup/utils';
import { mergeDiffs } from './merge-diffs';

describe('mergeDiffs', () => {
  const diffPaths = {
    'console/report-diff.json': JSON.stringify(reportsDiffMock()),
    'admin/report-diff.json': JSON.stringify(reportsDiffAltMock()),
    'website/report-diff.json': JSON.stringify(reportsDiffUnchangedMock()),
    'docs/report-diff.json': JSON.stringify(reportsDiffAddedPluginMock()),
  };
  const files = Object.keys(diffPaths);
  const persistConfig: Required<PersistConfig> = {
    outputDir: MEMFS_VOLUME,
    filename: 'report',
    format: ['json', 'md'],
  };

  beforeEach(() => {
    vol.fromJSON(diffPaths, MEMFS_VOLUME);
  });

  it('should create Markdown file', async () => {
    const outputPath = await mergeDiffs(files, persistConfig);

    expect(outputPath).toBe(join(MEMFS_VOLUME, 'report-diff.md'));
    await expect(fileExists(outputPath)).resolves.toBe(true);
    await expect(readFile(outputPath, 'utf8')).resolves.toContain(
      '# Code PushUp',
    );
  });

  it('should use parent folder as project name in Markdown output if label missing in diff', async () => {
    const outputPath = await mergeDiffs(files, persistConfig);

    const markdown = await readFile(outputPath, 'utf8');
    // `website` is unchanged, therefore not mentioned by name
    expect(markdown).toContain('## 💼 Project `console`');
    expect(markdown).toContain('## 💼 Project `admin`');
    expect(markdown).toContain('## 💼 Project `docs`');
  });

  it('should log warnings if file parsing failed', async () => {
    vol.fromJSON(
      { ...diffPaths, 'invalid-report-diff.json': '{}' },
      MEMFS_VOLUME,
    );

    await expect(
      mergeDiffs(
        [...files, 'missing-report-diff.json', 'invalid-report-diff.json'],
        persistConfig,
      ),
    ).resolves.toBe(join(MEMFS_VOLUME, 'report-diff.md'));

    expect(getLogMessages(ui().logger)).toEqual([
      expect.stringContaining(
        'Failed to parse report diff file - Error: ENOENT: no such file or directory',
      ),
      expect.stringMatching(
        /Failed to parse report diff file - .*invalid_type.*Required/s,
      ),
    ]);
  });
});
