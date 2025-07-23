import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../../types';
import type { UnifiedStats } from '../../unify/unified-stats.types';
import { applyGrouping } from './grouping';
import { DEFAULT_PRUNING_OPTIONS, createTree, pruneTree } from './tree';

describe('applyGrouping', () => {
  it('should group inputs by single pattern', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'src/main.ts',
            values: {
              path: 'src/main.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'src/utils.ts',
            values: {
              path: 'src/utils.ts',
              bytes: 50,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'dist/output.js',
            values: {
              path: 'dist/output.js',
              bytes: 200,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['src/**'], title: 'Source Files' }],
      ),
    ).toStrictEqual([
      {
        name: 'dist/output.js',
        values: {
          path: 'dist/output.js',
          bytes: 200,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
      {
        name: 'Source Files',
        values: {
          path: '',
          bytes: 150,
          modules: 2,
          type: 'group',
          icon: undefined,
        },
        children: [
          {
            name: 'src/main.ts',
            values: {
              path: 'src/main.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'src/utils.ts',
            values: {
              path: 'src/utils.ts',
              bytes: 50,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it('should group inputs by multiple patterns', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'src/components/Button.tsx',
            values: {
              path: 'src/components/Button.tsx',
              bytes: 80,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'src/utils/helper.ts',
            values: {
              path: 'src/utils/helper.ts',
              bytes: 40,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'tests/unit.test.ts',
            values: {
              path: 'tests/unit.test.ts',
              bytes: 60,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['src/**', 'tests/**'], title: 'Project Files' }],
      ),
    ).toStrictEqual([
      {
        name: 'Project Files',
        values: {
          bytes: 180,
          modules: 3,
          type: 'group',
          path: '',
          icon: undefined,
        },
        children: [
          {
            name: 'src/components/Button.tsx',
            values: {
              bytes: 80,
              modules: 1,
              type: 'static-import',
              path: 'src/components/Button.tsx',
            },
            children: [],
          },
          {
            name: 'tests/unit.test.ts',
            values: {
              bytes: 60,
              modules: 1,
              type: 'static-import',
              path: 'tests/unit.test.ts',
            },
            children: [],
          },
          {
            name: 'src/utils/helper.ts',
            values: {
              bytes: 40,
              modules: 1,
              type: 'static-import',
              path: 'src/utils/helper.ts',
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it('should group inputs with maxDepth', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'node_modules/react/index.js',
            values: {
              path: 'node_modules/react/index.js',
              bytes: 120,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'node_modules/lodash/core.js',
            values: {
              path: 'node_modules/lodash/core.js',
              bytes: 80,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['node_modules/**'], numSegments: 2 }],
      ),
    ).toStrictEqual([
      {
        name: 'react',
        values: {
          path: 'node_modules/react',
          bytes: 120,
          modules: 1,
          type: 'group',
          icon: '📁',
        },
        children: [
          {
            name: 'node_modules/react/index.js',
            values: {
              path: 'node_modules/react/index.js',
              bytes: 120,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
      {
        name: 'lodash',
        values: {
          path: 'node_modules/lodash',
          bytes: 80,
          modules: 1,
          type: 'group',
          icon: '📁',
        },
        children: [
          {
            name: 'node_modules/lodash/core.js',
            values: {
              path: 'node_modules/lodash/core.js',
              bytes: 80,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it('should add icons to nodes', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'src/main.ts',
            values: {
              path: 'src/main.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['src/**'], icon: '📦' }],
      ),
    ).toStrictEqual([
      {
        name: 'Group',
        values: {
          path: '',
          bytes: 100,
          modules: 1,
          type: 'group',
          icon: '📦',
        },
        children: [
          {
            name: 'src/main.ts',
            values: {
              path: 'src/main.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it('should add title to nodes', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'src/main.ts',
            values: {
              path: 'src/main.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['src/**'], title: 'Source Code' }],
      ),
    ).toStrictEqual([
      {
        name: 'Source Code',
        values: {
          path: '',
          bytes: 100,
          modules: 1,
          type: 'group',
          icon: undefined,
        },
        children: [
          {
            name: 'src/main.ts',
            values: {
              path: 'src/main.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it('should autoderive title from patterns', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'node_modules/react/index.js',
            values: {
              path: 'node_modules/react/index.js',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['node_modules/**'] }],
      ),
    ).toStrictEqual([
      {
        name: 'react',
        values: {
          path: '',
          bytes: 100,
          modules: 1,
          type: 'group',
          icon: undefined,
        },
        children: [
          {
            name: 'node_modules/react/index.js',
            values: {
              path: 'node_modules/react/index.js',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it('should separate packages into different groups with maxDepth', () => {
    expect(
      applyGrouping(
        [
          {
            name: 'packages/design-system/ui/button/src/button.component.ts',
            values: {
              path: 'packages/design-system/ui/button/src/button.component.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'packages/vanilla/lib/core/services/service.ts',
            values: {
              path: 'packages/vanilla/lib/core/services/service.ts',
              bytes: 80,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
          {
            name: 'packages/themepark/components/theme.ts',
            values: {
              path: 'packages/themepark/components/theme.ts',
              bytes: 60,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
        [{ patterns: ['packages/**'], numSegments: 2 }],
      ),
    ).toStrictEqual([
      {
        name: 'design-system',
        values: {
          path: 'packages/design-system',
          bytes: 100,
          modules: 1,
          type: 'group',
          icon: '📁',
        },
        children: [
          {
            name: 'packages/design-system/ui/button/src/button.component.ts',
            values: {
              path: 'packages/design-system/ui/button/src/button.component.ts',
              bytes: 100,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
      {
        name: 'vanilla',
        values: {
          path: 'packages/vanilla',
          bytes: 80,
          modules: 1,
          type: 'group',
          icon: '📁',
        },
        children: [
          {
            name: 'packages/vanilla/lib/core/services/service.ts',
            values: {
              path: 'packages/vanilla/lib/core/services/service.ts',
              bytes: 80,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
      {
        name: 'themepark',
        values: {
          path: 'packages/themepark',
          bytes: 60,
          modules: 1,
          type: 'group',
          icon: '📁',
        },
        children: [
          {
            name: 'packages/themepark/components/theme.ts',
            values: {
              path: 'packages/themepark/components/theme.ts',
              bytes: 60,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
    ]);
  });
});

describe('pruneTree', () => {
  it('should add rest group if maxChildren exceeded', () => {
    expect(
      pruneTree(
        {
          children: [
            {
              name: 'lib/moduleA.js',
              values: {
                path: 'lib/moduleA.js',
                bytes: 150,
                modules: 2,
                type: 'static-import',
              },
              children: [],
            },
            {
              name: 'lib/moduleB.js',
              values: {
                path: 'lib/moduleB.js',
                bytes: 100,
                modules: 1,
                type: 'static-import',
              },
              children: [],
            },
          ],
        },
        DEFAULT_PRUNING_OPTIONS,
      ),
    ).toStrictEqual({
      children: [
        {
          name: 'lib/moduleA.js',
          values: {
            path: 'lib/moduleA.js',
            bytes: 150,
            modules: 2,
            type: 'static-import',
          },
          children: [],
        },
        {
          name: 'lib/moduleB.js',
          values: {
            path: 'lib/moduleB.js',
            bytes: 100,
            modules: 1,
            type: 'static-import',
          },
          children: [],
        },
      ],
    });
  });

  it('should add rest group if maxSize is exceeded', () => {
    expect(
      pruneTree(
        {
          children: [
            {
              name: 'large-module.js',
              values: {
                path: 'large-module.js',
                bytes: 1000,
                modules: 1,
                type: 'static-import',
              },
              children: [],
            },
            {
              name: 'small-file1.js',
              values: {
                path: 'small-file1.js',
                bytes: 50,
                modules: 1,
                type: 'static-import',
              },
              children: [],
            },
            {
              name: 'small-file2.js',
              values: {
                path: 'small-file2.js',
                bytes: 30,
                modules: 1,
                type: 'static-import',
              },
              children: [],
            },
          ],
        },
        { ...DEFAULT_PRUNING_OPTIONS, minSize: 100 },
      ),
    ).toStrictEqual({
      children: [
        {
          name: 'large-module.js',
          values: {
            path: 'large-module.js',
            bytes: 1000,
            modules: 1,
            type: 'static-import',
          },
          children: [],
        },
        {
          name: '...',
          values: {
            path: '',
            bytes: 80,
            modules: 2,
            type: 'group',
            icon: '📁',
          },
          children: [],
        },
      ],
    });
  });

  it('should format modules', () => {
    expect(
      pruneTree(
        {
          children: [
            {
              name: 'components/Header.vue',
              values: {
                path: 'components/Header.vue',
                bytes: 90,
                modules: 3,
                type: 'static-import',
              },
              children: [],
            },
            {
              name: 'components/Footer.vue',
              values: {
                path: 'components/Footer.vue',
                bytes: 70,
                modules: 2,
                type: 'static-import',
              },
              children: [],
            },
          ],
        },
        DEFAULT_PRUNING_OPTIONS,
      ),
    ).toStrictEqual({
      children: [
        {
          name: 'components/Header.vue',
          values: {
            path: 'components/Header.vue',
            bytes: 90,
            modules: 3,
            type: 'static-import',
          },
          children: [],
        },
        {
          name: 'components/Footer.vue',
          values: {
            path: 'components/Footer.vue',
            bytes: 70,
            modules: 2,
            type: 'static-import',
          },
          children: [],
        },
      ],
    });
  });

  it('should format pathLength', () => {
    const path = 'very/deep/nested/path/file.js';

    expect(
      pruneTree(
        {
          children: [
            {
              name: path,
              values: { path, bytes: 100, modules: 1, type: 'static-import' },
              children: [],
            },
          ],
        },
        { ...DEFAULT_PRUNING_OPTIONS, pathLength: 20 },
      ),
    ).toStrictEqual({
      children: [
        {
          name: path,
          values: { path, bytes: 100, modules: 1, type: 'static-import' },
          children: [],
        },
      ],
    });
  });
});

describe('createTree', () => {
  it('should create a tree', () => {
    const mockStats: UnifiedStats = {
      'main.js': {
        path: 'main.js',
        bytes: 1024,
        imports: [],
        inputs: {
          'src/main.ts': {
            bytes: 512,
          },
        },
        entryPoint: 'src/main.ts',
      },
    };

    const result = createTree(mockStats, {
      title: 'Test Bundle',
      groups: [],
      pruning: {},
    });

    expect(result).toMatchObject({
      type: 'basic',
      title: 'Test Bundle',
      root: {
        name: '🗂️ Test Bundle',
        values: expect.any(Object),
        children: expect.any(Array),
      },
    });
  });
});
