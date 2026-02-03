import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { executorContext, registerPluginInWorkspace } from './nx.js';

describe('executorContext', () => {
  it('should create context for given project name', () => {
    expect(executorContext('my-lib')).toStrictEqual({
      cwd: MEMFS_VOLUME,
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
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
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
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
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

  it('should register pluginsConfig when provided', () => {
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    registerPluginInWorkspace(
      tree,
      {
        plugin: '@code-pushup/nx-plugin',
        options: { targetName: 'code-pushup' },
      },
      {
        projectPrefix: 'cli',
        bin: 'packages/cli/src/index.ts',
      },
    );

    const nxJson = JSON.parse(tree.read('nx.json')?.toString() ?? '{}');
    expect(nxJson).toStrictEqual(
      expect.objectContaining({
        plugins: [
          {
            plugin: '@code-pushup/nx-plugin',
            options: { targetName: 'code-pushup' },
          },
        ],
        pluginsConfig: {
          '@code-pushup/nx-plugin': {
            projectPrefix: 'cli',
            bin: 'packages/cli/src/index.ts',
          },
        },
      }),
    );
  });
});
