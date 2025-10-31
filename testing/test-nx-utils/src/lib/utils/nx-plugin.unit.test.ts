import { describe, expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  createNodesContext,
  invokeCreateNodesOnVirtualFiles,
} from './nx-plugin.js';

describe('createNodesContext', () => {
  it('should return a context with the provided options', () => {
    const context = createNodesContext({
      workspaceRoot: 'root',
      nxJsonConfiguration: { plugins: [] },
    });
    expect(context).toStrictEqual(
      expect.objectContaining({
        workspaceRoot: 'root',
        nxJsonConfiguration: { plugins: [] },
      }),
    );
  });

  it('should return a context with defaults', () => {
    const context = createNodesContext();
    expect(context).toStrictEqual(
      expect.objectContaining({
        workspaceRoot: MEMFS_VOLUME,
        nxJsonConfiguration: {},
      }),
    );
  });
});

describe('invokeCreateNodesOnVirtualFiles', () => {
  it('should invoke passed function if matching file is given', async () => {
    const createNodesFnSpy = vi.fn().mockResolvedValue({});
    await expect(
      invokeCreateNodesOnVirtualFiles(
        [`**/project.json`, createNodesFnSpy],
        createNodesContext(),
        {},
        {
          matchingFilesData: {
            '**/project.json': JSON.stringify({
              name: 'my-lib',
            }),
          },
        },
      ),
    ).resolves.toStrictEqual({});
    expect(createNodesFnSpy).toHaveBeenCalledTimes(1);
  });

  it('should NOT invoke passed function if matching file is NOT given', async () => {
    const createNodesFnSpy = vi.fn().mockResolvedValue({});
    await expect(
      invokeCreateNodesOnVirtualFiles(
        [`**/project.json`, createNodesFnSpy],
        createNodesContext(),
        {},
        { matchingFilesData: {} },
      ),
    ).resolves.toStrictEqual({});
    expect(createNodesFnSpy).not.toHaveBeenCalled();
  });
});
