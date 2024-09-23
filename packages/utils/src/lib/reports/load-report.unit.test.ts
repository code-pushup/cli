import { vol } from 'memfs';
import type { Report } from '@code-pushup/models';
import { MEMFS_VOLUME, REPORT_MOCK, reportMock } from '@code-pushup/test-utils';
import { loadReport } from './load-report';

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
      }),
    ).rejects.toThrow('slug has to follow the pattern');
  });
});
