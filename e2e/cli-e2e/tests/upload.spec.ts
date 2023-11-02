import { join } from 'path';
import { beforeEach, describe, expect, vi } from 'vitest';
import { executeProcess } from '@code-pushup/utils';
import { createMockServer } from '../mocks/create-mock-server';

describe('CLI upload', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should throw error if no report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [join('..', '..', 'dist', 'packages', 'cli'), 'upload'],
      cwd: 'examples/react-todos-app',
    }).catch(error => error);

    expect(code).toBe(1);
    expect(stderr).toMatchSnapshot();
  });

  it('should throw error if no server url', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        join('..', '..', 'dist', 'packages', 'cli'),
        'upload',
        '--no-progress',
        '--persist.outputDir',
        '../../e2e/cli-e2e/mocks',
      ],
      cwd: 'examples/react-todos-app',
    }).catch(error => error);

    expect(code).toBe(1);
    expect(stderr).toMatchSnapshot();
  });

  it('should upload report.json', async () => {
    expect.assertions(5);

    const { server, requestListener, requestBody } = await createMockServer();

    const { code, stderr } = await executeProcess({
      command: 'node',
      args: [
        join('..', '..', 'dist', 'packages', 'cli'),
        'upload',
        '--no-progress',
        '--persist.outputDir',
        '../../e2e/cli-e2e/mocks',
        '--upload.server',
        'http://localhost:8080/graphql',
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    expect(requestListener).toHaveBeenCalledTimes(1);
    expect(requestListener).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/graphql',
        method: 'POST',
      }),
      expect.anything(),
    );

    const report = await requestBody.promise;

    expect(report).toStrictEqual({
      operationName: 'saveReport',
      query: expect.any(String),
      variables: {
        categories: [],
        commandDuration: 578,
        commandStartDate: '2023-11-02T20:21:43.699Z',
        commit: expect.any(String),
        packageName: '@code-pushup/core',
        packageVersion: '0.0.1',
        plugins: [],
      },
    });

    server.close();
  });
});
