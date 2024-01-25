import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { vi } from 'vitest';
import {
  PortalUploadArgs,
  ReportFragment,
  uploadToPortal,
} from '@code-pushup/portal-client';
import {
  ISO_STRING_REGEXP,
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/testing-utils';
import { upload } from './upload';

vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async () => ({ packageName: '@code-pushup/cli' } as ReportFragment),
    ),
  };
});

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
