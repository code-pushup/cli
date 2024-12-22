import * as process from 'node:process';
import { describe, expect } from 'vitest';
import { createNodesContext } from './nx-plugin';
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
    expect(context).toEqual({
      workspaceRoot: 'root',
      nxJsonConfiguration: { plugins: [] },
    });
  });

  it('should return a context with defaults', () => {
    const context = createNodesContext();
    expect(context).toEqual({
      workspaceRoot: process.cwd(),
      nxJsonConfiguration: {},
    });
  });
});
