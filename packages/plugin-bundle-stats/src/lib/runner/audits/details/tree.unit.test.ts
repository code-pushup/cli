import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../../types.js';
import { type StatsTreeNode, applyGrouping } from './grouping.js';

describe('applyGrouping', () => {
  it('should group inputs by single pattern', () => {
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [
        { includeInputs: ['src/**'], title: 'Source Files' },
      ]),
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
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [
        { includeInputs: ['src/**', 'tests/**'], title: 'Project Files' },
      ]),
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

  it('should group inputs with include/exclude patterns', () => {
    const nodes: StatsTreeNode[] = [
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
        name: 'src/components/Button.test.tsx',
        values: {
          path: 'src/components/Button.test.tsx',
          bytes: 40,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
      {
        name: 'src/utils/helper.ts',
        values: {
          path: 'src/utils/helper.ts',
          bytes: 60,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
    ];

    expect(
      applyGrouping(nodes, [
        {
          title: 'Source Code',
          includeInputs: ['src/**'],
          excludeInputs: ['**/*.test.*'],
        },
      ]),
    ).toStrictEqual([
      {
        name: 'Source Code',
        values: {
          path: '',
          bytes: 140,
          modules: 2,
          type: 'group',
          icon: undefined,
        },
        children: [
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

  it('should group inputs with numSegments', () => {
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [
        { includeInputs: ['node_modules/**'], numSegments: 2 },
      ]),
    ).toStrictEqual([
      {
        name: 'react',
        values: {
          path: 'node_modules/react',
          bytes: 120,
          modules: 1,
          type: 'group',
          icon: undefined,
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
          icon: undefined,
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
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [{ includeInputs: ['src/**'], icon: '📦' }]),
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
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [
        { includeInputs: ['src/**'], title: 'Source Code' },
      ]),
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
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [{ includeInputs: ['node_modules/**'] }]),
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

  it('should separate packages into different groups with numSegments', () => {
    const nodes: StatsTreeNode[] = [
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
    ];

    expect(
      applyGrouping(nodes, [
        { includeInputs: ['packages/**'], numSegments: 2 },
      ]),
    ).toStrictEqual([
      {
        name: 'design-system',
        values: {
          path: 'packages/design-system',
          bytes: 100,
          modules: 1,
          type: 'group',
          icon: undefined,
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
          icon: undefined,
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
          icon: undefined,
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

  it('should handle complex include/exclude combinations', () => {
    const nodes: StatsTreeNode[] = [
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
        name: 'src/components/Button.test.tsx',
        values: {
          path: 'src/components/Button.test.tsx',
          bytes: 40,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
      {
        name: 'src/components/Modal.spec.tsx',
        values: {
          path: 'src/components/Modal.spec.tsx',
          bytes: 30,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
      {
        name: 'node_modules/react/index.js',
        values: {
          path: 'node_modules/react/index.js',
          bytes: 200,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
    ];

    expect(
      applyGrouping(nodes, [
        {
          title: 'Source Code',
          includeInputs: ['src/**'],
          excludeInputs: ['**/*.test.*', '**/*.spec.*'],
          icon: '📦',
        },
        {
          title: 'Dependencies',
          includeInputs: ['node_modules/**'],
          icon: '🔗',
        },
      ]),
    ).toStrictEqual([
      {
        name: 'Dependencies',
        values: {
          path: '',
          bytes: 200,
          modules: 1,
          type: 'group',
          icon: '🔗',
        },
        children: [
          {
            name: 'node_modules/react/index.js',
            values: {
              path: 'node_modules/react/index.js',
              bytes: 200,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          },
        ],
      },
      {
        name: 'Source Code',
        values: {
          path: '',
          bytes: 80,
          modules: 1,
          type: 'group',
          icon: '📦',
        },
        children: [
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
        ],
      },
    ]);
  });

  it('should group inputs by multiple patterns with icons', () => {
    const nodes: StatsTreeNode[] = [
      {
        name: 'dist/output.js',
        values: {
          path: 'dist/output.js',
          bytes: 300,
          modules: 1,
          type: 'static-import',
        },
        children: [],
      },
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
    ];

    expect(
      applyGrouping(nodes, [
        {
          includeInputs: ['src/main.ts', 'src/utils.ts'],
          title: 'Source Files',
          icon: '📄',
        },
      ]),
    ).toStrictEqual([
      {
        name: 'dist/output.js',
        values: {
          path: 'dist/output.js',
          bytes: 300,
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
          icon: '📄',
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
});
