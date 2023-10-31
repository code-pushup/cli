import { vol } from 'memfs';
import { join } from 'path';
import { afterEach, beforeEach, describe, vi } from 'vitest';
import { ReportFragment } from '@code-pushup/portal-client';
import { reportNameFromReport } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  persistConfig,
  report,
  uploadConfig,
} from '@code-pushup/models/testing';
import { FileResult } from '@code-pushup/utils';
import { mockConsole, unmockConsole } from '../../test';
import { upload } from './upload';

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
const filename = reportNameFromReport({ date: new Date().toISOString() });
const reportPath = (format: 'json' | 'md' = 'json') =>
  join(outputDir, `${filename}.${format}`);

let logs: string[] = [];
const resetFiles = async (fileContent?: Record<string, string>) => {
  vol.reset();
  vol.fromJSON(fileContent || {}, MEMFS_VOLUME);
};
const setupConsole = async () => {
  logs = [];
  mockConsole(msg => logs.push(msg));
};
const teardownConsole = async () => {
  logs = [];
  unmockConsole();
};

describe('uploadToPortal', () => {
  beforeEach(async () => {
    setupConsole();
    resetFiles({ [reportPath()]: JSON.stringify(report()) });
  });

  afterEach(() => {
    teardownConsole();
    resetFiles();
  });

  test('should work', async () => {
    const cfg = {
      upload: uploadConfig({
        apiKey: 'dummy-api-key',
        server: 'https://example.com/api',
      }),
      persist: persistConfig({ outputDir, filename }),
    };
    const result = await upload(cfg);
    // loadedReports
    expect(result.length).toBe(1);
    expect(result?.[0]?.status).toBe('fulfilled');
    expect((result?.[0] as PromiseFulfilledResult<FileResult>).value[0]).toBe(
      `${filename}.json`,
    );
    // logMultipleFileResults
    expect(logs.length).toBe(2);
    expect(logs[0]).toContain('Uploaded reports');
    expect(logs[1]).toContain(filename);
  });

  // @TODO add tests for failed upload
  // @TODO add tests for multiple uploads
});
