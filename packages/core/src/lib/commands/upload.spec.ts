// eslint-disable-next-line @typescript-eslint/no-var-requires
import {beforeEach, describe, vi} from 'vitest';
import {MEMFS_VOLUME, mockPersistConfig, mockReport, mockUploadConfig,} from '@code-pushup/models/testing';
import {join} from 'path';
import {vol} from 'memfs';
import {upload} from './upload';
import {ReportFragment} from '@code-pushup/portal-client/portal-client/src/lib/graphql/generated';
import {PortalUploadArgs} from '@code-pushup/portal-client/portal-client/src/lib/portal-upload';

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
    const passedArgs: PortalUploadArgs[] = [];
    const uploadFn = vi.fn((args: PortalUploadArgs) => {
      passedArgs.push(args);
      return Promise.resolve({
        data: args.data,
      } as unknown as ReportFragment);
    });

    const cfg = {
      upload: mockUploadConfig({
        apiKey: 'dummy-api-key',
        server: 'https://example.com/api',
      }),
      persist: mockPersistConfig({
        outputPath,
      }),
    };
    const result = await upload(cfg, uploadFn);
    // @TODO use haveBeenCalledWith
    expect(passedArgs?.[0]?.data.project).toBe('cli');
    expect(result.data.plugins).toMatchSnapshot();
    // expect(console.log).toHaveBeenCalledWith('Upload Succeeded!'); @TODO
  });
});
