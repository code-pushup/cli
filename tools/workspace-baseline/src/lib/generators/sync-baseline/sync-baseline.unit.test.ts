import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { syncBaseline } from './sync-baseline.js';

describe('sync-baseline generator', () => {
  const createProjectGraphAsyncSpy = vi.spyOn(
    devkit,
    'createProjectGraphAsync',
  );
  let tree: devkit.Tree;
  const projectName = 'test';
  const projectRoot = `libs/${projectName}`;
  const tsconfigLibPath = path.join(projectRoot, 'tsconfig.lib.json');
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(tsconfigLibPath, JSON.stringify({}));
    createProjectGraphAsyncSpy.mockResolvedValue({
      nodes: {
        [projectName]: {
          name: projectName,
          type: 'lib',
          data: {
            root: projectRoot,
            targets: {},
            tags: [],
          },
        },
      },
      dependencies: {},
    });
  });

  afterEach(() => {
    createProjectGraphAsyncSpy.mockReset();
  });

  it('should return empty object when tsconfig is in sync', async () => {
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        extends: './tsconfig.base.json',
        compilerOptions: {
          strict: true,
          noEmit: true,
        },
        include: ['src/**/*.ts', 'tests/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      }),
    );

    const result = await syncBaseline(tree);

    expect(result).toStrictEqual({});
  });

  it('should return outOfSyncMessage when tsconfig needs updates', async () => {
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        compilerOptions: {},
      }),
    );

    const result = await syncBaseline(tree);

    expect(result.outOfSyncMessage).toBeDefined();
    expect(result.outOfSyncMessage).toContain('tsconfig out of sync');
    expect(result.outOfSyncMessage).toContain(projectName);
  });

  it('should handle multiple projects', async () => {
    const projectName2 = 'test2';
    const projectRoot2 = `libs/${projectName2}`;
    const tsconfigLibPath2 = path.join(projectRoot2, 'tsconfig.lib.json');

    tree.write(tsconfigLibPath2, JSON.stringify({}));
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        compilerOptions: {},
      }),
    );

    createProjectGraphAsyncSpy.mockResolvedValue({
      nodes: {
        [projectName]: {
          name: projectName,
          type: 'lib',
          data: {
            root: projectRoot,
            targets: {},
            tags: [],
          },
        },
        [projectName2]: {
          name: projectName2,
          type: 'lib',
          data: {
            root: projectRoot2,
            targets: {},
            tags: [],
          },
        },
      },
      dependencies: {},
    });

    const result = await syncBaseline(tree);

    expect(result.outOfSyncMessage).toBeDefined();
    expect(result.outOfSyncMessage).toContain(projectName);
    expect(result.outOfSyncMessage).toContain(projectName2);
  });

  it('should handle missing tsconfig files gracefully', async () => {
    tree.delete(tsconfigLibPath);
    tree.write(tsconfigPath, JSON.stringify({}));

    const result = await syncBaseline(tree);

    // Should still process and potentially update tsconfig.json
    expect(result).toBeDefined();
  });

  it('should update tsconfig files when out of sync', async () => {
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        compilerOptions: {},
      }),
    );

    await syncBaseline(tree);

    const updated = JSON.parse(tree.read(tsconfigLibPath)?.toString() ?? '{}');
    expect(updated.extends).toBe('./tsconfig.base.json');
    expect(updated.compilerOptions?.strict).toBe(true);
    expect(updated.compilerOptions?.noEmit).toBe(true);
    expect(updated.include).toContain('src/**/*.ts');
    expect(updated.exclude).toContain('node_modules');
  });
});
