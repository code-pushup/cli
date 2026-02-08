import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { createJsonBaseline } from '../../baseline/baseline.json';
import type { BaselineConfig } from '../../baseline/baseline.json';
import { object } from '../../baseline/baseline.json';
import { loadBaselineRc } from './load-baseline-rc';
import { syncBaseline } from './sync-baseline';

vi.mock('./load-baseline-rc', async () => {
  const actual =
    await vi.importActual<typeof import('./load-baseline-rc')>(
      './load-baseline-rc',
    );
  return {
    ...actual,
    loadBaselineRc: vi.fn(),
  };
});

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

  beforeEach(async () => {
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
    // Restore original implementation for non-tag-filtering tests
    const actual =
      await vi.importActual<typeof import('./load-baseline-rc')>(
        './load-baseline-rc',
      );
    vi.mocked(loadBaselineRc).mockImplementation(actual.loadBaselineRc);
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

  it('should handle missing tsconfig files gracefully', async () => {
    tree.delete(tsconfigLibPath);
    tree.write(tsconfigPath, JSON.stringify({}));

    const result = await syncBaseline(tree);

    // Should still process and potentially update tsconfig.json
    expect(result).toBeDefined();
  });

  describe('tag filtering', () => {
    beforeEach(() => {
      vi.mocked(loadBaselineRc).mockReset();
    });

    it('should skip baseline when project has no matching tags', async () => {
      const baselineWithTags: BaselineConfig = createJsonBaseline(
        'tsconfig.lib.json',
        {
          tags: ['tsc-bae'],
          compilerOptions: object.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithTags]);

      createProjectGraphAsyncSpy.mockResolvedValue({
        nodes: {
          [projectName]: {
            name: projectName,
            type: 'lib',
            data: {
              root: projectRoot,
              targets: {},
              tags: ['other-tag'],
            },
          },
        },
        dependencies: {},
      });

      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      // Should not apply baseline, so no diagnostics
      expect(result).toStrictEqual({});
    });
  });

  describe('file renaming', () => {
    beforeEach(() => {
      vi.mocked(loadBaselineRc).mockReset();
    });

    it('should overwrite target file if it already exists when renaming', async () => {
      const tsconfigSpecPath = path.join(projectRoot, 'tsconfig.spec.json');
      const tsconfigTestPath = path.join(projectRoot, 'tsconfig.test.json');

      const baselineWithRename: BaselineConfig = createJsonBaseline(
        'tsconfig.test.json',
        {
          renameFrom: 'tsconfig.spec.json',
          compilerOptions: object.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithRename]);

      // Create both files
      tree.write(
        tsconfigSpecPath,
        JSON.stringify({
          compilerOptions: { module: 'ESNext' },
        }),
      );
      tree.write(
        tsconfigTestPath,
        JSON.stringify({
          compilerOptions: { module: 'CommonJS' },
        }),
      );

      await syncBaseline(tree);

      // Spec file should be deleted
      expect(tree.exists(tsconfigSpecPath)).toBe(false);
      // Test file should exist and be overwritten with spec content
      expect(tree.exists(tsconfigTestPath)).toBe(true);

      const renamedContent = JSON.parse(
        tree.read(tsconfigTestPath)?.toString() ?? '{}',
      );
      // Should have content from spec file (not the old test file)
      expect(renamedContent.compilerOptions?.module).toBe('ESNext');
      expect(renamedContent.compilerOptions?.strict).toBe(true);
    });

    it('should not rename if renameFrom pattern does not match', async () => {
      const tsconfigTestPath = path.join(projectRoot, 'tsconfig.test.json');

      const baselineWithRename: BaselineConfig = createJsonBaseline(
        'tsconfig.test.json',
        {
          renameFrom: 'tsconfig.spec.json',
          compilerOptions: object.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithRename]);

      // Create test file directly (no spec file)
      tree.write(
        tsconfigTestPath,
        JSON.stringify({
          compilerOptions: {},
        }),
      );

      await syncBaseline(tree);

      // Test file should still exist and be updated
      expect(tree.exists(tsconfigTestPath)).toBe(true);
      const content = JSON.parse(
        tree.read(tsconfigTestPath)?.toString() ?? '{}',
      );
      expect(content.compilerOptions?.strict).toBe(true);
    });
  });
});
