import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { uploadReportToPortal } from '@code-pushup/portal-client';
import {
  ISO_STRING_REGEXP,
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/test-utils';
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
    const result = await upload({
      progress: false,
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
      },
    });

    expect(result).toEqual({ url: expect.stringContaining('code-pushup/cli') });

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

  it('should throw for missing upload configuration', async () => {
    await expect(
      upload({
        progress: false,
        persist: {
          outputDir: MEMFS_VOLUME,
          filename: 'report',
          format: ['json'],
        },
        upload: undefined,
      }),
    ).rejects.toThrow('Upload configuration is not set.');
  });

  // @TODO add tests for failed upload
  // @TODO add tests for multiple uploads
});
