import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, vi } from 'vitest';
import { ReportFragment } from '@code-pushup/portal-client';
import {
  MEMFS_VOLUME,
  persistConfig,
  report,
  uploadConfig,
} from '@code-pushup/models/testing';
import { UploadOptions, upload } from './upload';

// This in needed to mock the API client used inside the upload function
vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async () => ({ packageName: 'dummy-package' } as ReportFragment),
    ),
  };
});

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputDir = MEMFS_VOLUME;
const reportPath = (path = outputDir, format: 'json' | 'md' = 'json') =>
  join(path, 'report.' + format);

describe('uploadToPortal', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON(
      {
        [reportPath()]: JSON.stringify(report()),
      },
      MEMFS_VOLUME,
    );
  });

  it('should work', async () => {
    const cfg: UploadOptions = {
      verbose: false,
      progress: false,
      upload: uploadConfig({
        apiKey: 'dummy-api-key',
        server: 'https://example.com/api',
      }),
      persist: persistConfig({ outputDir }),
    };
    const result = await upload(cfg);

    expect(result.packageName).toBe('dummy-package');
  });

  // @TODO add tests for failed upload
  // @TODO add tests for multiple uploads
});
