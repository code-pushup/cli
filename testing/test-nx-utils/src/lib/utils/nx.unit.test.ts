import { readJson } from '@nx/plugin/testing';
import { readNxJson } from 'nx/src/config/nx-json';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import * as process from 'process';
import { describe, expect } from 'vitest';
import { executorContext, registerPluginInWorkspace } from './nx';

describe('executorContext', () => {
  it('should create context for given project name', () => {
    expect(executorContext('my-lib')).toStrictEqual({
      cwd: process.cwd(),
      isVerbose: false,
      projectName: 'my-lib',
      projectsConfigurations: {
        projects: {
          'my-lib': {
            name: 'my-lib',
            root: 'libs/my-lib',
          },
        },
        version: 1,
      },
      root: '.',
    });
  });

  it('should create context for given project options', () => {
    expect(
      executorContext({ projectName: 'other-lib', cwd: '<CWD>' }),
    ).toStrictEqual({
      cwd: '<CWD>',
      isVerbose: false,
      projectName: 'other-lib',
      projectsConfigurations: {
        projects: {
          'other-lib': {
            name: 'other-lib',
            root: 'libs/other-lib',
          },
        },
        version: 1,
      },
      root: '.',
    });
  });
});

describe('registerPluginInWorkspace', () => {
  it('should register plugin name in workspace', () => {
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    registerPluginInWorkspace(tree, 'nx-plugin');

    const nxJson = JSON.parse(tree.read('nx.json')?.toString() ?? '{}');
    expect(nxJson).toStrictEqual(
      expect.objectContaining({
        plugins: [
          {
            plugin: 'nx-plugin',
          },
        ],
      }),
    );
  });

  it('should register plugin config in workspace', () => {
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    registerPluginInWorkspace(tree, {
      plugin: 'ts-plugin',
      options: { key: 'value' },
    });

    const nxJson = JSON.parse(tree.read('nx.json')?.toString() ?? '{}');
    expect(nxJson).toStrictEqual(
      expect.objectContaining({
        plugins: [
          {
            plugin: 'ts-plugin',
            options: { key: 'value' },
          },
        ],
      }),
    );
  });
});
