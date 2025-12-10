import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { uploadReportToPortal } from '@code-pushup/portal-client';
import { MINIMAL_REPORT_MOCK } from '@code-pushup/test-fixtures';
import { ISO_STRING_REGEXP, MEMFS_VOLUME } from '@code-pushup/test-utils';
import { upload } from './upload.js';

describe('upload', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'report.json': JSON.stringify(MINIMAL_REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );
  });

  it('should call upload with correct data', async () => {
    await expect(
      upload({
        upload: {
          apiKey: 'dummy-api-key',
          server: 'https://example.com/api',
          organization: 'code-pushup',
          project: 'cli',
        },
        persist: {
          outputDir: MEMFS_VOLUME,
          filename: 'report',
          format: ['json'],
          skipReports: false,
        },
      }),
    ).resolves.toBeUndefined();

    expect(uploadReportToPortal).toHaveBeenCalledWith<
      Parameters<typeof uploadReportToPortal>
    >({
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
      data: {
        commandStartDate: expect.stringMatching(ISO_STRING_REGEXP),
        commandDuration: expect.any(Number),
        categories: expect.any(Array),
        plugins: expect.any(Array),
        packageName: '@code-pushup/core',
        packageVersion: expect.any(String),
        organization: 'code-pushup',
        project: 'cli',
        commit: expect.any(String),
      },
    });
  });
});
