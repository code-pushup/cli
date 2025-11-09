import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger } from '@code-pushup/utils';
import type { Settings } from './models.js';
import { saveOutputFiles } from './output-files.js';

describe('saveOutputFiles', () => {
  const settings: Pick<Settings, 'directory'> = {
    directory: MEMFS_VOLUME,
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        'report.json': '{ "score": 1 }',
        'report.md': '- score: **100**',
        'report-diff.json': '{ "scoreChange": -0.25 }',
        'report-diff.md': '- score change: **-25**',
        'merged-report-diff.md': '- backend: **-5**\n- frontend: **+10**',
      },
      MEMFS_VOLUME,
    );
  });

  it('should copy current report files', async () => {
    await expect(
      saveOutputFiles({
        project: null,
        type: 'current',
        files: {
          json: path.join(MEMFS_VOLUME, 'report.json'),
          md: path.join(MEMFS_VOLUME, 'report.md'),
        },
        settings,
      }),
    ).resolves.toEqual({
      json: path.join(MEMFS_VOLUME, '.code-pushup/.ci/.current/report.json'),
      md: path.join(MEMFS_VOLUME, '.code-pushup/.ci/.current/report.md'),
    });

    await expect(
      readFile(
        path.join(MEMFS_VOLUME, '.code-pushup/.ci/.current/report.json'),
        'utf8',
      ),
    ).resolves.toBe('{ "score": 1 }');
    await expect(
      readFile(
        path.join(MEMFS_VOLUME, '.code-pushup/.ci/.current/report.md'),
        'utf8',
      ),
    ).resolves.toBe('- score: **100**');
  });

  it('should copy comparison files', async () => {
    await expect(
      saveOutputFiles({
        project: null,
        type: 'comparison',
        files: {
          json: path.join(MEMFS_VOLUME, 'report-diff.json'),
          md: path.join(MEMFS_VOLUME, 'report-diff.md'),
        },
        settings,
      }),
    ).resolves.toEqual({
      json: path.join(
        MEMFS_VOLUME,
        '.code-pushup/.ci/.comparison/report-diff.json',
      ),
      md: path.join(
        MEMFS_VOLUME,
        '.code-pushup/.ci/.comparison/report-diff.md',
      ),
    });

    await expect(
      readFile(
        path.join(
          MEMFS_VOLUME,
          '.code-pushup/.ci/.comparison/report-diff.json',
        ),
        'utf8',
      ),
    ).resolves.toBe('{ "scoreChange": -0.25 }');
    await expect(
      readFile(
        path.join(MEMFS_VOLUME, '.code-pushup/.ci/.comparison/report-diff.md'),
        'utf8',
      ),
    ).resolves.toBe('- score change: **-25**');
  });

  it('should copy previous report.json file', async () => {
    await expect(
      saveOutputFiles({
        project: null,
        type: 'previous',
        files: {
          json: path.join(MEMFS_VOLUME, 'report.json'),
        },
        settings,
      }),
    ).resolves.toEqual({
      json: path.join(MEMFS_VOLUME, '.code-pushup/.ci/.previous/report.json'),
    });
  });

  it('should log copied file paths', async () => {
    await saveOutputFiles({
      project: null,
      type: 'current',
      files: {
        json: path.join(MEMFS_VOLUME, 'report.json'),
        md: path.join(MEMFS_VOLUME, 'report.md'),
      },
      settings,
    });

    expect(logger.debug).toHaveBeenCalledWith(
      `Copied current report from ${path.join(MEMFS_VOLUME, 'report.json')} to ${path.join(MEMFS_VOLUME, '.code-pushup/.ci/.current/report.json')}`,
    );
    expect(logger.debug).toHaveBeenCalledWith(
      `Copied current report from ${path.join(MEMFS_VOLUME, 'report.md')} to ${path.join(MEMFS_VOLUME, '.code-pushup/.ci/.current/report.md')}`,
    );
  });

  it("should copy project's current report files to project folder", async () => {
    await expect(
      saveOutputFiles({
        project: { name: 'api' },
        type: 'current',
        files: {
          json: path.join(MEMFS_VOLUME, 'report.json'),
          md: path.join(MEMFS_VOLUME, 'report.md'),
        },
        settings,
      }),
    ).resolves.toEqual({
      json: path.join(
        MEMFS_VOLUME,
        '.code-pushup/.ci/api/.current/report.json',
      ),
      md: path.join(MEMFS_VOLUME, '.code-pushup/.ci/api/.current/report.md'),
    });

    await expect(
      readFile(
        path.join(MEMFS_VOLUME, '.code-pushup/.ci/api/.current/report.json'),
        'utf8',
      ),
    ).resolves.toBe('{ "score": 1 }');
    await expect(
      readFile(
        path.join(MEMFS_VOLUME, '.code-pushup/.ci/api/.current/report.md'),
        'utf8',
      ),
    ).resolves.toBe('- score: **100**');
  });

  it("should copy project's comparison files to project folder", async () => {
    await expect(
      saveOutputFiles({
        project: { name: 'utils' },
        type: 'comparison',
        files: {
          json: path.join(MEMFS_VOLUME, 'report-diff.json'),
          md: path.join(MEMFS_VOLUME, 'report-diff.md'),
        },
        settings,
      }),
    ).resolves.toEqual({
      json: path.join(
        MEMFS_VOLUME,
        '.code-pushup/.ci/utils/.comparison/report-diff.json',
      ),
      md: path.join(
        MEMFS_VOLUME,
        '.code-pushup/.ci/utils/.comparison/report-diff.md',
      ),
    });

    await expect(
      readFile(
        path.join(
          MEMFS_VOLUME,
          '.code-pushup/.ci/utils/.comparison/report-diff.json',
        ),
        'utf8',
      ),
    ).resolves.toBe('{ "scoreChange": -0.25 }');
    await expect(
      readFile(
        path.join(
          MEMFS_VOLUME,
          '.code-pushup/.ci/utils/.comparison/report-diff.md',
        ),
        'utf8',
      ),
    ).resolves.toBe('- score change: **-25**');
  });

  it('should copy merged comparison markdown file', async () => {
    await expect(
      saveOutputFiles({
        project: null,
        type: 'comparison',
        files: {
          md: path.join(MEMFS_VOLUME, 'merged-report-diff.md'),
        },
        settings,
      }),
    ).resolves.toEqual({
      md: path.join(
        MEMFS_VOLUME,
        '.code-pushup/.ci/.comparison/report-diff.md',
      ),
    });

    await expect(
      readFile(
        path.join(MEMFS_VOLUME, '.code-pushup/.ci/.comparison/report-diff.md'),
        'utf8',
      ),
    ).resolves.toBe('- backend: **-5**\n- frontend: **+10**');
  });
});
