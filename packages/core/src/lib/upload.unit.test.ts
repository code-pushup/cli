import { vol } from 'memfs';
import { describe } from 'vitest';
import { PortalUploadArgs, uploadToPortal } from '@code-pushup/portal-client';
import { MEMFS_VOLUME } from '@code-pushup/models/testing';
import {
  ISO_STRING_REGEXP,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/testing-utils';
import { upload } from './upload';

describe('upload', () => {
  it('upload should be called with correct data', async () => {
    vol.fromJSON(
      {
        'report.json': JSON.stringify(MINIMAL_REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );

    const result = await upload({
      verbose: false,
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

    expect(result).toEqual({ packageName: '@code-pushup/cli' });

    expect(uploadToPortal).toHaveBeenCalledWith({
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
    } satisfies PortalUploadArgs);
  });

  // @TODO add tests for failed upload
  // @TODO add tests for multiple uploads
});
