// eslint-disable-next-line @typescript-eslint/no-var-requires
import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, vi } from 'vitest';
import { ReportFragment } from '@code-pushup/portal-client';
import {
  MEMFS_VOLUME,
  mockPersistConfig,
  mockReport,
  mockUploadConfig,
} from '@code-pushup/models/testing';
import { upload } from './upload';

// This in needed to mock the API client used inside the upload function
vi.mock('@code-pushup/portal-client', async () => {
  const module: typeof import('@code-pushup/portal-client') =
    await vi.importActual('@code-pushup/portal-client');

  return {
    ...module,
    uploadToPortal: vi.fn(
      async () =>
        ({ data: { packageName: 'dummy-package' } } as {
          data: ReportFragment;
        }),
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

const outputPath = MEMFS_VOLUME;
const reportPath = (path = outputPath, format: 'json' | 'md' = 'json') =>
  join(path, 'report.' + format);

describe('uploadToPortal', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON(
      {
        [reportPath()]: JSON.stringify(mockReport()),
      },
      MEMFS_VOLUME,
    );
  });

  test('should work', async () => {
    const cfg = {
      upload: mockUploadConfig({
        apiKey: 'dummy-api-key',
        server: 'https://example.com/api',
      }),
      persist: mockPersistConfig({
        outputPath,
      }),
    };
    const result = (await upload(cfg)) as unknown as { data: ReportFragment };

    expect(result.data.packageName).toBe('dummy-package');
  });
});
