// eslint-disable-next-line @typescript-eslint/no-var-requires
import { beforeEach, describe, expect, Mock, vi } from 'vitest';
import { upload } from './upload';
import { CommandBaseOptions } from '../implementation/model';
import { commandBaseOptionsMock } from '../../../test/base.command.mock';
import { MEMFS_VOLUME, mockReport } from '@code-pushup/models/testing';
import { join } from 'path';
import { vol } from 'memfs';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});
let mockRequest: Mock;

vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn(function () {
    mockRequest = vi.fn().mockResolvedValue({
      saveReport: {
        plugins: [
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            icon: 'lighthouse',
          },
        ],
        audits: {
          edges: [
            {
              node: {
                slug: 'largest-contentful-paint',
                title: 'Largest Contentful Paint',
                score: 0.81,
                value: 1491,
                formattedValue: '1.5 s',
              },
            },
          ],
        },
      },
    });
    return {
      request: mockRequest,
    };
  }),
}));

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

  test('should send GraphQL request', async () => {
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
