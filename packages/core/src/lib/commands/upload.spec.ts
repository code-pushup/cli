// eslint-disable-next-line @typescript-eslint/no-var-requires
import {beforeEach, describe, vi} from 'vitest';
import {MEMFS_VOLUME, mockPersistConfig, mockReport, mockUploadConfig} from '@code-pushup/models/testing';
import {join} from 'path';
import {vol} from 'memfs';
import {upload} from "@code-pushup/core";
import {ENV} from "../../../test/types";
import {unknown} from "zod";
import {ReportFragment} from "@code-pushup/portal-client/portal-client/src/lib/graphql/generated";
import {PortalUploadArgs} from "@code-pushup/portal-client/portal-client/src/lib/portal-upload";

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputPath = MEMFS_VOLUME;
const reportPath = (path = MEMFS_VOLUME, format: 'json' | 'md' = 'json') =>
  join(outputPath, 'report.' + format);

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
      } as unknown as ReportFragment)
    });
    const env = process.env as ENV;
    const cfg = {
      upload: mockUploadConfig({
        apiKey: env.API_KEY,
        server: env.SERVER,
      }),
      persist: mockPersistConfig({
        outputPath
      })
    };
    const result = await upload(cfg, uploadFn);

    expect(passedArgs?.[0]?.data.project).toBe('cli');
    expect(result).toMatchSnapshot();
  });
});
