// eslint-disable-next-line @typescript-eslint/no-var-requires
import {beforeEach, describe, vi} from 'vitest';
import {CommandBaseOptions} from '../implementation/model';
import {commandBaseOptionsMock} from '../../../test/base.command.mock';
import {MEMFS_VOLUME, mockReport} from '@code-pushup/models/testing';
import {join} from 'path';
import {vol} from 'memfs';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputPath = MEMFS_VOLUME;
const reportPath = (path = 'test', format: 'json' | 'md' = 'json') =>
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
    const cfg: CommandBaseOptions = commandBaseOptionsMock();
    cfg.persist.outputPath = '/test';
    type ENV = {
      API_KEY: string;
      SERVER: string;
      PROJECT: string;
      ORGANIZATION: string;
    };
    const {
      API_KEY: apiKey,
      SERVER: server,
      PROJECT: project,
      ORGANIZATION: organization,
    } = process.env as ENV;

    // const result = await upload(cfg);

    // expect(result.project.slug).toBe('cli');
  });
});
