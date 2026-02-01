import { vol } from 'memfs';
import type { Report } from '@code-pushup/models';
import { REPORT_MOCK, reportMock } from '@code-pushup/test-fixtures';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { loadReport } from './load-report.js';

describe('loadReport', () => {
  it('should load a valid JSON report', async () => {
    vol.fromJSON(
      {
        [`report.json`]: JSON.stringify(reportMock()),
        [`report.md`]: 'test-42',
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadReport({
        outputDir: MEMFS_VOLUME,
        filename: 'report',
        format: 'json',
        skipReports: false,
      }),
    ).resolves.toEqual(reportMock());
  });

  it('should load a markdown file', async () => {
    vol.fromJSON(
      {
        [`report.dummy.md`]: 'test-7',
        [`report.json`]: '{"test":42}',
        [`report.md`]: 'test-42',
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadReport({
        outputDir: MEMFS_VOLUME,
        format: 'md',
        filename: 'report',
        skipReports: false,
      }),
    ).resolves.toBe('test-42');
  });

  it('should throw for an invalid JSON report', async () => {
    vol.fromJSON(
      {
        [`report.json`]: JSON.stringify({
          ...REPORT_MOCK,
          plugins: [{ ...REPORT_MOCK.plugins[0]!, slug: '-Invalid_slug' }],
        } satisfies Report),
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadReport({
        outputDir: MEMFS_VOLUME,
        filename: 'report',
        format: 'json',
        skipReports: false,
      }),
    ).rejects.toThrow('slug has to follow the pattern');
  });
});
