import * as process from 'node:process';
import { describe, expect } from 'vitest';
import {
  createNodesContextV1,
  createNodesContextV2,
  invokeCreateNodesOnVirtualFilesV1,
  invokeCreateNodesOnVirtualFilesV2,
} from './nx-plugin.js';

describe('V1', () => {
  describe('createNodesContextV1', () => {
    it('should return a context with the provided options', () => {
      const context = createNodesContextV1({
        workspaceRoot: 'root',
        nxJsonConfiguration: { plugins: [] },
      });
      expect(context).toEqual({
        workspaceRoot: 'root',
        nxJsonConfiguration: { plugins: [] },
        configFiles: [],
      });
    });

    it('should return a context with defaults', () => {
      const context = createNodesContextV1();
      expect(context).toEqual({
        workspaceRoot: process.cwd(),
        nxJsonConfiguration: {},
        configFiles: [],
      });
    });
  });

  describe('invokeCreateNodesOnVirtualFilesV1', () => {
    it('should invoke passed function if matching file is given', async () => {
      const createNodesFnSpy = vi
        .fn()
        .mockResolvedValue({ projects: { 'my-lib': {} } });
      await expect(
        invokeCreateNodesOnVirtualFilesV1(
          [`**/project.json`, createNodesFnSpy],
          createNodesContextV1(),
          {},
          {
            matchingFilesData: {
              '**/project.json': JSON.stringify({
                name: 'my-lib',
              }),
            },
          },
        ),
      ).resolves.toStrictEqual({ 'my-lib': {} });
      expect(createNodesFnSpy).toHaveBeenCalledTimes(1);
      expect(createNodesFnSpy).toHaveBeenCalledWith(
        '**/project.json',
        {},
        expect.any(Object),
      );
    });

    it('should NOT invoke passed function if matching file is NOT given', async () => {
      const createNodesFnSpy = vi.fn().mockResolvedValue({});
      await expect(
        invokeCreateNodesOnVirtualFilesV1(
          [`**/project.json`, createNodesFnSpy],
          createNodesContextV1(),
          {},
          { matchingFilesData: {} },
        ),
      ).resolves.toStrictEqual({});
      expect(createNodesFnSpy).not.toHaveBeenCalled();
    });
  });
});

describe('V2', () => {
  describe('createNodesContext', () => {
    it('should return a context with the provided options', () => {
      const context = createNodesContextV2({
        workspaceRoot: 'root',
        nxJsonConfiguration: { plugins: [] },
      });
      expect(context).toEqual({
        workspaceRoot: 'root',
        nxJsonConfiguration: { plugins: [] },
      });
    });

    it('should return a context with defaults', () => {
      const context = createNodesContextV2();
      expect(context).toEqual({
        workspaceRoot: process.cwd(),
        nxJsonConfiguration: {},
      });
    });
  });

  describe('invokeCreateNodesOnVirtualFilesV2', () => {
    it('should invoke passed function if matching file is given', async () => {
      const createNodesFnSpy = vi
        .fn()
        .mockResolvedValue([
          ['**/project.json', { projects: { 'my-lib': {} } }],
        ]);

      await expect(
        invokeCreateNodesOnVirtualFilesV2(
          [`**/project.json`, createNodesFnSpy],
          createNodesContextV2(),
          {},
          {
            matchingFilesData: {
              '**/project.json': JSON.stringify({
                name: 'my-lib',
              }),
            },
          },
        ),
      ).resolves.toStrictEqual({ 'my-lib': {} });

      expect(createNodesFnSpy).toHaveBeenCalledTimes(1);
      expect(createNodesFnSpy).toHaveBeenCalledWith(
        ['**/project.json'],
        {},
        expect.any(Object),
      );
    });

    it('should NOT invoke passed function if matching file is NOT given', async () => {
      const createNodesFnSpy = vi.fn().mockResolvedValue([]);
      await expect(
        invokeCreateNodesOnVirtualFilesV2(
          [`**/project.json`, createNodesFnSpy],
          createNodesContextV2(),
          {},
          { matchingFilesData: {} },
        ),
      ).resolves.toStrictEqual({});
      expect(createNodesFnSpy).toHaveBeenCalledTimes(1);
      expect(createNodesFnSpy).toHaveBeenCalledWith([], {}, expect.any(Object));
    });
  });
});
