// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
import {beforeEach, describe, expect, Mock, vi} from 'vitest';
import {upload} from './upload';
import {CommandBaseOptions} from "../implementation/model";
import {commandBaseOptionsMock} from "../../../test/base.command.mock";
import {MEMFS_VOLUME, mockReport} from "@quality-metrics/models/testing";
import {join} from "path";
import {vol} from "memfs";

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
const reportPath = (path = "test", format: 'json' | 'md' = 'json') =>
  join(outputPath, 'report.' + format);

describe('uploadToPortal', () => {
  beforeEach(async () => {
    vol.reset();
    vol.fromJSON(
      {
        [reportPath()]: JSON.stringify(mockReport())
      },
      MEMFS_VOLUME,
    );
  });

  test('should send GraphQL request', async () => {
    const cfg: CommandBaseOptions = commandBaseOptionsMock();
    cfg.persist.outputPath = "/test";
    type ENV = { API_KEY: string, SERVER: string, PROJECT: string, ORGANIZATION: string };
    //const {API_KEY: apiKey, SERVER: server, PROJECT: project, ORGANIZATION: organization} = process.env as ENV;

    cfg.upload = {
      apiKey: 'qm_11d5e67521ce4960e4413216dbac498428f217105013ed67ffe986a57735d143',
      server: 'https://portal-api-r6nh2xm7mq-ez.a.run.app/graphql',
      project: 'cli',
      organization: 'code-pushup',
    };
    console.log('upload', cfg.upload);
    const result = await upload(cfg);

    expect(result).toBe('s');

  });
});
