import { join } from 'path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { executeProcess } from '@code-pushup/utils';
import { createMockServer } from '../mocks/create-mock-server';
import { cleanFolderPutGitKeep } from '../mocks/fs.mock';

describe('CLI port', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    cleanFolderPutGitKeep();
  });

  afterEach(() => {
    cleanFolderPutGitKeep();
  });

  it('should collect and upload report.json', async () => {
    expect.assertions(5);

    const { server, requestListener, requestBody, port } =
      await createMockServer();

    const { code, stderr } = await executeProcess({
      command: 'node',
      args: [
        join('..', '..', 'dist', 'packages', 'cli'),
        'autorun',
        '--no-progress',
        '--upload.server',
        `http://localhost:${port}/graphql`,
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await requestBody.promise;

    expect(requestListener).toHaveBeenCalledTimes(1);
    expect(requestListener).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/graphql',
        method: 'POST',
      }),
      expect.anything(),
    );

    expect(report).toMatchObject({
      operationName: 'saveReport',
      query: expect.any(String),
      variables: {
        categories: expect.any(Array),
        commandDuration: expect.any(Number),
        commandStartDate: expect.any(String),
        commit: expect.any(String),
        packageName: '@code-pushup/core',
        packageVersion: '0.0.1',
        plugins: expect.any(Array),
      },
    });

    server.close();
  });
});
