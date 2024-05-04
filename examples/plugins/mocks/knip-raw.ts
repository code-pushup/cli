import {ReporterOptions} from "knip";

export const rawReport: Pick<ReporterOptions, 'report' | 'issues' | 'options'> = {
  report: {
    files: true,
    dependencies: true,
    devDependencies: true,
    optionalPeerDependencies: true,
    unlisted: true,
    binaries: true,
    unresolved: true,
    exports: true,
    nsExports: false,
    types: true,
    nsTypes: false,
    enumMembers: true,
    classMembers: false,
    duplicates: true,
  },
  issues: {
    files: new Set(['code-pushup.json']),
    dependencies: {
      'package.json': {
        'cli-table3': {
          type: 'dependencies',
          filePath:
            '/Users/username/Projects/code-pushup/package.json',
          symbol: 'cli-table3',
          severity: 'error',
        },
      }
    },
    devDependencies: {
      'package.json': {
        '@trivago/prettier-plugin-sort-imports': {
          type: 'devDependencies',
          filePath:
            '/Users/username/Projects/code-pushup/package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      },
    },
    optionalPeerDependencies: {
      'package.json': {
        'ts-node': {
          type: 'devDependencies',
          filePath:
            '/Users/username/Projects/code-pushup/package.json',
          symbol: 'ts-node',
          severity: 'error',
        },
      },
    },
    unlisted: {
      'packages/plugin-lighthouse/.eslintrc.json': {
        'jsonc-eslint-parser': {
          type: 'unlisted',
          filePath:
            '/Users/username/Projects/code-pushup/packages/plugin-lighthouse/.eslintrc.json',
          symbol: 'jsonc-eslint-parser',
          severity: 'error',
        },
      },
      '.eslintrc.json': {
        'jsonc-eslint-parser': {
          type: 'unlisted',
          filePath:
            '/Users/username/Projects/code-pushup/.eslintrc.json',
          symbol: 'jsonc-eslint-parser',
          severity: 'error',
        },
      }
    },
    binaries: {},
    unresolved: {},
    exports: {
      'packages/models/src/lib/category-config.ts': {
        duplicateErrorMsg: {
          type: 'exports',
          filePath:
            '/Users/username/Projects/code-pushup/packages/models/src/lib/category-config.ts',
          symbol: 'duplicateErrorMsg',
          symbolType: 'function',
          pos: 1571,
          line: 54,
          col: 17,
          severity: 'error',
        },
      },
    },
    nsExports: {},
    types: {
      'packages/models/src/lib/group.ts': {
        GroupMeta: {
          type: 'types',
          filePath:
            '/Users/username/Projects/code-pushup/packages/models/src/lib/group.ts',
          symbol: 'GroupMeta',
          symbolType: 'type',
          pos: 701,
          line: 26,
          col: 13,
          severity: 'error',
        },
      },
    },
    nsTypes: {},
    enumMembers: {},
    classMembers: {},
    duplicates: {
      'packages/nx-plugin/src/generators/init/generator.ts': {
        'initGenerator|default': {
          type: 'duplicates',
          filePath:
            '/Users/username/Projects/code-pushup/packages/nx-plugin/src/generators/init/generator.ts',
          symbol: 'initGenerator|default',
          symbols: [
            {
              symbol: 'initGenerator',
              line: 76,
              col: 2,
              pos: 2144,
            },
            {
              symbol: 'default',
              line: 91,
              col: 15,
              pos: 2479,
            },
          ],
          severity: 'error',
        },
      },
    },
  },
  options: '',
};
