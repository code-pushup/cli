import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import {
  createTsconfigBase,
  createTsconfigFormatter,
} from '../../baseline.tsconfig';
import type { TsBase } from '../../baseline.tsconfig';
import { obj } from '../../baseline.tsconfig';
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

  describe('tag filtering', () => {
    beforeEach(() => {
      vi.mocked(loadBaselineRc).mockReset();
    });

    it('should apply baseline when project has matching tag', async () => {
      const baselineWithTags: TsBase = createTsconfigBase('tsconfig.lib.json', {
        tags: ['tsc-bae'],
        compilerOptions: obj.add({
          strict: true,
        }),
      });

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithTags]);

      createProjectGraphAsyncSpy.mockResolvedValue({
        nodes: {
          [projectName]: {
            name: projectName,
            type: 'lib',
            data: {
              root: projectRoot,
              targets: {},
              tags: ['tsc-bae'],
            },
          },
        },
        dependencies: {},
      });

      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      expect(result.outOfSyncMessage).toBeDefined();
      expect(result.outOfSyncMessage).toContain(projectName);
    });

    it('should skip baseline when project has no matching tags', async () => {
      const baselineWithTags: TsBase = createTsconfigBase('tsconfig.lib.json', {
        tags: ['tsc-bae'],
        compilerOptions: obj.add({
          strict: true,
        }),
      });

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

    it('should apply baseline when no tags filter is specified', async () => {
      const baselineWithoutTags: TsBase = createTsconfigBase(
        'tsconfig.lib.json',
        {
          compilerOptions: obj.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithoutTags]);

      createProjectGraphAsyncSpy.mockResolvedValue({
        nodes: {
          [projectName]: {
            name: projectName,
            type: 'lib',
            data: {
              root: projectRoot,
              targets: {},
              tags: ['any-tag'],
            },
          },
        },
        dependencies: {},
      });

      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      // Should apply baseline even with different tags
      expect(result.outOfSyncMessage).toBeDefined();
      expect(result.outOfSyncMessage).toContain(projectName);
    });

    it('should apply baseline when project has ANY of the specified tags', async () => {
      const baselineWithMultipleTags: TsBase = createTsconfigBase(
        'tsconfig.lib.json',
        {
          tags: ['tsc-bae', 'tsc-nx-plugin'],
          compilerOptions: obj.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithMultipleTags]);

      createProjectGraphAsyncSpy.mockResolvedValue({
        nodes: {
          [projectName]: {
            name: projectName,
            type: 'lib',
            data: {
              root: projectRoot,
              targets: {},
              tags: ['tsc-nx-plugin'], // Only one matching tag
            },
          },
        },
        dependencies: {},
      });

      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      // Should apply baseline because project has at least one matching tag
      expect(result.outOfSyncMessage).toBeDefined();
      expect(result.outOfSyncMessage).toContain(projectName);
    });

    it('should group diagnostics by baseline type', async () => {
      const tsconfigLibBase: TsBase = createTsconfigBase('tsconfig.lib.json', {
        compilerOptions: obj.add({
          strict: true,
        }),
      });
      const tsconfigTestBase: TsBase = createTsconfigBase(
        'tsconfig.test.json',
        {
          compilerOptions: obj.add({
            types: ['vitest'],
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([
        tsconfigLibBase,
        tsconfigTestBase,
      ]);

      const tsconfigTestPath = path.join(projectRoot, 'tsconfig.test.json');
      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));
      tree.write(tsconfigTestPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      expect(result.outOfSyncMessage).toBeDefined();
      // Should contain section divider
      expect(result.outOfSyncMessage).toContain('---');
      // Should contain both baseline types
      expect(result.outOfSyncMessage).toContain('tsconfig.lib.json');
      expect(result.outOfSyncMessage).toContain('tsconfig.test.json');
    });

    it('should use baseline formatter when provided', async () => {
      const customFormatter = createTsconfigFormatter({ styling: 'minimal' });
      const baselineWithFormatter: TsBase = createTsconfigBase(
        'tsconfig.lib.json',
        {
          formatter: customFormatter,
          compilerOptions: obj.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithFormatter]);

      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      expect(result.outOfSyncMessage).toBeDefined();
      expect(result.outOfSyncMessage).toContain(projectName);
    });

    it('should use default formatter when baseline has no formatter', async () => {
      const baselineWithoutFormatter: TsBase = createTsconfigBase(
        'tsconfig.lib.json',
        {
          compilerOptions: obj.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithoutFormatter]);

      tree.write(tsconfigLibPath, JSON.stringify({ compilerOptions: {} }));

      const result = await syncBaseline(tree);

      expect(result.outOfSyncMessage).toBeDefined();
      expect(result.outOfSyncMessage).toContain('tsconfig out of sync');
    });
  });

  describe('file renaming', () => {
    beforeEach(() => {
      vi.mocked(loadBaselineRc).mockReset();
    });

    it('should rename file from renameFrom pattern to target filename', async () => {
      const tsconfigSpecPath = path.join(projectRoot, 'tsconfig.spec.json');
      const tsconfigTestPath = path.join(projectRoot, 'tsconfig.test.json');

      const baselineWithRename: TsBase = createTsconfigBase(
        'tsconfig.test.json',
        {
          renameFrom: 'tsconfig.spec.json',
          compilerOptions: obj.add({
            strict: true,
          }),
        },
      );

      vi.mocked(loadBaselineRc).mockResolvedValue([baselineWithRename]);

      // Create the spec file that should be renamed
      tree.write(
        tsconfigSpecPath,
        JSON.stringify({
          compilerOptions: { module: 'ESNext' },
        }),
      );

      const result = await syncBaseline(tree);

      // File should be renamed
      expect(tree.exists(tsconfigSpecPath)).toBe(false);
      expect(tree.exists(tsconfigTestPath)).toBe(true);

      // Content should be preserved and updated
      const renamedContent = JSON.parse(
        tree.read(tsconfigTestPath)?.toString() ?? '{}',
      );
      expect(renamedContent.compilerOptions?.module).toBe('ESNext');
      expect(renamedContent.compilerOptions?.strict).toBe(true);

      // Output should mention rename
      expect(result.outOfSyncMessage).toBeDefined();
      expect(result.outOfSyncMessage).toContain('tsconfig.test.json');
      expect(result.outOfSyncMessage).toContain('renamed from');
      expect(result.outOfSyncMessage).toContain('tsconfig.spec.json');
    });

    it('should overwrite target file if it already exists when renaming', async () => {
      const tsconfigSpecPath = path.join(projectRoot, 'tsconfig.spec.json');
      const tsconfigTestPath = path.join(projectRoot, 'tsconfig.test.json');

      const baselineWithRename: TsBase = createTsconfigBase(
        'tsconfig.test.json',
        {
          renameFrom: 'tsconfig.spec.json',
          compilerOptions: obj.add({
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

      const baselineWithRename: TsBase = createTsconfigBase(
        'tsconfig.test.json',
        {
          renameFrom: 'tsconfig.spec.json',
          compilerOptions: obj.add({
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
